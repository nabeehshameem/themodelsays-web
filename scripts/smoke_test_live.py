#!/usr/bin/env python3
"""
smoke_test_live.py

Headless smoke test for the deployed site. Verifies:
  1. The JS bundle is served as application/javascript (not text/html, which
     indicates a missing hashed asset being served by the SPA catch-all).
  2. If the main bundle references a prerender-*.js chunk (static import), that
     chunk exports real content — not a stub — so React is not silently broken.
  3. The Railway API is reachable and /api/fpl/model/season returns 200.
  4. The ALLOWED_ORIGINS CORS header allows the site origin.

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
            return resp.status, {k.lower(): v for k, v in resp.headers.items()}, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()}, e.read()


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
            js_status, js_headers, js_body = fetch(js_url)
            ct = js_headers.get("content-type", "")
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

            # ── 2. Prerender chunk integrity check ─────────────────────────
            # vite-prerender-plugin causes Vite to put React into the prerender
            # chunk as a shared module. Stubbing or deleting that chunk removes
            # React → the whole app silently breaks. Detect this early.
            if js_status == 200:
                js_text = js_body.decode("utf-8", errors="replace")
                prerender_refs = re.findall(r'["\'](\./prerender-[A-Za-z0-9_-]+\.js)["\']', js_text)
                if prerender_refs:
                    print(f"  bundle references prerender chunk(s): {prerender_refs}")
                    for ref in prerender_refs:
                        chunk_url = re.sub(r'/assets/[^/]+$', ref[1:], js_url)
                        # ref is like "./prerender-Abc123.js"; build absolute URL
                        base = js_url.rsplit("/", 1)[0]
                        chunk_url = f"{base}/{ref.lstrip('./')}"
                        c_status, c_headers, c_body = fetch(chunk_url)
                        c_text = c_body.decode("utf-8", errors="replace").strip()
                        if c_status != 200:
                            problems.append(
                                f"Prerender chunk {chunk_url} returned HTTP {c_status} — "
                                "catch-all is serving HTML → MIME error in browser"
                            )
                        elif c_text == "export const prerender=()=>{};":
                            problems.append(
                                f"Prerender chunk {ref} is a no-op stub but the main bundle "
                                "statically imports React from it — React will be undefined "
                                "and the app will fail to mount. Remove vite-prerender-plugin "
                                "or use manualChunks to keep React out of the prerender chunk."
                            )
                        elif len(c_text) < 500:
                            problems.append(
                                f"Prerender chunk {ref} looks suspiciously small ({len(c_text)} bytes) — "
                                "expected full React code if the main bundle imports from it"
                            )
                        else:
                            print(f"  [PASS] prerender chunk OK ({len(c_text)} bytes)")
                else:
                    print(f"  [PASS] no prerender chunk references in main bundle")

    # ── 3. Railway /api/fpl/model/season reachable ─────────────────────────
    print(f"checking Railway endpoint: {RAILWAY_SEASON}")
    api_status, api_headers, api_body = fetch(RAILWAY_SEASON, origin=SITE)
    if api_status != 200:
        problems.append(f"Railway /api/fpl/model/season returned HTTP {api_status}")
    else:
        print(f"  [PASS] Railway API 200 OK")
        print(f"  CORS header: {api_headers.get('access-control-allow-origin', '(not present)')}")

    # ── 4. CORS header allows the site origin ─────────────────────────────
    acao = api_headers.get("access-control-allow-origin", "")
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
