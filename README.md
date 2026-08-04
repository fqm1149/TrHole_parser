# 🌳 树洞数据解析器 v6.1

直接调用北大树洞后端 API，返回结构化 JSON 数据。

## 📦 安装

1. 打开 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本文件夹

## 🚀 使用

1. 登录树洞（确保浏览器有登录态）
2. 打开 F12 Console
3. 调用 API：

```javascript
// 帖子
const posts = await TreeholeAPI.getPosts(1, 10);
const post = await TreeholeAPI.getPost(8430775);
const comments = await TreeholeAPI.getComments(8430775);
const results = await TreeholeAPI.search("考试");

// 图片
const imgUrl = await TreeholeAPI.getImage(mediaId);
const thumbUrl = await TreeholeAPI.getThumbnail(mediaId);
const images = await TreeholeAPI.getImages(post.images);

// 元数据
const tags = await TreeholeAPI.getTags();
const user = await TreeholeAPI.getUserInfo();
```

## 📖 API 文档

详见 [API.md](API.md)

## 🏗️ 架构

```
浏览器 (Cookie + Token 认证)
    ↓
parser.js (Chrome Extension)
    ↓
树洞后端 API (/chapi/api/v3/*)
    ↓
结构化 JSON 数据
    ↓
前端渲染 (Gemini 负责)
```

## 📁 文件结构

```
treehole-parser/
├── manifest.json     # Chrome 扩展配置
├── parser.js         # 核心解析逻辑
├── popup.html        # 扩展弹窗
├── icons/            # 扩展图标
├── API.md            # API 使用文档
└── README.md         # 本文件
```

## 📝 Changelog

### v6.1
- 新增 `getImage()` / `getThumbnail()` / `getImages()` 图片 API
- 图片需认证访问，支持 blob URL 和 base64

### v6.0
- 修复 `list_comments` 返回扁平 hole 格式
- 修复 `getComments` 改用 `hole/one` 获取评论

### v5.0
- 修复字段映射（hole.text → content 等）

### v4.0
- 完整 API 覆盖（tags、navigation、bookmarks 等）

### v3.0
- 补全认证 headers（Authorization、XSRF、uuid）

### v1.0
- 初始版本
