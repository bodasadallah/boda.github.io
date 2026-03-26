# Editing & Adding Content

## Quick Start

### Add a New Blog Post
1. Create a markdown file in `blog-hugo/content/posts/` with format: `YYYY-MM-DD-slug.md`
2. Add frontmatter:
```yaml
---
title: "Post Title"
date: 2026-03-26
slug: "my-slug"
summary: "Brief description for card preview"
draft: false
---
```
3. Write your content below the frontmatter.
4. Rebuild: `.tools/bin/hugo --source blog-hugo --cleanDestinationDir`

### Edit an Existing Post
- Edit the `.md` file in `blog-hugo/content/posts/`
- Rebuild Hugo to regenerate output

### Add Post Thumbnail
- Place image in `blog-hugo/content/posts/` or subdirectory
- Reference in markdown: `![alt text](image.png)` or use in frontmatter if theme supports it

## Main Site Content

### Profile Name & Location
- File: `content/site/config.yaml`
- Fields: `site.name` (header), `site.footer_name` (footer), `site.page_title` (browser tab), `site.nationality_flags` (location text)

### Bio
- File: `content/site/bio.md`
- Markdown format, auto-loaded on homepage

### Publications
- File: `content/publications/publications.yaml`
- Add entry with: `id`, `title`, `authors`, `venue`, `conference`, `paper` (URL), `code` (optional), `image` (thumbnail path)
- Thumbnails stored in: `content/publications/files/`

### Timeline
- File: `content/timeline/timeline.yaml`
- Format: `title`, `date_range`, `affiliation`, `location`, `logo` (icon path)

### Media Highlights
- File: `content/media/media.yaml`
- Format: `title`, `date`, `subtitle`, `link`, `platform`

## Blog Settings

### Blog Title & Branding
- File: `blog-hugo/config.toml`
- Fields to update:
  - `title` – main site title
  - `[params.title]` – params title
  - `[params.app.title]` – app/meta title
  - `[params.header.title.name]` – header display text
  - `[params.author.name]` – author byline on posts

### Blog Home Subtitle
- File: `blog-hugo/config.toml`
- Field: `[params.home.profile.subtitle]`

### Menu Links
- File: `blog-hugo/config.toml`
- Section: `[menu]` – adjust `name` and `url` for "Posts" and "Home"

## Preview & Build

### Local Preview (Main Site)
- Open `index.html` in browser (or use VS Code Live Server)

### Local Preview (Blog)
- Run: `.tools/bin/hugo server --source blog-hugo`
- Open the local URL (usually http://localhost:1313)

### Deploy
- Build blog: `.tools/bin/hugo --source blog-hugo --cleanDestinationDir`
- Output is in `blogs/` — ready for GitHub Pages
- Commit & push to deploy

## File Structure

```
.
├── index.html                          # Main site (static)
├── css/style.css                       # Main site styles
├── js/main.js                          # Main site logic
├── content/
│   ├── site/                           # Main site content
│   │   ├── config.yaml                 # Site metadata & design
│   │   ├── bio.md                      # Profile bio
│   │   ├── CV.pdf
│   │   └── icons/
│   ├── publications/                   # Publications list & thumbnails
│   │   ├── publications.yaml
│   │   └── files/
│   ├── timeline/                       # Experience timeline
│   │   └── timeline.yaml
│   └── media/                          # News/media highlights
│       └── media.yaml
├── blog-hugo/                          # Hugo blog source
│   ├── config.toml                     # Hugo config + LoveIt settings
│   ├── content/posts/                  # Blog post markdown
│   ├── layouts/                        # Custom template overrides
│   ├── themes/LoveIt/                  # LoveIt theme
│   └── scripts/
│       └── migrate_posts_to_hugo.py    # Legacy post importer
└── blogs/                              # Generated blog output (do not edit)
    └── [generated HTML pages]
```

## Tips

- **Post slug:** Remove date prefix from filename; used for URL (e.g., `2026-03-26-my-post.md` → `/my-post/`)
- **Assets:** Keep images, PDFs, etc. in `blog-hugo/content/posts/` for easy reference
- **Draft posts:** Add `draft: true` to frontmatter to hide from builds
- **Multiple languages:** LoveIt supports i18n; see `blog-hugo/config.toml` [languages] section
- **CSS/JS:** Main site styles in `css/style.css`; blog styles in `blog-hugo/themes/LoveIt/` (don't edit theme directly—use layout overrides)

## Common Tasks

| Task | File | Action |
|------|------|--------|
| Change blog title | `blog-hugo/config.toml` | Edit `title`, `params.title`, `params.app.title`, `params.header.title.name` |
| Add publication | `content/publications/publications.yaml` | Add YAML entry + thumbnail to `files/` |
| Update bio | `content/site/bio.md` | Edit markdown |
| Change author name | `blog-hugo/config.toml` | Edit `[params.author].name` |
| Add social link | `content/site/config.yaml` | Add to `contacts` array |
| New blog post | `blog-hugo/content/posts/` | Create `.md` file with date prefix |

