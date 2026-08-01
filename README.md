# 🌳 树洞数据解析器 v2.0

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
// 获取帖子列表
const posts = await TreeholeAPI.getPosts(1, 20);

// 获取帖子详情
const post = await TreeholeAPI.getPost(8430775);

// 获取评论
const comments = await TreeholeAPI.getComments(8430775);

// 搜索
const results = await TreeholeAPI.search("考试");
```

## 📖 API 文档

详见 [API.md](API.md)

## 🏗️ 架构

```
浏览器 (Cookie 认证)
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
