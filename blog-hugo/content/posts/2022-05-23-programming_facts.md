---
title: Programming Facts
date: '2022-05-23'
slug: programming-facts-2022
summary: Some facts that I learned by time
short_title: Programming Facts
thumbnail: /blogs/images/generated/programming_facts.png
draft: false
---

# Intro

- this is intended to be some kind or reference to go through whenever I face some kind of bug, or error, that I don't know how to solve.usually these kinds of error that doesn't make sense, or we don't know the cause of them, and the worst it, that we don't find many ppl facing the same issue, so internet can't be so useful then.
- I learned theses facts the hard way, spending so much time trying to figure out the root of the issue.

# Debugging Facts

- here are some tips, to help whenever you are facing some error, trying get a package to work, or you these kinds of error that takes you life few days, you know.

## Package installation issues

### Python version

- this might sound trivial, but every package version, only works with some python versions
- so you should run `pip install package-name==` to get the package versions supported by your python version

### Update Pip

- whenever there's a dependency conflict, or versions conflict, and you can't install a package, then check your pip and update it if possible
- I spent like 4 days clueless why a simple package that I installed a week before, won't install now, like out of a sudden, it won't install anymore, due to dependency packages conflict
- when I upgraded pip, it simply worked

### Check for broken installations

- many times we would try to install some something, then for whatever reason, it wouldn't complete successful. But then we would try to install again, and we would encounter strange errors, that we don't know the root for them.
- there error could be because there's a broken installation, that messed things up.
- so, when we delete, or remove this broken installation, and install again, it just works.
