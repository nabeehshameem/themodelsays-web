#!/usr/bin/env python3
"""
check_site_routes.py

Verify that every static page in public/ is actually reachable, indexable and
consistently addressed. Run from the repo root:

    python scripts/check_site_routes.py

WHY THIS EXISTS

Adding a page to public/ is three steps, not one: the file, a rewrite in
vercel.json so the clean URL resolves, and a sitemap entry so it gets crawled.
Miss the rewrite and the URL silently serves index.html instead - the link looks
fine, returns 200, and shows the wrong page. That has now happened twice on this
site, and both times it was found by hand rather than by anything automatic.

Checks:
  1. every public/*.html (except index) has a vercel.json rewrite
  2. that rewrite is ordered BEFORE the /(.*) catch-all
  3. every indexable page (no robots=noindex) is in sitemap.xml
  4. no noindex page is in the sitemap
  5. every canonical tag uses the same host as the sitemap
  6. every sitemap URL corresponds to a real page

Exit 1 on any failure.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
VERCEL = ROOT / "vercel.json"
SITEMAP = PUBLIC / "sitemap.xml"

# Pages that legitimately have no clean-URL route of their own.
SKIP = {"index.html"}

problems: list[str] = []
notes: list[str] = []


def slug(page: Path) -> str:
    return "/" + page.stem


def main() -> None:
    if not PUBLIC.is_dir():
        raise SystemExit("no public/ directory - run from the repo root")

    pages = sorted(p for p in PUBLIC.glob("*.html") if p.name not in SKIP)
    if not pages:
        raise SystemExit("no static pages found in public/")

    rewrites = json.loads(VERCEL.read_text(encoding="utf-8")).get("rewrites", [])
    sources = [r.get("source") for r in rewrites]
    catch_all = sources.index("/(.*)") if "/(.*)" in sources else len(sources)

    sitemap_txt = SITEMAP.read_text(encoding="utf-8") if SITEMAP.exists() else ""
    sitemap_urls = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", sitemap_txt)
    hosts = {re.sub(r"https?://([^/]+).*", r"\1", u) for u in sitemap_urls}
    if len(hosts) > 1:
        problems.append(f"sitemap mixes hosts: {sorted(hosts)}")
    host = next(iter(hosts), "www.themodelsays.com")
    sitemap_paths = {re.sub(r"https?://[^/]+", "", u).rstrip("/") or "/"
                     for u in sitemap_urls}

    for page in pages:
        body = page.read_text(encoding="utf-8", errors="replace")
        path = slug(page)
        noindex = bool(re.search(
            r'<meta[^>]+name=["\']robots["\'][^>]*content=["\'][^"\']*noindex',
            body, re.I))

        # 1 + 2: routable, and before the catch-all
        if path not in sources:
            problems.append(
                f"{page.name}: no vercel.json rewrite for {path} - the URL "
                "will silently serve index.html instead of this page")
        elif sources.index(path) > catch_all:
            problems.append(
                f"{page.name}: rewrite for {path} comes after the /(.*) "
                "catch-all, so it never matches")

        # 3 + 4: sitemap membership matches indexability
        in_sitemap = path in sitemap_paths
        if noindex and in_sitemap:
            problems.append(
                f"{page.name}: marked noindex but listed in sitemap.xml")
        elif not noindex and not in_sitemap:
            problems.append(
                f"{page.name}: indexable but missing from sitemap.xml")
        elif noindex:
            notes.append(f"{page.name}: noindex (intentionally not in sitemap)")

        # 5: canonical host agreement
        m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)',
                      body, re.I)
        if not m:
            problems.append(f"{page.name}: no canonical tag")
        else:
            c_host = re.sub(r"https?://([^/]+).*", r"\1", m.group(1))
            if c_host != host:
                problems.append(
                    f"{page.name}: canonical host {c_host} != sitemap host "
                    f"{host} - contradictory signals to crawlers")

    # 6: no sitemap entries pointing at nothing
    known = {slug(p) for p in pages} | {"/"}
    for p in sorted(sitemap_paths - known):
        problems.append(f"sitemap lists {p} but no matching page exists")

    print(f"checked {len(pages)} static pages against vercel.json and sitemap.xml\n")
    for n in notes:
        print(f"[NOTE] {n}")
    for p in problems:
        print(f"[FAIL] {p}")
    if not problems:
        print("[PASS] every page is routable, indexed consistently and "
              "canonically addressed")
    print(f"\n{len(problems)} problem(s)")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
