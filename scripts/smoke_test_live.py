#!/usr/bin/env python3
"""
smoke_test_live.py

Headless smoke test for the deployed site. Verifies:
  1. The JS bundle is served as application/javascript (not text/html, which
     indicates a missing hashed asset being served by the SPA catch-all).
  2. The Railway API is reachable and /api/fpl/model/season returns 200.
  3. The ALLOWED_ORIGINS CORS header allows the site origin.

Run after every production deploy, or in CI:
  python scripts/smoke_test_live.py

Exit 1 on any failure.
"""

from __future__ import annotations

import re
import sys
import urllib.request
import urllib.error
from html.parser import HTMLParser

SITE = "https://www.themodelsays.com"
RAILWAY_SEASON = "https://web-production-373bce.up.railway.app/api/fpl/model/season"


class ScriptSrcParser(HTMLParser):
    """Pull the first non-inline script src from the page HTML."""
    def __init__(self):
        super().__init__()
        self.src: str | None = None

    def handle_starttag(self, tag, attrs):
        if tag == "script" and self.src is None:
            attrs_d = dict(attrs)
            src = attrs_d.get("src", "")
            if src and "/assets/" in src and not src.endswith(".css"):
                self.src = src


def fetch(url: str, *, origin: str | None = None, method: str = "GET") -> tuple[int, dict, bytes]:
    req = urllib.request.Request(url, method=method)
    if origin:
        req.add_header("Origin", origin)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, dict(resp.headers), resp.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()


def main() -> None:
    problems: list[str] = []

    # ── 1. Fetch the page and find the main JS bundle ──────────────────────
    print(f"fetching {SITE} ...")
    status, headers, body = fetch(SITE)
    if status not in (200, 304):
        problems.append(f"site returned HTTP {status}")
    else:
        html = body.decode("utf-8", errors="replace")
        parser = ScriptSrcParser()
        parser.feed(html)
        if not parser.src:
            problems.append("could not find a /assets/*.js <script src> in the page HTML")
        else:
            js_url = parser.src if parser.src.startswith("http") else f"{SITE}{parser.src}"
            print(f"checking bundle MIME type: {js_url}")
            js_status, js_headers, _ = fetch(js_url)
            ct = js_headers.get("Content-Type", "")
            if js_status != 200:
                problems.append(
                    f"JS bundle {js_url} returned HTTP {js_status} — "
                    "likely a missing hashed asset served by the SPA catch-all"
                )
            elif "javascript" not in ct and "octet-stream" not in ct:
                problems.append(
                    f"JS bundle served with wrong MIME type: {ct!r} "
                    "(catch-all is serving index.html instead of the actual JS)"
                )
            else:
                print(f"  [PASS] bundle MIME type OK ({ct.split(';')[0].strip()})")

    # ── 2. Railway /api/fpl/model/season reachable ─────────────────────────
    print(f"checking Railway endpoint: {RAILWAY_SEASON}")
    api_status, api_headers, api_body = fetch(RAILWAY_SEASON, origin=SITE)
    if api_status != 200:
        problems.append(f"Railway /api/fpl/model/season returned HTTP {api_status}")
    else:
        print(f"  [PASS] Railway API 200 OK")

    # ── 3. CORS header allows the site origin ─────────────────────────────
    acao = api_headers.get("Access-Control-Allow-Origin", "")
    if acao not in (SITE, "*"):
        problems.append(
            f"CORS: Access-Control-Allow-Origin is {acao!r}, expected {SITE!r} or '*'. "
            "Browser will silently block cross-origin responses from this endpoint."
        )
    else:
        print(f"  [PASS] CORS origin header OK ({acao})")

    # ── Report ─────────────────────────────────────────────────────────────
    print()
    for p in problems:
        print(f"[FAIL] {p}")
    if not problems:
        print("[PASS] all smoke checks passed")
    print(f"\n{len(problems)} problem(s)")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
