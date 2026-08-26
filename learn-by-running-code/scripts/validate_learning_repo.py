#!/usr/bin/env python3
"""Validate the deterministic structure of a generated learning repository."""

from __future__ import annotations

import argparse
import ast
import re
import sys
import tomllib
from pathlib import Path


CHAPTER_PATTERN = re.compile(r"^(?P<number>\d{2})_(?P<slug>[a-z0-9][a-z0-9_-]*)$")
REQUIRED_FILES = (
    "README.md",
    "pyproject.toml",
    "uv.lock",
    ".python-version",
    ".gitignore",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check a learn-by-running-code repository without modifying it."
    )
    parser.add_argument("repo", type=Path, help="Path to the generated repository")
    return parser.parse_args()


def validate(repo: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if not repo.is_dir():
        return [f"repository directory does not exist: {repo}"], warnings

    for relative_path in REQUIRED_FILES:
        if not (repo / relative_path).is_file():
            errors.append(f"missing required file: {relative_path}")

    chapter_dirs = []
    for path in repo.iterdir():
        if not path.is_dir():
            continue
        match = CHAPTER_PATTERN.fullmatch(path.name)
        if match:
            chapter_dirs.append((int(match.group("number")), path))

    chapter_dirs.sort(key=lambda item: item[0])
    if not chapter_dirs:
        errors.append("no chapter directories found; expected 01_<slug>")
    else:
        actual_numbers = [number for number, _ in chapter_dirs]
        expected_numbers = list(range(1, len(chapter_dirs) + 1))
        if actual_numbers != expected_numbers:
            errors.append(
                "chapter numbers must be consecutive from 01: "
                f"found {actual_numbers}, expected {expected_numbers}"
            )

    readme_path = repo / "README.md"
    readme = readme_path.read_text(encoding="utf-8") if readme_path.is_file() else ""
    if readme and "uv sync" not in readme:
        errors.append("README.md must include the `uv sync` setup command")

    for _, chapter_dir in chapter_dirs:
        main_path = chapter_dir / "main.py"
        if not main_path.is_file():
            errors.append(f"missing chapter entrypoint: {chapter_dir.name}/main.py")
            continue

        command = f"uv run python {chapter_dir.name}/main.py"
        if readme and command not in readme:
            errors.append(f"README.md is missing chapter command: {command}")

        try:
            source = main_path.read_text(encoding="utf-8")
            tree = ast.parse(source, filename=str(main_path))
        except (OSError, SyntaxError, UnicodeError) as exc:
            errors.append(f"cannot compile {chapter_dir.name}/main.py: {exc}")
            continue

        if any(isinstance(node, ast.Constant) and node.value is Ellipsis for node in ast.walk(tree)):
            errors.append(f"AST Ellipsis is not allowed in {chapter_dir.name}/main.py")

        if not ast.get_docstring(tree):
            warnings.append(f"missing teaching docstring: {chapter_dir.name}/main.py")

    pyproject_path = repo / "pyproject.toml"
    if pyproject_path.is_file():
        try:
            pyproject = tomllib.loads(pyproject_path.read_text(encoding="utf-8"))
            requires_python = pyproject.get("project", {}).get("requires-python")
            if requires_python != ">=3.12":
                errors.append(
                    "pyproject.toml must set project.requires-python to `>=3.12`"
                )
        except (OSError, UnicodeError, tomllib.TOMLDecodeError) as exc:
            errors.append(f"invalid pyproject.toml: {exc}")

    python_version_path = repo / ".python-version"
    if python_version_path.is_file():
        version = python_version_path.read_text(encoding="utf-8").strip()
        if version != "3.12":
            errors.append(".python-version must contain `3.12`")

    real_env = repo / ".env"
    if real_env.exists():
        warnings.append(".env exists; ensure it is ignored and never contains committed secrets")

    return errors, warnings


def main() -> int:
    args = parse_args()
    errors, warnings = validate(args.repo.resolve())

    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")

    if errors:
        print(f"FAILED: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1

    print(f"OK: learning repository is valid ({len(warnings)} warning(s))")
    return 0


if __name__ == "__main__":
    sys.exit(main())
