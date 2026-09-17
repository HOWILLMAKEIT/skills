#!/usr/bin/env python3
"""Read-only, toolchain-independent structural checks for project-mode docs."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


REQUIRED_SECTIONS = {
    "README.md": (),
    "PROJECT.md": (
        "模式与目标", "需求与约束", "材料与依据", "方案与取舍",
        "里程碑与验收", "执行边界", "计划确认",
    ),
    "AGENTS.md": (
        "角色与协作", "项目快照", "逐步实施", "验证与安全", "续作与进度",
    ),
    "PROGRESS.md": ("当前状态", "执行记录", "下一步"),
}
TEMPLATE_MARKER = re.compile(r"\{\{\s*[A-Za-z_][A-Za-z0-9_]*\s*\}\}")
PROJECT_MODE = re.compile(r"(?<![\w-])project(?![\w-])|项目实作", re.IGNORECASE)
PLACEHOLDER = re.compile(
    r"(?:todo|tbd|fixme|placeholder|待填写|待补充|待定|占位|未填写|\.\.\.|…+)",
    re.IGNORECASE,
)
DISCLAIMER = (
    "Structural checks only: no repository commands were run; "
    "implementation, acceptance criteria, and project completion were NOT verified."
)


def sections(text: str) -> dict[str, list[str]]:
    """Collect exact H2 sections, excluding headings inside fenced examples."""
    result: dict[str, list[str]] = {}
    current: list[str] | None = None
    fence = ""
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    for line in text.splitlines():
        stripped = line.strip()
        marker = re.match(r"^ {0,3}(`{3,}|~{3,})", line)
        if fence:
            if current is not None:
                current.append(line)
            if len(stripped) >= len(fence) and set(stripped) == {fence[0]}:
                fence = ""
            continue
        if marker:
            fence = marker.group(1)
        else:
            heading = re.match(r"^ {0,3}(#{1,2})(?:[ \t]+(.*?)|[ \t]*)$", line)
            if heading:
                title = re.sub(r"[ \t]+#+[ \t]*$", "", heading.group(2) or "").strip()
                current = result.setdefault(title, []) if heading.group(1) == "##" else None
                continue
        if current is not None:
            current.append(line)
    return result


def has_body(lines: list[str]) -> bool:
    """Reject empty/placeholder-only bodies, not statements of incomplete work."""
    for line in lines:
        if re.match(r"^\s*(?:#{1,6}\s|`{3,}|~{3,})", line):
            continue
        content = re.sub(r"^\s*(?:[-*+]\s+|\d+[.)]\s+)?(?:\[[ xX]\]\s*)?", "", line)
        content = content.strip(" \t`*_:#>-。，；：!！?？")
        if content and not PLACEHOLDER.fullmatch(content):
            return True
    return False


def validate(repo: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    try:
        if not repo.is_dir():
            return [f"repository directory does not exist or is not a directory: {repo}"], warnings
    except OSError as exc:
        return [f"cannot inspect repository: {exc}"], warnings

    for filename, required in REQUIRED_SECTIONS.items():
        path = repo / filename
        try:
            if not path.is_file():
                errors.append(f"missing required file or not a regular file: {filename}")
                continue
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            errors.append(f"cannot read {filename}: {exc}")
            continue

        if filename == "README.md":
            visible = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
            if not has_body(visible.splitlines()):
                errors.append("README.md has empty or placeholder-only body")
        if TEMPLATE_MARKER.search(text):
            errors.append(f"{filename} contains unfilled template markers")
        found = sections(text)
        for title in required:
            if title not in found:
                errors.append(f"{filename} missing required H2 section: {title}")
            elif not has_body(found[title]):
                errors.append(f"{filename} section has empty or placeholder-only body: {title}")
        if filename == "PROJECT.md" and "模式与目标" in found:
            if not PROJECT_MODE.search("\n".join(found["模式与目标"])):
                errors.append("PROJECT.md 模式与目标 must state project or 项目实作 mode")

    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repo", type=Path, help="Path to the existing project repository")
    args = parser.parse_args()
    errors, warnings = validate(args.repo)
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"FAILED: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"OK: project documentation structure passed ({len(warnings)} warning(s))")
    print(DISCLAIMER)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
