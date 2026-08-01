# 🌳 树洞数据解析器 - Treehole Parser

解析北大树洞页面数据，暴露结构化 JSON API 供前端使用。

## 📦 安装

1. 打开 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本文件夹

## 🚀 使用

1. 访问 https://treehole.pku.edu.cn/ch/web/pc/index
2. 打开 F12 Console
3. 调用 API：

```javascript
// 获取帖子列表
TreeholeAPI.getPosts()

// 获取帖子详情（先点击一个帖子）
TreeholeAPI.getPostDetail()

// 获取评论
TreeholeAPI.getComments()

// 搜索
await TreeholeAPI.search("关键词")
```

## 📖 API 文档

详见 [API.md](API.md)

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
