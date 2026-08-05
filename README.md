# 🌳 树洞数据解析器 v7.1（稳定版）

直接调用北大树洞后端 API，返回结构化 JSON 数据的 Chrome 扩展。

## ✅ 稳定功能

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

## 📁 文件

```
treehole-parser/
├── manifest.json
├── parser.js         # 核心解析器
├── popup.html
├── icons/
├── API.md
└── README.md
```

## 📝 Changelog

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

## 🔑 认证

需要浏览器已登录树洞，扩展自动使用：
- `Authorization: Bearer <token>`（localStorage）
- `X-XSRF-TOKEN`（cookie）
- `uuid`（自动生成）
