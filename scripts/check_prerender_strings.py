#!/usr/bin/env python3
"""
check_prerender_strings.py

Verify that no waiting-state strings were baked into the prerendered HTML.

    python scripts/check_prerender_strings.py

WHY THIS EXISTS

The prerenderer captures the first render of every React component. Any
component that initialises with a loading/pending/coming-soon state ships
that string to every crawler and to every visitor whose client-side fetch
fails — which is exactly what happened with ToolsPanel and ProjectionsPanel
(both initialised at useState('loading'), so Vercel served "Loading GW
tools…" and "Loading the model's projections…" as permanent content).

The rule derived from that incident: no component may initialise into a
state it would not want indexed. This script enforces it by grepping the
built dist/index.html for a blocklist of waiting-state strings. Run it in
CI after `npm run build` and before deploy.

Exit 1 on any match.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT  = Path(__file__).resolve().parent.parent
DIST  = ROOT / "dist" / "index.html"

# Strings that must never appear in the prerendered output.
# These patterns are case-insensitive; each must be specific enough to avoid
# matching intentional body copy (e.g. "coming soon" in a date blurb).
BANNED: list[tuple[str, str]] = [
    # React loading sentinels
    (r"Loading GW tools",           "ToolsPanel loading state baked in"),
    (r"Loading the model",          "ProjectionsPanel loading state baked in"),
    (r"Loading…",              "Generic 'Loading…' baked in"),
    # Vague time copy that names no event
    (r"coming soon",                "Vague 'coming soon' copy baked in — name a date or event"),
    (r"check back later",           "'Check back later' baked in — empty state must name what changes it"),
    (r"not yet available",          "'Not yet available' baked in — name when it will be"),
    # Bare spinner / placeholder text
    (r"Loading\.\.\.",              "Trailing-dots loading text baked in"),
]


def main() -> None:
    if not DIST.exists():
        raise SystemExit(
            f"dist/index.html not found at {DIST}\n"
            "Run 'npm run build' first, then re-run this check."
        )

    # The prerender chunk must be replaced with a no-op stub (not deleted — the
    # main bundle may import it by hash, and deleting the file causes Vercel's
    # catch-all to serve text/html → MIME error → React never mounts).
    # Verify the stub is in place and is trivially small (< 200 bytes).
    import glob as _glob
    chunk_files = _glob.glob(str(ROOT / "dist" / "prerender-*.js")) + \
                  _glob.glob(str(ROOT / "dist" / "assets" / "prerender-*.js"))
    for cf in chunk_files:
        size = Path(cf).stat().st_size
        if size > 200:
            raise SystemExit(
                f"[FAIL] prerender chunk {Path(cf).name} is {size} bytes — "
                "dropPrerenderChunk did not stub it. The full SSR bundle will "
                "be downloaded by every visitor. Check vite.config.js."
            )
    if chunk_files:
        print(f"prerender chunk(s) stubbed: {', '.join(Path(f).name for f in chunk_files)}")

    html = DIST.read_text(encoding="utf-8", errors="replace")
    problems: list[str] = []

    # A healthy prerender contains real prose — hero text, section headings,
    # player names from committed predictions. Below ~8,000 chars the prerenderer
    # either silently bailed out or returned a near-empty shell. Crawlers and
    # AdSense reviewers would see almost nothing, which is what caused the
    # original AdSense rejection.
    MIN_CHARS = 8_000
    if len(html) < MIN_CHARS:
        problems.append(
            f"prerendered HTML is only {len(html):,} chars (minimum {MIN_CHARS:,}). "
            "The prerenderer may have silently failed — crawlers would see an empty page."
        )
    else:
        print(f"prerendered HTML: {len(html):,} chars (above {MIN_CHARS:,} minimum)")

    for pattern, reason in BANNED:
        m = re.search(pattern, html, re.IGNORECASE)
        if m:
            # Show a short excerpt so the output is actionable.
            start = max(0, m.start() - 40)
            end   = min(len(html), m.end() + 40)
            excerpt = html[start:end].replace("\n", " ").strip()
            problems.append(f"{reason}\n  matched: …{excerpt}…")

    print(f"checked dist/index.html for {len(BANNED)} banned pattern(s)\n")
    for p in problems:
        print(f"[FAIL] {p}\n")
    if not problems:
        print("[PASS] no waiting-state strings in prerendered output")
    print(f"\n{len(problems)} problem(s)")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
