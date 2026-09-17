"""Stdlib structural tests; fixture lock text is NOT an authentic uv artifact."""

from __future__ import annotations

import contextlib
import importlib.util
import io
import re
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


def load_validator(name: str):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(f"{name}.py"))
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


project = load_validator("validate_project_repo")
learning = load_validator("validate_learning_repo")

PROJECT_DOCS = {
    "README.md": "# Existing JavaScript app\nRun npm test when execution is authorized.\n",
    "PROJECT.md": """# Project
## 模式与目标
模式：project；修复现有应用的搜索功能。
## 需求与约束
保留现有接口。
## 材料与依据
依据现有源码和问题记录。
## 方案与取舍
修改现有组件，不重写应用。
## 里程碑与验收
- [ ] 搜索回归测试通过（尚未执行）。
## 执行边界
禁止联网和部署；运行命令前确认权限。
## 计划确认
用户尚未确认实施，等待审阅。
""",
    "AGENTS.md": """# Collaboration
## 角色与协作
协助维护现有应用。
## 项目快照
JavaScript 应用，使用现有 npm 工具链。
## 逐步实施
每次只修改一个行为。
## 验证与安全
测试需授权；禁止部署。
## 续作与进度
继续前先读 PROGRESS.md。
""",
    "PROGRESS.md": """# Progress
## 当前状态
尚未开始实施，验收未完成。
## 执行记录
仅完成需求整理，未执行测试。
## 下一步
等待计划确认。
""",
}


class RepositoryFixture(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)

    def put(self, name: str, content: str):
        path = self.repo / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


class ProjectValidatorTests(RepositoryFixture):
    def setUp(self):
        super().setUp()
        for name, content in PROJECT_DOCS.items():
            self.put(name, content)

    def assert_error(self, fragment: str):
        errors, _ = project.validate(self.repo)
        self.assertTrue(any(fragment in error for error in errors), errors)

    def test_valid_existing_project_without_learning_toolchain(self):
        self.assertEqual(project.validate(self.repo), ([], []))
        self.assertEqual({p.name for p in self.repo.iterdir()}, set(PROJECT_DOCS))

    def test_empty_readme(self):
        for text in ("", "# Title only\n", "<!-- hidden -->\n", "TODO"):
            with self.subTest(text=text):
                self.put("README.md", text)
                self.assert_error("README.md has empty or placeholder-only body")

    def test_project_templates_match_validator_contract(self):
        templates = Path(__file__).resolve().parents[1] / "assets" / "project"
        for name in PROJECT_DOCS:
            source = (templates / name.replace(".md", ".template.md")).read_text(encoding="utf-8")
            self.put(name, source)
        self.assert_error("unfilled template markers")
        for name in PROJECT_DOCS:
            source = (self.repo / name).read_text(encoding="utf-8")
            # Substitute structural fixture text, not real approval or execution evidence.
            self.put(name, re.sub(r"\{\{[A-Z0-9_]+\}\}", "结构测试内容（尚未执行）", source))
        self.assertEqual(project.validate(self.repo), ([], []))

    def test_missing_repo_and_file_repo(self):
        for path in (self.repo / "absent", self.repo / "README.md"):
            with self.subTest(path=path):
                self.assertTrue(project.validate(path)[0])

    def test_each_missing_file_and_directory_masquerading_as_file(self):
        for name, content in PROJECT_DOCS.items():
            with self.subTest(name=name):
                path = self.repo / name
                path.unlink()
                self.assert_error(name)
                path.mkdir()
                self.assert_error(name)
                path.rmdir()
                self.put(name, content)

    def test_each_missing_required_section(self):
        for name, content in PROJECT_DOCS.items():
            for line in content.splitlines():
                if line.startswith("## "):
                    with self.subTest(name=name, heading=line):
                        self.put(name, content.replace(line, line + " extra"))
                        self.assert_error("missing required H2 section: " + line[3:])
                        self.put(name, content)

    def test_empty_and_placeholder_section_bodies(self):
        for body in ("", " \n", "TODO", "TBD", "待填写", "...", "- [ ] TODO", "<!-- fill later -->", "### Subheading"):
            for name, content in PROJECT_DOCS.items():
                if name == "README.md":
                    continue
                with self.subTest(name=name, body=body):
                    prefix = content.rsplit("\n## ", 1)[0]
                    title = content.rsplit("\n## ", 1)[1].splitlines()[0]
                    self.put(name, prefix + f"\n## {title}\n{body}\n")
                    self.assert_error("empty or placeholder-only body")
                    self.put(name, content)

    def test_template_markers_in_all_documents(self):
        for name, content in PROJECT_DOCS.items():
            with self.subTest(name=name):
                self.put(name, content + "\n{{UNFILLED_TOKEN}}\n")
                self.assert_error("unfilled template markers")
                self.put(name, content)

    def test_json_braces_are_not_template_markers(self):
        self.put("README.md", PROJECT_DOCS["README.md"] + '\n```json\n{"nested": {"enabled": true}}\n```\n')
        self.assertEqual(project.validate(self.repo), ([], []))

    def test_invalid_utf8_in_each_file(self):
        for name, content in PROJECT_DOCS.items():
            with self.subTest(name=name):
                (self.repo / name).write_bytes(b"\xff\xfe")
                self.assert_error("cannot read " + name)
                self.put(name, content)

    def test_read_and_stat_errors(self):
        with patch.object(Path, "read_text", side_effect=PermissionError("denied")):
            self.assert_error("cannot read")
        with patch.object(Path, "is_file", side_effect=OSError("stat failed")):
            self.assert_error("cannot read")
        with patch.object(Path, "is_dir", side_effect=OSError("stat failed")):
            self.assert_error("cannot inspect repository")

    def test_project_mode_is_not_an_arbitrary_substring(self):
        content = PROJECT_DOCS["PROJECT.md"]
        for mode in ("project", "PROJECT", "项目实作", "`project`"):
            with self.subTest(mode=mode):
                self.put("PROJECT.md", content.replace("project", mode))
                self.assertEqual(project.validate(self.repo), ([], []))
        for mode in ("projection", "myproject", "project_mode", "project-mode", "learning"):
            with self.subTest(mode=mode):
                self.put("PROJECT.md", content.replace("project", mode))
                self.assert_error("must state project or 项目实作")

    def test_mode_must_appear_in_its_section(self):
        self.put("PROJECT.md", PROJECT_DOCS["PROJECT.md"].replace("project", "learning") + "\nproject\n")
        self.assert_error("must state project or 项目实作")

    def test_fenced_or_commented_headings_do_not_count(self):
        content = PROJECT_DOCS["PROJECT.md"]
        for wrapped in (f"```markdown\n{content}\n```", f"~~~markdown\n{content}\n~~~", f"<!--\n{content}\n-->"):
            with self.subTest(wrapped=wrapped):
                self.put("PROJECT.md", wrapped)
                self.assert_error("missing required H2 section")

    def test_next_top_level_heading_ends_section(self):
        self.put("PROGRESS.md", PROJECT_DOCS["PROGRESS.md"].replace("等待计划确认。", "# Appendix\nNot section content."))
        self.assert_error("empty or placeholder-only body: 下一步")

    def test_cli_success_is_read_only_and_does_not_verify_acceptance(self):
        before = {p.name: p.read_bytes() for p in self.repo.iterdir()}
        output = io.StringIO()
        with (
            patch("sys.argv", ["validate_project_repo.py", str(self.repo)]),
            contextlib.redirect_stdout(output),
            patch("subprocess.run", side_effect=AssertionError("must not execute commands")),
            patch("os.system", side_effect=AssertionError("must not execute commands")),
        ):
            self.assertEqual(project.main(), 0)
        self.assertIn("Structural checks only", output.getvalue())
        self.assertIn("no repository commands were run", output.getvalue())
        self.assertIn("project completion were NOT verified", output.getvalue())
        self.assertEqual(before, {p.name: p.read_bytes() for p in self.repo.iterdir()})

    def test_cli_failure_returns_nonzero_without_traceback(self):
        for invalid_encoding in (False, True):
            with self.subTest(invalid_encoding=invalid_encoding):
                if invalid_encoding:
                    (self.repo / "README.md").write_bytes(b"\xff")
                else:
                    (self.repo / "README.md").unlink()
                output = io.StringIO()
                with patch("sys.argv", ["validator", str(self.repo)]), contextlib.redirect_stdout(output):
                    self.assertEqual(project.main(), 1)
                self.assertIn("FAILED:", output.getvalue())
                self.assertNotIn("Traceback", output.getvalue())


class LearningValidatorRegressionTests(RepositoryFixture):
    def setUp(self):
        super().setUp()
        self.command = "uv run python 01_intro/main.py"
        self.put("README.md", f"# Fixture\nuv sync\n{self.command}\n")
        self.put("AGENTS.md", "\n".join(learning.AGENTS_REQUIRED_KEYWORDS) + "\n" + learning.AGENTS_TEACHING_SEQUENCE + "\n" + self.command)
        self.put("pyproject.toml", '[project]\nname = "structural-test-fixture"\nversion = "0.0.0"\nrequires-python = ">=3.12"\n')
        # The existing validator checks existence only. Never present this as
        # a generated lockfile or evidence that uv resolved an environment.
        self.put("uv.lock", "STRUCTURAL TEST SENTINEL: not a real uv lockfile\n")
        self.put(".python-version", "3.12\n")
        self.put(".gitignore", ".venv/\n")
        self.put("01_intro/main.py", '\"\"\"Teaching fixture.\"\"\"\nprint("fixture")\n')

    def assert_error(self, fragment: str):
        errors, _ = learning.validate(self.repo)
        self.assertTrue(any(fragment in error for error in errors), errors)

    def test_basic_valid_structure(self):
        self.assertEqual(learning.validate(self.repo), ([], []))

    def test_approved_alternate_python_versions(self):
        self.put(".python-version", "3.11\n")
        self.put("pyproject.toml", '[project]\nrequires-python = ">=3.11,<3.13"\n')
        self.assert_error(".python-version must contain `3.12`")
        self.assert_error("project.requires-python to `>=3.12`")
        self.assertEqual(learning.validate(
            self.repo, python_version="3.11", requires_python=">=3.11,<3.13"
        ), ([], []))

    def test_cli_alternate_python_and_defaults(self):
        self.put(".python-version", "3.11\n")
        self.put("pyproject.toml", '[project]\nrequires-python = ">=3.11,<3.13"\n')
        for flags, expected in (([], 1), (["--python-version", "3.11", "--requires-python", ">=3.11,<3.13"], 0)):
            with self.subTest(flags=flags):
                output = io.StringIO()
                with patch("sys.argv", ["validator", str(self.repo), *flags]), contextlib.redirect_stdout(output):
                    self.assertEqual(learning.main(), expected)
                if expected == 0:
                    self.assertIn("Structural checks only", output.getvalue())

    def test_empty_learning_docs_are_rejected(self):
        for name in ("README.md", "AGENTS.md"):
            original = (self.repo / name).read_text(encoding="utf-8")
            for content in ("", " \n\t\n"):
                with self.subTest(name=name, content=content):
                    self.put(name, content)
                    self.assert_error(f"{name} must not be empty or whitespace-only")
            self.put(name, original)

    def test_missing_agents(self):
        (self.repo / "AGENTS.md").unlink()
        self.assert_error("missing required file: AGENTS.md")

    def test_missing_chapter_commands(self):
        for name in ("README.md", "AGENTS.md"):
            with self.subTest(name=name):
                content = (self.repo / name).read_text(encoding="utf-8")
                self.put(name, content.replace(self.command, ""))
                self.assert_error("missing chapter command")
                self.put(name, content)

    def test_nonconsecutive_chapters(self):
        self.put("03_gap/main.py", '\"\"\"Gap fixture.\"\"\"\nprint("gap")\n')
        self.assert_error("chapter numbers must be consecutive")

    def test_syntax_failure(self):
        self.put("01_intro/main.py", "def broken(:\n")
        self.assert_error("cannot compile")

    def test_ellipsis_failure(self):
        self.put("01_intro/main.py", '\"\"\"Incomplete.\"\"\"\n...\n')
        self.assert_error("AST Ellipsis is not allowed")


if __name__ == "__main__":
    unittest.main()
