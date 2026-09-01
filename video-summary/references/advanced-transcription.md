# 进阶方案：无字幕视频的转写与辅助文本源

主链路（SKILL.md）拿不到字幕时的进阶选项。均为可选依赖：缺工具时降级而不是报错。

## 1. 本地 ASR 转写（无字幕视频的完整解法）

前提：`ffmpeg`（本机已具备 ✅）。流程：抽音频 → whisper 系模型转写 → 得到带时间戳文本 →
按 SKILL.md Step 2 正常总结（source 标记为 `local-asr`）。

```bash
# 1) 抽音频（yt-dlp 下载音频流）
yt-dlp -x --audio-format m4a --audio-quality 5 -o /tmp/video_audio.%(ext)s "<URL>"

# 2) 转写（任选其一，Apple Silicon 推荐 mlx-whisper 或 whisper.cpp）
uvx --from mlx-whisper mlx_whisper /tmp/video_audio.m4a --language zh --output-format srt
# 或 whisper.cpp：brew install whisper-cpp && whisper-cli -m <模型ggml> -f /tmp/video_audio.m4a
# 或 faster-whisper：uvx --from faster-whisper whisper-ctranslate2 /tmp/video_audio.m4a
```

注意：
- 长视频转写耗时且占资源，先告知用户预估时间再执行；
- 输出的 srt 与字幕同构，可直接喂给 `scripts/fetch_transcript.py` 的归并逻辑思路（每 7 条合并、保留段首秒）。

## 2. B 站弹幕（辅助参考，不是转写）

实测（2026-08）免登录可用，返回 gzip 压缩 XML：

```bash
curl -s --compressed "https://api.bilibili.com/x/v1/dm/list.so?oid=<cid>" \
  -H "User-Agent: Mozilla/5.0 ..." -H "Referer: https://www.bilibili.com/"
```

- `<d p="秒,...">文本</d>`：`p` 首字段为出现秒数；
- 弹幕是观众评论而非口播内容，**只能作为热度/情绪参考，不能当 transcript 用**；
- 仅当用户明确想了解"弹幕都在说什么"时使用。

## 3. B 站直连 API 速查（fetch_transcript.py 内部实现，调试用）

```
GET https://api.bilibili.com/x/web-interface/view?bvid={BV}     # 元数据：title/desc/pages/cid/aid
GET https://api.bilibili.com/x/player/v2?aid={aid}&cid={cid}    # 字幕列表（需 SESSDATA）
GET https:{subtitle_url}                                        # 字幕 JSON body[{from,to,content}]，需 Referer
```

- 一律带浏览器 UA + `Referer: https://www.bilibili.com/`（实测缺失会 412）；
- `subtitle_url` 是协议相对地址 `//aisubtitle.hdslb.com/...`，需补 `https:`；
- 无 SESSDATA 时字幕列表恒为空（2023 起策略，实测已用 wbi 签名排除签名因素）；
- 多 P：`view.pages[].cid` 按 `page` 号选；分页不存在时报错并列出总数。
