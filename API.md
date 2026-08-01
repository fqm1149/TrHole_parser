# 树洞数据解析器 v2.0 - API 使用说明

## 📌 概述

树洞数据解析器是一个 Chrome 扩展，直接调用树洞后端 RESTful API，返回结构化 JSON 数据。

**核心特点**：
- ✅ 直接调用后端 API，不依赖 DOM
- ✅ 使用浏览器 Cookie 自动认证
- ✅ 返回标准 JSON 格式
- ✅ 支持分页、搜索、筛选

## 🚀 快速开始

1. 安装扩展（开发者模式 → 加载已解压扩展）
2. 登录树洞（确保浏览器有登录态）
3. 打开 F12 Console
4. 调用 API：

```javascript
// 获取帖子列表
const posts = await TreeholeAPI.getPosts(1, 20);
console.log(posts);

// 获取单个帖子
const post = await TreeholeAPI.getPost(8430775);
console.log(post);

// 获取评论
const comments = await TreeholeAPI.getComments(8430775, 1, 50);
console.log(comments);

// 搜索
const results = await TreeholeAPI.search("考试", 1, 20);
console.log(results);
```

## 📡 API 列表

### TreeholeAPI.getPosts(page?, limit?)

获取帖子列表。

**参数**：
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量 |

**返回值**：`Promise<PostList>`

```javascript
{
  posts: [Post, Post, ...],  // 帖子数组
  total: 100,                // 总数
  page: 1,                   // 当前页
  limit: 20,                 // 每页数量
  hasMore: true              // 是否有更多
}
```

### TreeholeAPI.getPost(pid)

获取单个帖子详情。

**参数**：
| 参数 | 类型 | 说明 |
|------|------|------|
| pid | number | 帖子ID |

**返回值**：`Promise<Post>`

### TreeholeAPI.getComments(pid, page?, limit?)

获取帖子评论。

**参数**：
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| pid | number | - | 帖子ID（必填） |
| page | number | 1 | 页码 |
| limit | number | 50 | 每页数量 |

**返回值**：`Promise<CommentList>`

```javascript
{
  comments: [Comment, Comment, ...],  // 评论数组
  total: 50,                          // 总数
  page: 1,                            // 当前页
  hasMore: true                       // 是否有更多
}
```

### TreeholeAPI.search(keyword, page?, limit?)

搜索帖子。

**参数**：
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| keyword | string | - | 搜索关键词（必填） |
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量 |

**返回值**：`Promise<PostList>`

### TreeholeAPI.getTags()

获取标签树。

**返回值**：`Promise<TagTree>`

### TreeholeAPI.getUserInfo()

获取当前用户信息。

**返回值**：`Promise<UserInfo>`

## 📊 数据结构

### Post

```typescript
{
  pid: number;              // 帖子ID
  title: string;            // 标题（通常为空）
  content: string;          // 内容
  timestamp: string;        // ISO时间戳
  time: string;             // 格式化时间（如"3小时前"）
  like_num: number;         // 点赞数
  tread_num: number;        // 踩数
  comment_num: number;      // 评论数
  share_num: number;        // 分享数
  images: Image[];          // 图片列表
  tags: string[];           // 标签
  user: User | null;        // 用户信息
  preview_comments: Comment[];  // 预览评论
}
```

### Comment

```typescript
{
  id: number;               // 评论ID
  pid: number;              // 所属帖子PID
  content: string;          // 内容
  timestamp: string;        // ISO时间戳
  time: string;             // 格式化时间
  like_num: number;         // 点赞数
  reply_to: number | null;  // 回复的评论ID
  user: User | null;        // 用户信息
  quote: Quote | null;      // 引用的评论
}
```

### Image

```typescript
{
  id: number;               // 图片ID
  url: string;              // 原图URL
  thumbnail: string;        // 缩略图URL
}
```

### User

```typescript
{
  uid: string;              // 用户ID
  nickname: string;         // 昵称（匿名用户显示"匿名"）
  avatar: string | null;    // 头像URL
}
```

## 🔧 前端集成示例

```html
<!DOCTYPE html>
<html>
<head>
  <title>我的树洞前端</title>
  <style>
    .post { border: 1px solid #ddd; padding: 16px; margin: 10px; border-radius: 8px; }
    .post-header { color: #666; font-size: 14px; }
    .post-content { margin: 10px 0; }
    .post-stats { color: #999; font-size: 12px; }
    .comment { background: #f5f5f5; padding: 10px; margin: 5px 0; border-radius: 6px; }
  </style>
</head>
<body>
  <div id="app">加载中...</div>
  
  <script src="parser.js"></script>
  <script>
    async function init() {
      const app = document.getElementById('app');
      
      try {
        // 获取帖子列表
        const { posts } = await TreeholeAPI.getPosts(1, 10);
        
        // 渲染帖子
        app.innerHTML = posts.map(post => `
          <div class="post">
            <div class="post-header">#${post.pid} · ${post.time}</div>
            <div class="post-content">${post.content}</div>
            <div class="post-stats">
              💬 ${post.comment_num} · ⭐ ${post.like_num} · 🔄 ${post.share_num}
            </div>
            ${post.images.length > 0 ? `<img src="${post.images[0].thumbnail}" style="max-width:200px;">` : ''}
          </div>
        `).join('');
      } catch(e) {
        app.innerHTML = `错误: ${e.message}`;
      }
    }
    
    init();
  </script>
</body>
</html>
```

## ⚠️ 注意事项

1. **认证**：必须在树洞页面上登录后才能调用 API
2. **CORS**：API 请求需要 `credentials: 'include'`
3. **频率限制**：建议请求间隔 1-2 秒
4. **错误处理**：API 可能返回 401/403/500 错误
5. **分页**：使用 `hasMore` 判断是否还有更多数据
