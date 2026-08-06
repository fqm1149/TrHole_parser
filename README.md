# 🌳 树洞数据解析器 v7.2

直接调用北大树洞后端 API，返回结构化 JSON 数据的 Chrome 扩展。

## ✅ 功能

| 功能 | API | 说明 |
|------|-----|------|
| 帖子列表 | `getPosts(page, limit)` | 最新帖子，分页 |
| 关注帖子 | `getFollowed(page, limit)` | 已关注的帖子 |
| 悬赏帖子 | `getBounty(page, limit)` | 悬赏帖子 |
| 帖子详情 | `getPost(pid)` | 单个帖子 + 预览评论 |
| 评论列表 | `getComments(pid, page, limit)` | 帖子评论，分页 |
| 搜索 | `search(keyword, page, limit)` | 关键词搜索 |
| 图片获取 | `getImage(id, opts)` | 原图/缩略图/base64 |
| 标签树 | `getTags()` | 所有标签 |
| 用户信息 | `getUserInfo()` | 当前用户 |
| 未读消息 | `getUnreadMessages(type)` | 系统/站内消息 |

## 📦 安装

1. 打开 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本文件夹

## 🚀 使用

```javascript
// 登录树洞后，F12 Console 中调用
const posts = await TreeholeAPI.getPosts(1, 20);
const followed = await TreeholeAPI.getFollowed(1, 20);
const post = await TreeholeAPI.getPost(8430775);
const comments = await TreeholeAPI.getComments(8430775, 1, 50);
const results = await TreeholeAPI.search("考试");
const img = await TreeholeAPI.getImage(50007);
```

## 📖 API 文档

详见 [API.md](API.md)

## ⚠️ 已知坑 & 踩坑记录

### 认证
- 需要 Bearer token（`pku_token`）+ `_session` cookie
- 仅 cookie 不够，会返回 `40002: 请手机短信验证`
- 解决方案：用持久化 Chrome profile（`--user-data-dir`）保持登录态
- Cookie 存储：`pku_token`（JWT）、`_session`（HttpOnly JWT）、`XSRF-TOKEN`

### API 响应格式
- 响应结构是 `{ data: { list: [...], total } }`，**不是** `{ data: { data: [...] } }`
- 字段映射：`hole.text` → `content`，`hole.reply` → `comment_num`，`hole.likenum` → `like_num`
- 评论字段：`comment.cid` → `id`，`comment.text` → `content`，`comment.name_tag` → 用户标识

### 评论 API 选择
- **正确**：`comment/list` — 返回所有评论，支持分页
- **错误**：`hole/one` — 只返回约 10 条预览评论
- `getComments()` 内部使用 `comment/list`

### 关注/悬赏
- `getFollowed()` → `list_comments?is_follow=1`
- `getBounty()` → `list_comments?reward=1`

### 引用格式
- 帖子内容中 `#` + 7位数字是引用格式（如 `#8416488`）
- `quote` 字段可能不是数组，需要用 `Array.isArray()` 检查

### 其他
- `extra` 字段是内部热度指标，**不是**转发/分享数
- 请求间隔建议 ≥1 秒，避免反爬
- 图片必须认证访问，直接 URL 返回 401

## 📁 文件

```
treehole-parser/
├── manifest.json
├── parser.js         # 核心解析器 v7.2
├── popup.html
├── icons/
├── API.md
└── README.md
```

## 📝 Changelog

### v7.2
- 文档更新：补充踩坑记录和已知问题
- 同步 hollow_art 前端开发中发现的 API 细节

### v7.1（稳定版）
- 删除 `getBookmarks()`（与 getFollowed 混淆）
- 保留 `getFollowed()` / `getBounty()`

### v7.0
- 新增 `getFollowed()` / `getBounty()`

### v6.1
- 新增图片 API（getImage/getThumbnail/getImages）

### v6.0
- 修复 API 响应字段映射（data.list）

### v5.0
- 修复数据结构映射（hole.text → content）

### v4.0
- 完整 API 覆盖

### v3.0
- 补全认证 headers
