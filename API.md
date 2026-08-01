# 树洞数据解析器 - API 使用说明

## 📌 概述

树洞数据解析器是一个 Chrome 扩展，它注入到北大树洞页面中，解析 DOM 数据并暴露一个结构化的 JSON API。

**使用方式**：在树洞页面的浏览器 Console 中调用 `TreeholeAPI.xxx()`

## 🚀 快速开始

1. 安装扩展（开发者模式 → 加载已解压扩展）
2. 访问 https://treehole.pku.edu.cn/ch/web/pc/index
3. 打开 F12 Console
4. 输入 `TreeholeAPI.getPosts()` 即可获取数据

## 📡 API 列表

### TreeholeAPI.getPosts()

获取当前页面所有帖子。

**返回值**：`Post[]`

```javascript
const posts = TreeholeAPI.getPosts();
console.log(posts);
// [
//   {
//     pid: 8430775,
//     time: "07-30 09:45",
//     content: "地震概论 zkc 统分洞\n地概 教员 第一大课",
//     comments: 42,
//     likes: 21,
//     shares: 1,
//     hasImage: true,
//     imageUrl: "data:image/jpeg;base64,...",
//     tags: ["地概", "教员"]
//   },
//   ...
// ]
```

### TreeholeAPI.getPostDetail()

获取当前打开的帖子详情（需要先点击某个帖子）。

**返回值**：`PostDetail | null`

```javascript
const detail = TreeholeAPI.getPostDetail();
console.log(detail);
// {
//   pid: 8430775,
//   time: "07-30 09:45",
//   content: "地震概论 zkc 统分洞\n地概 教员 第一大课",
//   comments: 42,
//   likes: 21,
//   hasImage: true,
//   imageUrl: "data:image/jpeg;base64,..."
// }
```

### TreeholeAPI.getComments()

获取当前帖子的评论列表。

**返回值**：`Comment[]`

```javascript
const comments = TreeholeAPI.getComments();
console.log(comments);
// [
//   {
//     index: 0,
//     pid: 38856036,
//     time: "07-30 09:45",
//     user: "[洞主]",
//     content: "dz🌈",
//     hasQuote: false,
//     quoteContent: null
//   },
//   {
//     index: 1,
//     pid: 38856037,
//     time: "07-30 09:46",
//     user: "[Alice]",
//     content: "🌈",
//     hasQuote: false,
//     quoteContent: null
//   },
//   ...
// ]
```

### TreeholeAPI.search(keyword)

搜索帖子。

**参数**：`keyword: string` - 搜索关键词

**返回值**：`Promise<Post[]>`

```javascript
const results = await TreeholeAPI.search("考试");
console.log(results);
// [Post, Post, ...]
```

### TreeholeAPI.getRawData()

获取所有原始数据（帖子 + 详情 + 评论）。

**返回值**：`RawData`

```javascript
const raw = TreeholeAPI.getRawData();
console.log(raw);
// {
//   posts: [...],
//   detail: {...},
//   comments: [...],
//   url: "https://treehole.pku.edu.cn/ch/web/pc/index",
//   title: "北大树洞",
//   timestamp: "2026-07-30T10:00:00.000Z"
// }
```

### TreeholeAPI.refresh()

刷新页面数据（等同于 getRawData）。

## 📊 数据结构

### Post

| 字段 | 类型 | 说明 |
|------|------|------|
| pid | number | 帖子ID |
| time | string | 发布时间 (MM-DD HH:MM) |
| content | string | 帖子内容 |
| comments | number | 评论数 |
| likes | number | 点赞数 |
| shares | number | 分享数 |
| hasImage | boolean | 是否有图片 |
| imageUrl | string | 图片URL (base64或http) |
| tags | string[] | 标签列表 |

### PostDetail

| 字段 | 类型 | 说明 |
|------|------|------|
| pid | number | 帖子ID |
| time | string | 发布时间 |
| content | string | 完整内容 |
| comments | number | 评论数 |
| likes | number | 点赞数 |
| hasImage | boolean | 是否有图片 |
| imageUrl | string | 图片URL |

### Comment

| 字段 | 类型 | 说明 |
|------|------|------|
| index | number | 评论序号 |
| pid | number | 评论ID |
| time | string | 评论时间 |
| user | string | 用户标识 (如 [洞主]) |
| content | string | 评论内容 |
| hasQuote | boolean | 是否引用了其他评论 |
| quoteContent | string | 被引用的内容 |

## 🔧 前端集成示例

```html
<!DOCTYPE html>
<html>
<head>
  <title>我的树洞前端</title>
</head>
<body>
  <div id="app"></div>
  
  <script>
    // 等待解析器加载
    function waitForParser() {
      return new Promise((resolve) => {
        if (window.TreeholeAPI) {
          resolve();
        } else {
          setTimeout(() => waitForParser().then(resolve), 100);
        }
      });
    }
    
    async function init() {
      await waitForParser();
      
      // 获取帖子列表
      const posts = TreeholeAPI.getPosts();
      
      // 渲染到页面
      const app = document.getElementById('app');
      app.innerHTML = posts.map(post => `
        <div class="post">
          <h3>#${post.pid}</h3>
          <p>${post.content}</p>
          <span>💬 ${post.comments} ⭐ ${post.likes}</span>
        </div>
      `).join('');
    }
    
    init();
  </script>
</body>
</html>
```

## ⚠️ 注意事项

1. **页面依赖**：解析器依赖树洞的 DOM 结构，如果树洞改版可能需要更新
2. **认证状态**：需要在树洞页面上登录后才能获取数据
3. **动态加载**：如果树洞使用无限滚动，需要等待新内容加载后再调用 API
4. **图片处理**：图片 URL 可能是 base64 编码，可能较大
