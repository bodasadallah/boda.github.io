#!/usr/bin/env python3
import re
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[2]
POSTS_SRC = ROOT / "blogs" / "posts"
BLOGS_YAML = ROOT / "blogs" / "blogs.yaml"
POSTS_DST = ROOT / "blog-hugo" / "content" / "posts"


def normalize_title(title: str) -> str:
    title = (title or "").lower()
    title = re.sub(r"[^a-z0-9\s]", "", title)
    title = re.sub(r"\s+", " ", title).strip()
    return title


def create_blog_id(title: str, date: str) -> str:
    cleaned_title = re.sub(r"[^a-zA-Z0-9\s]", "", (title or "").lower())
    cleaned_title = re.sub(r"\s+", "-", cleaned_title.strip())
    year = (date or "").split("-")[0]
    return f"{cleaned_title}-{year}" if cleaned_title else year


def extract_frontmatter(text: str):
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?", text, flags=re.DOTALL)
    if not match:
        return {}, text
    frontmatter = yaml.safe_load(match.group(1)) or {}
    body = text[match.end():]
    return frontmatter, body


def strip_second_frontmatter(body: str):
    stripped = body.lstrip()
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?", stripped, flags=re.DOTALL)
    if match:
        return stripped[match.end():]
    return body


def normalize_thumbnail(path: str) -> str:
    if not path:
        return ""
    if path.startswith("http://") or path.startswith("https://"):
        return path
    path = path.lstrip("./")
    if path.startswith("blogs/"):
        return "/" + path
    if path.startswith("images/"):
        return "/blogs/" + path
    return "/blogs/images/generated/" + path.split("/")[-1]


def body_summary(body: str, max_len: int = 220) -> str:
    text = re.sub(r"```[\s\S]*?```", "", body)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"\n{2,}", "\n\n", text).strip()
    paragraph = text.split("\n\n", 1)[0].strip()
    if len(paragraph) <= max_len:
        return paragraph
    return paragraph[:max_len].rsplit(" ", 1)[0] + "..."


def main():
    POSTS_DST.mkdir(parents=True, exist_ok=True)

    blogs_index = yaml.safe_load(BLOGS_YAML.read_text(encoding="utf-8")) or []
    index_lookup = {
        (normalize_title(item.get("title", "")), str(item.get("date", ""))): item
        for item in blogs_index
    }

    for source_path in sorted(POSTS_SRC.glob("*.md")):
        if source_path.name.startswith("_"):
            continue
        raw = source_path.read_text(encoding="utf-8")
        meta, body = extract_frontmatter(raw)
        body = strip_second_frontmatter(body).strip() + "\n"

        title = str(meta.get("title", "")).strip()
        date = str(meta.get("date", "")).strip()

        index_item = index_lookup.get((normalize_title(title), date), {})

        slug = index_item.get("id") or meta.get("permalink") or create_blog_id(title, date)
        short_title = index_item.get("short_title") or meta.get("short_title") or title
        summary = (index_item.get("excerpt") or meta.get("excerpt") or "").strip()
        if summary.lower().startswith("title:") or len(summary) < 10:
            summary = body_summary(body)
        thumbnail = normalize_thumbnail(index_item.get("thumbnail") or meta.get("thumbnail") or "")

        body = body.replace("](blogs/images/", "](/blogs/images/")
        body = body.replace('src="blogs/images/', 'src="/blogs/images/')

        out_frontmatter = {
            "title": title,
            "date": date,
            "slug": slug,
            "summary": summary,
            "short_title": short_title,
            "thumbnail": thumbnail,
            "draft": False,
        }

        fm_text = yaml.safe_dump(out_frontmatter, sort_keys=False, allow_unicode=True).strip()
        output = f"---\n{fm_text}\n---\n\n{body}"

        destination = POSTS_DST / source_path.name
        destination.write_text(output, encoding="utf-8")
        print(f"Migrated: {source_path.name} -> {destination.name} ({slug})")


if __name__ == "__main__":
    main()
