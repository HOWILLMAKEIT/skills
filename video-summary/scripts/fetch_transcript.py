#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fetch_transcript.py — video-summary skill 主脚本：抓取 Bilibili / YouTube 字幕/转写。

零第三方依赖（仅 Python 标准库）。B 站主路径走纯 API；YouTube 与统一兜底走 yt-dlp。
实测行为（2026-08 本机，详见 skill references）：
  - B 站字幕（CC 与 AI）自 2023 起需登录态：无 SESSDATA 时 player API 恒返回空列表；
  - B 站一切请求需浏览器 UA + Referer，否则可能被 WAF 拦截（HTTP 412）；
  - YouTube 依赖 yt-dlp（PATH 无则自动回退 `uvx yt-dlp` 零安装运行），且需本机代理可达。

用法：
  python3 fetch_transcript.py <URL> [--page N] [--group N] [--max-bytes N] [--out FILE]
                              [--engine auto|api|ytdlp] [--allow-desc-fallback]

输出统一 JSON（stdout）：
{
  "service": "bilibili" | "youtube",
  "video_id": "BVxxxx / avxxxx / 11位YouTube id",
  "url": "原始链接",
  "title": "...", "desc": "...", "dynamic": "...",
  "duration": 387, "page": 1, "cid": 123, "aid": 456,
  "transcript": [ {"text": "...", "index": 0, "s": 12.4}, ... ],
  "source": "bilibili-cc-subtitle | bilibili-ai-subtitle | youtube-subs | youtube-auto-subs | desc-fallback | login-required",
  "warnings": ["..."],
  "login_required": true,        // 仅 source=login-required 时出现
  "login_guide": ["...", "..."]  // 仅 source=login-required 时出现
}

降级链（BibiGPT 同款）：CC 字幕 → AI 字幕 → auto-subs → desc+dynamic 简介兜底。
B 站特例：未配置任何登录态且拿不到字幕时，**不直接降级**，而是返回
source=login-required（exit 5）+ login_guide，由 agent 先引导用户登录，
用户确认无法登录后才用 --allow-desc-fallback 走简介兜底。
transcript 中 s 为段首真实秒数（取自字幕原文，禁止伪造）；source=desc-fallback 时
transcript 为空数组，总结只能基于标题与简介，并必须向用户声明。
"""
from __future__ import annotations

import argparse
import gzip
import json
import os
import random
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
GROUP_SIZE = 7            # BibiGPT：每 7 条字幕合并为一段
DEFAULT_MAX_BYTES = 6200  # BibiGPT：transcript 字节上限，超限随机减半压缩

BILI_RE = re.compile(r"bilibili\.com/video/((?:BV[0-9A-Za-z]+)|av(\d+))", re.I)
YT_ID_RE = re.compile(r"(?:v=|youtu\.be/|shorts/|embed/|live/)([0-9A-Za-z_-]{11})")
SUB_LANG_RE = re.compile(r"\.([A-Za-z][A-Za-z0-9-]*)\.(srt|vtt)$", re.I)

EXIT_OK = 0
EXIT_BAD_URL = 2
EXIT_FETCH_ERROR = 3
EXIT_NO_YTDLP = 4
EXIT_LOGIN_REQUIRED = 5  # B 站无登录态拿不到字幕：先引导登录而非降级


class FetchError(Exception):
    """可向用户清晰报告的抓取失败。"""


# ------------------------------------------------- B 站登录态检测与引导

def _bili_has_login(sessdata: str | None) -> bool:
    """是否配置了任一 B 站登录态（SESSDATA / cookie jar / 浏览器 cookie）。"""
    if sessdata:
        return True
    jar = os.environ.get("BILIBILI_COOKIES")
    if jar and os.path.exists(jar):
        return True
    return bool(os.environ.get("BILIBILI_COOKIES_FROM_BROWSER"))


LOGIN_GUIDE = [
    "方式一（推荐）：浏览器登录 bilibili.com → F12 DevTools → Application → Cookies → "
    "复制 SESSDATA 值 → export BILIBILI_SESSDATA=\"<值>\" 后重跑本命令",
    "方式二：export BILIBILI_COOKIES_FROM_BROWSER=chrome|edge 直接读取浏览器登录态"
    "（首次读取 Chrome 需在钥匙串弹窗点允许；safari 受 macOS 隐私保护可能失败）",
    "配好任一登录态后重跑同一条命令即可获得基于完整字幕的总结；"
    "用户无法登录时，可加 --allow-desc-fallback 降级为「标题+简介」粗略总结",
]


# ---------------------------------------------------------------- http utils

def http_get(url: str, headers: dict | None = None, timeout: int = 25) -> tuple[str, str]:
    """GET 并自动解 gzip，返回 (text, final_url)。

    网络层错误统一转成 FetchError（清晰中文提示而非堆栈）；
    429/412/5xx 是 B 站 WAF/限频常见码，自动退避重试一次。
    """
    h = {"User-Agent": UA}
    h.update(headers or {})
    last_err = ""
    for attempt in (1, 2):
        req = urllib.request.Request(url, headers=h)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read()
                if raw[:2] == b"\x1f\x8b":
                    raw = gzip.decompress(raw)
                return raw.decode("utf-8", "replace"), resp.geturl()
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code} {e.reason}"
            if attempt == 1 and (e.code in (412, 429) or e.code >= 500):
                import time
                time.sleep(3)
                continue
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last_err = f"网络错误：{getattr(e, 'reason', e)}"
            if attempt == 1:
                import time
                time.sleep(3)
                continue
    raise FetchError(f"请求失败（{last_err}）：{url}")


def resolve_redirect(url: str, timeout: int = 25) -> str:
    """跟随 302（b23.tv 短链），返回最终 URL。"""
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Referer": "https://www.bilibili.com/"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.geturl()
    except urllib.error.HTTPError as e:
        raise FetchError(f"短链解析失败（HTTP {e.code} {e.reason}，短链可能已失效）：{url}")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise FetchError(f"短链解析失败（网络错误：{getattr(e, 'reason', e)}）：{url}")


# ---------------------------------------------------------------- URL 解析

def parse_url(url: str) -> dict:
    """识别 URL 类型，返回 {service, video_id, page, url}。b23.tv 先跟随 302。"""
    url = url.strip()
    host = urllib.parse.urlparse(url).netloc.lower()

    if "b23.tv" in host:
        final = resolve_redirect(url)
        if "bilibili.com" not in final:
            raise FetchError(f"b23.tv 短链未能解析到 bilibili.com（最终地址：{final}）")
        url = final
        host = "www.bilibili.com"

    if "bilibili.com" in host:
        m = BILI_RE.search(url)
        if not m:
            raise FetchError(f"无法从 B 站链接中提取 BV/av 号：{url}")
        video_id = m.group(1) if m.group(1).lower().startswith("bv") else f"av{m.group(2)}"
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
        raw_p = (qs.get("p", ["1"])[0] or "1").strip()
        if not re.fullmatch(r"\d+", raw_p):
            raise FetchError(f"分 P 参数无效：?p={raw_p}（应为正整数，如 ?p=2）")
        page = max(1, int(raw_p))
        return {"service": "bilibili", "video_id": video_id, "page": page, "url": url}

    if "youtube.com" in host or "youtu.be" in host:
        m = YT_ID_RE.search(url)
        if not m:
            raise FetchError(f"无法从 YouTube 链接中提取 11 位视频 id：{url}")
        return {"service": "youtube", "video_id": m.group(1), "page": 1, "url": url}

    raise FetchError(
        f"暂不支持该链接：{url}（目前支持 bilibili.com、b23.tv、youtube.com、youtu.be）"
    )


# ---------------------------------------------------------------- bilibili API

def bili_headers(sessdata: str | None) -> dict:
    h = {"Referer": "https://www.bilibili.com/", "Accept": "application/json"}
    if sessdata:
        h["Cookie"] = f"SESSDATA={sessdata}"
    return h


def bili_api(url: str, sessdata: str | None) -> dict:
    text, _ = http_get(url, headers=bili_headers(sessdata))
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        raise FetchError(f"B 站接口返回非 JSON（可能被风控）：{url}")
    if data.get("code") != 0:
        raise FetchError(f"B 站接口错误 code={data.get('code')}：{data.get('message', '')}（{url}）")
    return data.get("data") or {}


def pick_bili_subtitle(subs: list[dict]):
    """选择字幕：CC 优先于 AI，中文优先（返回 (kind, item) 生成器）。"""

    def is_ai(s: dict) -> bool:
        return s.get("ai_status") == 1 or str(s.get("lan") or "").lower().startswith("ai-")

    def rank(s: dict):
        lang = str(s.get("lan") or "").lower()
        return (is_ai(s), 0 if "zh" in lang else 1)

    for s in sorted(subs, key=rank):
        yield ("bilibili-ai-subtitle" if is_ai(s) else "bilibili-cc-subtitle", s)


def fetch_bili_subtitle_body(sub_url: str, sessdata: str | None) -> list[dict]:
    """下载字幕 JSON（协议相对地址补 https:，需 Referer），返回 [{text, s}]。"""
    if sub_url.startswith("//"):
        sub_url = "https:" + sub_url
    raw, _ = http_get(sub_url, headers=bili_headers(sessdata))
    data = json.loads(raw)
    items = []
    for b in data.get("body") or []:
        content = str(b.get("content") or "").strip()
        if content:
            items.append({"text": content, "s": float(b.get("from") or 0.0)})
    return items


# ---------------------------------------------------------------- 归并/压缩

CJK_BOUNDARY_RE = re.compile(r"[\u4e00-\u9fff\u3040-\u30ff]")


def _join_texts(texts: list[str]) -> str:
    """语言感知拼接：任一侧边界字符为 CJK（汉字/日文假名）则空串相连，
    否则用单个空格相连——避免英文单词粘连，也避免中文之间出现多余空格。"""
    out = ""
    for t in texts:
        t = t.strip()
        if not t:
            continue
        if not out:
            out = t
        elif CJK_BOUNDARY_RE.match(out[-1]) or CJK_BOUNDARY_RE.match(t[0]):
            out += t
        else:
            out += " " + t
    return out


def merge_segments(items: list[dict], group: int = GROUP_SIZE) -> list[dict]:
    """BibiGPT 同款：每 group 条字幕合并为一段，段首保留第一条的真实秒数。"""
    segs: list[dict] = []
    for i in range(0, len(items), group):
        chunk = items[i: i + group]
        segs.append({
            "text": _join_texts([c["text"] for c in chunk]),
            "index": len(segs),
            "s": round(chunk[0]["s"], 3),
        })
    return segs


def limit_bytes(segs: list[dict], max_bytes: int) -> list[dict]:
    """BibiGPT 同款：超过字节上限时随机减半压缩（保持时间顺序并重排 index）。"""
    if max_bytes <= 0 or not segs:
        return segs

    def total(items: list[dict]) -> int:
        return sum(len(s["text"].encode("utf-8")) for s in items)

    cur = list(segs)
    while len(cur) > 4 and total(cur) > max_bytes:
        keep = sorted(random.sample(range(len(cur)), len(cur) // 2))
        cur = [{**cur[i], "index": j} for j, i in enumerate(keep)]
    return cur


# ---------------------------------------------------------------- yt-dlp 通用

def find_ytdlp() -> list[str] | None:
    """定位 yt-dlp：PATH 优先，其次 uvx 零安装运行（本机实测可用）。"""
    p = shutil.which("yt-dlp")
    if p:
        return [p]
    if shutil.which("uvx"):
        return ["uvx", "yt-dlp"]
    return None


def engine_wants_ytdlp() -> bool:
    return os.environ.get("VIDEO_SUMMARY_ENGINE", "auto") != "api"


_FLAG_UNRECOGNIZED_RE = re.compile(r"unrecognized arguments|no such option|unknown option", re.I)


def _ytdlp_exec(cmd: list[str]) -> subprocess.CompletedProcess:
    """执行 yt-dlp；429/412 为 B 站 WAF/限频常见码，退避重试一次。"""
    last_err = ""
    for attempt in (1, 2):
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        except subprocess.TimeoutExpired:
            raise FetchError("yt-dlp 运行超时（300s）")
        if proc.returncode == 0:
            return proc
        last_err = (proc.stderr or "").strip()
        if attempt == 1 and ("412" in last_err or "429" in last_err or "Precondition" in last_err):
            import time
            time.sleep(3)
            continue
    raise FetchError(f"yt-dlp 失败：{last_err[:300]}")


def _ytdlp_run(ytdlp: list[str], url: str, service: str, td: str,
               write_mode: str, sessdata: str | None) -> list[str]:
    """跑一次 yt-dlp 只写字幕文件，返回产出的 .srt/.vtt 文件名列表。"""
    langs = "zh.*,ai-zh.*,zh-Hans,zh-CN,en.*" if service == "bilibili" else "zh.*,en.*"
    cmd = ytdlp + [
        "--skip-download", "--sub-langs", langs, "--sub-format", "srt/vtt/best",
        "--quiet", "--no-warnings", "--no-playlist",
        "-o", os.path.join(td, "%(id)s.%(ext)s"),
    ]
    if write_mode in ("both", "manual"):
        cmd.append("--write-subs")
    if write_mode in ("both", "auto"):
        cmd.append("--write-auto-subs")
    if shutil.which("node"):
        cmd += ["--js-runtimes", "node"]  # 消除 YouTube 提取的 JS runtime 警告
    if service == "bilibili":
        cmd += ["--user-agent", UA, "--add-headers", "Referer: https://www.bilibili.com/"]
        # cookie 策略（实测 Cookie 头方式会被 yt-dlp 判废弃且无法通过字幕鉴权，
        # 必须 --cookies jar / --cookies-from-browser）：
        #   1. BILIBILI_COOKIES：现成 Netscape jar 文件
        #   2. BILIBILI_COOKIES_FROM_BROWSER：浏览器名（chrome/edge/firefox…）
        #   3. BILIBILI_SESSDATA：自动构建最小 jar（实测足以拿字幕）
        jar_file = os.environ.get("BILIBILI_COOKIES")
        from_browser = os.environ.get("BILIBILI_COOKIES_FROM_BROWSER")
        if jar_file and os.path.exists(jar_file):
            cmd += ["--cookies", jar_file]
        elif from_browser:
            cmd += ["--cookies-from-browser", from_browser]
        elif sessdata:
            jar = os.path.join(td, "bili_cookies.txt")
            with open(jar, "w", encoding="utf-8") as f:
                f.write("# Netscape HTTP Cookie File\n")
                f.write(f".bilibili.com\tTRUE\t/\tTRUE\t0\tSESSDATA\t{sessdata}\n")
            cmd += ["--cookies", jar]
    cookie_file = os.environ.get("YOUTUBE_COOKIES") or os.environ.get("YTDLP_COOKIES")
    if service == "youtube" and cookie_file and os.path.exists(cookie_file):
        cmd += ["--cookies", cookie_file]
    cmd.append(url)

    try:
        proc = _ytdlp_exec(cmd)
    except FetchError as e:
        # 兼容旧版 yt-dlp（2025.03 引入 EJS 机制前的版本不支持 --js-runtimes）：
        # 报 unrecognized arguments / no such option 时去掉该参数重试一次
        if "--js-runtimes" in cmd and _FLAG_UNRECOGNIZED_RE.search(str(e)):
            i = cmd.index("--js-runtimes")
            del cmd[i: i + 2]
            proc = _ytdlp_exec(cmd)
        else:
            raise
    return sorted(
        f for f in os.listdir(td) if f.lower().endswith((".srt", ".vtt"))
    )


def _pick_sub_file(files: list[str]) -> str:
    """选字幕文件：中文优先，其次英文，再按文件名排序。"""

    def pref(fname: str):
        m = SUB_LANG_RE.search(fname)
        lang = (m.group(1) if m else "").lower()
        is_zh = lang.startswith(("zh", "ai-zh"))
        is_en = lang.startswith("en")
        return (0 if is_zh else (1 if is_en else 2), fname)

    return sorted(files, key=pref)[0]


def _sub_source(service: str, mode: str, fname: str) -> str:
    m = SUB_LANG_RE.search(fname)
    lang = (m.group(1) if m else "").lower()
    if service == "bilibili":
        return "bilibili-ai-subtitle" if lang.startswith("ai-") else "bilibili-cc-subtitle"
    return "youtube-subs" if mode == "manual" else "youtube-auto-subs"


def parse_srt_or_vtt(text: str) -> list[dict]:
    """解析 SRT/VTT → [{text, s}]，去除滚动重复行与内联标签。"""
    ts_re = re.compile(
        r"(\d+):(\d{2}):(\d{2})[,.](\d+)\s*-->\s*(\d+):(\d{2}):(\d{2})[,.](\d+)"
    )
    tag_re = re.compile(r"<[^>]+>")
    items: list[dict] = []
    for block in re.split(r"\n\s*\n", text):
        lines = [ln for ln in block.strip().splitlines() if ln.strip()]
        if not lines or lines[0].lstrip().upper().startswith(("WEBVTT", "NOTE", "STYLE")):
            continue
        tidx = next((i for i, ln in enumerate(lines) if ts_re.search(ln)), -1)
        if tidx < 0:
            continue
        m = ts_re.search(lines[tidx])
        s = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3)) + int(m.group(4)) / 1000
        content = " ".join(tag_re.sub("", ln).strip() for ln in lines[tidx + 1:]).strip()
        if not content:
            continue
        if items and items[-1]["text"] == content:  # auto-subs 滚动去重
            continue
        items.append({"text": content, "s": s})
    return items


def ytdlp_fetch(url: str, service: str, group: int, max_bytes: int,
                sessdata: str | None = None) -> tuple[list[dict], str, list[str]]:
    """用 yt-dlp 抓字幕，返回 (merged, source, warnings)。

    YouTube 分两轮保证降级层级准确：先 manual（--write-subs）后 auto（--write-auto-subs）；
    B 站一轮 both，用语言前缀 ai-* 区分 AI 字幕。找不到任何字幕抛 FetchError。
    """
    ytdlp = find_ytdlp()
    if not ytdlp:
        raise FetchError(
            "未找到 yt-dlp。请先安装：`brew install yt-dlp` 或 `pipx install yt-dlp`"
            "（有 uv 时可 `uv tool install yt-dlp`）"
        )

    warnings: list[str] = []
    modes = ["manual", "auto"] if service == "youtube" else ["both"]
    last_err: str = ""
    with tempfile.TemporaryDirectory(prefix="videosum_") as td:
        for mode in modes:
            try:
                files = _ytdlp_run(ytdlp, url, service, td, mode, sessdata)
            except FetchError as e:
                last_err = str(e)
                continue
            if not files:
                continue
            chosen = _pick_sub_file(files)
            with open(os.path.join(td, chosen), encoding="utf-8", errors="replace") as f:
                items = parse_srt_or_vtt(f.read())
            if not items:
                last_err = f"字幕文件解析为空：{chosen}"
                continue
            m = SUB_LANG_RE.search(chosen)
            lang = (m.group(1) if m else "").lower()
            if not lang.startswith(("zh", "ai-zh")):
                warnings.append(
                    f"未找到中文字幕，已选用 {chosen}"
                    + ("（B 站中文字幕需配置 BILIBILI_SESSDATA）" if service == "bilibili" else "")
                )
            return merge_segments(items, group), _sub_source(service, mode, chosen), warnings
    raise FetchError(f"yt-dlp 未产出可用字幕文件。{last_err}".strip())


def ytdlp_metadata(url: str) -> dict:
    """yt-dlp 仅取元数据（标题/描述），用于无字幕时的简介兜底与结果富化。"""
    ytdlp = find_ytdlp()
    if not ytdlp:
        raise FetchError("未找到 yt-dlp，无法获取视频元数据")
    cmd = ytdlp + ["--skip-download", "--dump-single-json", "--no-warnings", "--quiet", url]
    last_err = ""
    for attempt in (1, 2):  # B 站 WAF 间歇性 412，退避重试一次
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        except subprocess.TimeoutExpired:
            raise FetchError("yt-dlp 元数据获取超时（180s）")
        if proc.returncode == 0:
            info = json.loads(proc.stdout)
            return {
                "title": info.get("title", ""),
                "desc": info.get("description", "") or "",
                "duration": info.get("duration"),
                "uploader": info.get("uploader", "") or info.get("channel", ""),
            }
        last_err = (proc.stderr or "").strip()
        if attempt == 1 and ("412" in last_err or "Precondition" in last_err or "429" in last_err):
            import time
            time.sleep(3)
            continue
    raise FetchError(f"yt-dlp 元数据获取失败：{last_err[:300]}")


# ---------------------------------------------------------------- bilibili 路径

def fetch_bilibili(parsed: dict, page: int, sessdata: str | None,
                   group: int, max_bytes: int,
                   allow_desc_fallback: bool = False) -> dict:
    """B 站纯 API 主路径：view → player/v2 → subtitle JSON → 归并 → yt-dlp 兜底
    → 无登录态时登录引导（login-required）→ 简介兜底（需用户同意）。"""
    warnings: list[str] = []
    has_login = _bili_has_login(sessdata)
    if not has_login:
        warnings.append(
            "未配置 BILIBILI_SESSDATA：B 站字幕列表自 2023 年起需要登录态，"
            "大概率拿不到字幕；届时脚本会要求先登录（exit 5）而非直接降级"
        )

    q = (
        f"bvid={parsed['video_id']}"
        if parsed["video_id"].lower().startswith("bv")
        else f"aid={parsed['video_id'][2:]}"
    )
    view = bili_api(f"https://api.bilibili.com/x/web-interface/view?{q}", sessdata)

    pages = view.get("pages") or []
    cid = view.get("cid")
    if page and page > 1:
        hit = next((p for p in pages if p.get("page") == page), None)
        if not hit:
            raise FetchError(f"分页 P{page} 不存在（该视频共 {len(pages)} P）")
        cid = hit.get("cid")
    elif pages:
        cid = pages[0].get("cid", cid)

    result = {
        "service": "bilibili",
        "video_id": view.get("bvid") or parsed["video_id"],
        "url": parsed["url"],
        "title": view.get("title", ""),
        "desc": view.get("desc", ""),
        "dynamic": view.get("dynamic", ""),
        "duration": view.get("duration"),
        "owner": (view.get("owner") or {}).get("name", ""),
        "page": page or 1,
        "cid": cid,
        "aid": view.get("aid"),
    }

    transcript: list[dict] = []
    source = ""

    # 路径 1：player/v2 字幕列表（需登录态；CC → AI，中文优先）
    try:
        player = bili_api(
            f"https://api.bilibili.com/x/player/v2?aid={result['aid']}&cid={cid}", sessdata
        )
        subs = ((player.get("subtitle") or {}).get("subtitles")) or []
        if not subs:
            warnings.append(
                "player API 字幕列表为空"
                + ("（已带 SESSDATA，该视频可能确实没有 CC/AI 字幕）" if sessdata
                   else "（无登录态时的预期行为，实测已验证）")
            )
        for kind, sub in pick_bili_subtitle(subs):
            url = sub.get("subtitle_url") or ""
            if not url:
                continue
            try:
                items = fetch_bili_subtitle_body(url, sessdata)
            except Exception as e:  # 单个字幕下载失败继续尝试下一个
                warnings.append(f"字幕下载失败（{sub.get('lan_doc') or sub.get('lan')}）：{e}")
                continue
            if items:
                transcript = merge_segments(items, group)
                source = kind
                break
    except FetchError as e:
        warnings.append(f"player API 调用失败：{e}")

    # 路径 2：yt-dlp 统一兜底（auto 引擎且 API 无字幕时）
    if not transcript and engine_wants_ytdlp():
        if find_ytdlp():
            try:
                transcript, source, w = ytdlp_fetch(
                    parsed["url"], "bilibili", group, max_bytes, sessdata
                )
                warnings.extend(w)
            except FetchError as e:
                warnings.append(f"yt-dlp 兜底失败：{e}")
        else:
            warnings.append("本机未安装 yt-dlp（也无法 uvx 运行），跳过 yt-dlp 兜底")

    # 路径 3：无字幕 → 未配置登录态时先要求登录；用户同意/无法登录才简介兜底
    if not transcript:
        if not has_login and not allow_desc_fallback:
            warnings.append("无登录态导致拿不到字幕，已进入登录引导（login-required）")
            result.update(
                transcript=[], source="login-required", warnings=warnings,
                login_required=True, login_guide=LOGIN_GUIDE,
            )
            return result
        transcript, source = [], "desc-fallback"
        warnings.append(
            "无可用字幕，已降级为「标题+简介」总结（BibiGPT 同款兜底）；"
            "输出时必须向用户声明该结论基于简介而非字幕"
        )

    transcript = limit_bytes(transcript, max_bytes)
    result.update(transcript=transcript, source=source, warnings=warnings)
    return result


def build_bili_ytdlp_result(parsed: dict, page: int, group: int,
                            max_bytes: int, sessdata: str | None,
                            allow_desc_fallback: bool = False) -> dict:
    """--engine ytdlp：B 站直接走 yt-dlp（BV/av/b23.tv/多P 统一，需 cookie 才有字幕）。"""
    url = parsed["url"]
    if page and page > 1 and "?p=" not in url and "&p=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}p={page}"
    warnings: list[str] = []
    if not _bili_has_login(sessdata):
        warnings.append("未配置 BILIBILI_SESSDATA：yt-dlp 路径同样需要 cookie 才能取到 B 站字幕；"
                        "拿不到字幕时会要求先登录（exit 5）而非直接降级")
    transcript: list[dict] = []
    source = ""
    try:
        transcript, source, w = ytdlp_fetch(url, "bilibili", group, max_bytes, sessdata)
        warnings.extend(w)
    except FetchError as e:
        warnings.append(f"yt-dlp 字幕抓取失败：{e}")
    try:
        meta = ytdlp_metadata(url)
    except FetchError as e:
        meta = {}
        warnings.append(str(e))
    if not transcript and not _bili_has_login(sessdata) and not allow_desc_fallback:
        warnings.append("无登录态导致拿不到字幕，已进入登录引导（login-required）")
        return {
            "service": "bilibili",
            "video_id": parsed["video_id"],
            "url": parsed["url"],
            "title": meta.get("title", ""),
            "desc": meta.get("desc", ""),
            "owner": meta.get("uploader", ""),
            "duration": meta.get("duration"),
            "page": page or 1,
            "transcript": [],
            "source": "login-required",
            "warnings": warnings,
            "login_required": True,
            "login_guide": LOGIN_GUIDE,
        }
    if not transcript:
        transcript, source = [], "desc-fallback"
        warnings.append("无可用字幕，已降级为「标题+简介」总结")
    return {
        "service": "bilibili",
        "video_id": parsed["video_id"],
        "url": parsed["url"],
        "title": meta.get("title", ""),
        "desc": meta.get("desc", ""),
        "owner": meta.get("uploader", ""),
        "duration": meta.get("duration"),
        "page": page or 1,
        "transcript": limit_bytes(transcript, max_bytes),
        "source": source,
        "warnings": warnings,
    }


# ---------------------------------------------------------------- youtube 路径

def fetch_youtube(parsed: dict, group: int, max_bytes: int) -> dict:
    """YouTube 路径：yt-dlp 字幕（manual → auto）→ 元数据简介兜底。"""
    warnings: list[str] = []
    result = {
        "service": "youtube",
        "video_id": parsed["video_id"],
        "url": parsed["url"],
        "page": 1,
    }
    transcript: list[dict] = []
    source = ""
    try:
        transcript, source, w = ytdlp_fetch(parsed["url"], "youtube", group, max_bytes)
        warnings.extend(w)
    except FetchError as e:
        warnings.append(f"yt-dlp 字幕抓取失败：{e}")

    try:
        meta = ytdlp_metadata(parsed["url"])
        result.update(title=meta["title"], desc=meta["desc"],
                      duration=meta["duration"], owner=meta["uploader"])
    except FetchError as e:
        warnings.append(str(e))

    if not transcript:
        transcript, source = [], "desc-fallback"
        warnings.append(
            "无可用字幕，已降级为「标题+简介」总结（BibiGPT 同款兜底）；"
            "输出时必须向用户声明该结论基于简介而非字幕"
        )
    transcript = limit_bytes(transcript, max_bytes)
    result.update(transcript=transcript, source=source, warnings=warnings)
    return result


# ---------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser(description="抓取 Bilibili/YouTube 字幕/转写（video-summary skill）")
    ap.add_argument("url", help="视频链接（bilibili.com / b23.tv / youtube.com / youtu.be）")
    ap.add_argument("--page", type=int, default=0, help="B 站分 P（默认取 URL ?p= 或 1）")
    ap.add_argument("--group", type=int, default=GROUP_SIZE, help="每段合并字幕条数（默认 7）")
    ap.add_argument("--max-bytes", type=int, default=DEFAULT_MAX_BYTES,
                    help="transcript 字节上限，超限随机减半（默认 6200，0 关闭）")
    ap.add_argument("--out", help="结果写入该 JSON 文件（默认打印 stdout）")
    ap.add_argument("--engine", choices=["auto", "api", "ytdlp"], default="auto",
                    help="B 站抓取引擎：api=纯 API；ytdlp=直接 yt-dlp；auto=API 优先 ytdlp 兜底")
    ap.add_argument("--allow-desc-fallback", action="store_true",
                    help="B 站无登录态拿不到字幕时，允许直接降级为「标题+简介」总结"
                         "（默认先返回 login-required 引导用户登录，exit 5）")
    args = ap.parse_args()

    if args.engine == "api":
        os.environ["VIDEO_SUMMARY_ENGINE"] = "api"

    try:
        parsed = parse_url(args.url)
        sessdata = (os.environ.get("BILIBILI_SESSDATA") or "").strip() or None
        if parsed["service"] == "bilibili":
            if args.engine == "ytdlp":
                result = build_bili_ytdlp_result(parsed, args.page or parsed["page"],
                                                 args.group, args.max_bytes, sessdata,
                                                 args.allow_desc_fallback)
            else:
                result = fetch_bilibili(parsed, args.page or parsed["page"], sessdata,
                                        args.group, args.max_bytes,
                                        args.allow_desc_fallback)
        else:
            result = fetch_youtube(parsed, args.group, args.max_bytes)
    except FetchError as e:
        code = EXIT_BAD_URL if "暂不支持" in str(e) else EXIT_FETCH_ERROR
        print(json.dumps({"error": str(e)}, ensure_ascii=False), file=sys.stderr)
        return code

    payload = json.dumps(result, ensure_ascii=False, indent=2)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(payload + "\n")
        print(
            f"saved: {args.out} | {result.get('source')} | "
            f"{len(result.get('transcript') or [])} segments | {result.get('title', '')[:40]}",
            file=sys.stderr,
        )
    else:
        print(payload)
    return EXIT_LOGIN_REQUIRED if result.get("login_required") else EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
