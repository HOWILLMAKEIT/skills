#!/usr/bin/env python3
"""Report long verbatim overlaps between a draft and collected reference texts.

Usage: overlap_check.py DRAFT.md REF_DIR [--min-words 8] [--min-chars 15]

English text is compared as word n-grams (default 8 words); Chinese text as
character n-grams (default 15 characters). Exit code 1 if any overlap is found.
This detects copied fragments only; it does not judge paraphrase or style.
"""
import argparse
import re
import sys
from pathlib import Path

WORD = re.compile(r"[a-z0-9']+")
CJK = re.compile(r"[一-鿿]")


def word_tokens(text):
    return WORD.findall(text.lower())


def cjk_tokens(text):
    return CJK.findall(text)


def ngrams(tokens, n):
    return {tuple(tokens[i:i + n]): i for i in range(len(tokens) - n + 1)}


def find_overlaps(draft, references, min_words=8, min_chars=15):
    """Return [(ref_name, fragment)] for each maximal shared run."""
    hits = []
    for tokenize, n, joiner in ((word_tokens, min_words, " "), (cjk_tokens, min_chars, "")):
        draft_tokens = tokenize(draft)
        draft_grams = ngrams(draft_tokens, n)
        if not draft_grams:
            continue
        for name, text in references.items():
            starts = sorted(
                draft_grams[g] for g in ngrams(tokenize(text), n) if g in draft_grams
            )
            run_start = prev = None
            for i in starts:
                if run_start is not None and i != prev + 1:
                    hits.append((name, joiner.join(draft_tokens[run_start:prev + n])))
                    run_start = None
                if run_start is None:
                    run_start = i
                prev = i
            if run_start is not None:
                hits.append((name, joiner.join(draft_tokens[run_start:prev + n])))
    return hits


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("draft")
    parser.add_argument("ref_dir")
    parser.add_argument("--min-words", type=int, default=8)
    parser.add_argument("--min-chars", type=int, default=15)
    args = parser.parse_args()

    draft = Path(args.draft).read_text(encoding="utf-8")
    refs = {p.name: p.read_text(encoding="utf-8") for p in sorted(Path(args.ref_dir).glob("*.md"))}
    hits = find_overlaps(draft, refs, args.min_words, args.min_chars)
    if not hits:
        print(f"OK: no shared run of {args.min_words}+ words / {args.min_chars}+ characters with {len(refs)} reference file(s)")
        return 0
    for name, fragment in hits:
        print(f"OVERLAP with {name}: {fragment}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
