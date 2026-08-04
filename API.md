# 树洞数据解析器 v6.1 - API 使用说明

## 📡 完整 API 列表

### 帖子相关

```javascript
// 获取帖子列表（分页）
const posts = await TreeholeAPI.getPosts(page, limit);
// → { posts: Post[], total, page, hasMore }

// 获取单个帖子详情（含预览评论）
const post = await TreeholeAPI.getPost(pid);
// → Post

// 获取帖子评论（分页）
const comments = await TreeholeAPI.getComments(pid, page, limit);
// → { comments: Comment[], total, hasMore }

// 搜索帖子
const results = await TreeholeAPI.search(keyword, page, limit);
// → { posts: Post[], total, keyword, hasMore }
```

### 图片相关

```javascript
// 获取原图 → blob URL（推荐，性能好）
const url = await TreeholeAPI.getImage(mediaId);
// → "blob:https://treehole.pku.edu.cn/xxx"

// 获取原图 → base64 data URL
const base64 = await TreeholeAPI.getImage(mediaId, { asBase64: true });
// → "data:image/jpeg;base64,/9j/4AAQ..."

// 获取缩略图
const thumb = await TreeholeAPI.getThumbnail(mediaId);
// → blob URL

// 获取缩略图 → base64
const thumbBase64 = await TreeholeAPI.getThumbnail(mediaId, true);
// → data URL

// 获取带水印原图
const watermark = await TreeholeAPI.getImage(mediaId, { watermark: true });
// → blob URL

// 批量获取帖子的所有图片
const mediaIds = "50007,50008,50009"; // 从 post.images 获取
const images = await TreeholeAPI.getImages(mediaIds);
// → [{ id: 50007, url: "blob:...", error: null }, ...]

// 批量获取 → base64
const images64 = await TreeholeAPI.getImages(mediaIds, { asBase64: true });
```

### 元数据

```javascript
const tags = await TreeholeAPI.getTags();
const nav = await TreeholeAPI.getNavigation();
const config = await TreeholeAPI.getUserConfig(type); // 2 或 3
const bookmarks = await TreeholeAPI.getBookmarks(page, limit);
const msgs = await TreeholeAPI.getUnreadMessages(type); // 'int_msg' 或 'sys_msg'
const ids = await TreeholeAPI.getExclusiveIds();
const words = await TreeholeAPI.getBlockingWords();
const reminders = await TreeholeAPI.getReminders(page, limit);
const user = await TreeholeAPI.getUserInfo();
```

## 📊 数据结构

### Post

```typescript
{
  pid: number;              // 帖子ID
  content: string;          // 内容
  timestamp: string;        // ISO 时间戳
  time: string;             // 格式化时间（如"3小时前"）
  type: string;             // "text" 或 "image"
  like_num: number;         // 点赞数
  tread_num: number;        // 踩数
  comment_num: number;      // 评论数
  share_num: number;        // 分享数
  tags: string[];           // 标签
  images: Image[];          // 图片列表（需调用 getImage 获取 URL）
  anonymous: boolean;       // 是否匿名
  is_follow: boolean;       // 是否关注
  is_top: boolean;          // 是否置顶
  preview_comments: Comment[];  // 预览评论
}
```

### Image

```typescript
{
  id: number;               // 图片 ID（用于调用 getImage）
  api: string;              // API 端点（仅供参考）
  thumbnail_api: string;    // 缩略图端点
  watermark_api: string;    // 水印端点
}
```

**注意**：`images` 数组中的 URL 需要认证才能访问。请调用 `TreeholeAPI.getImage(id)` 获取可用的 blob URL 或 base64。

### Comment

```typescript
{
  id: number;               // 评论 ID（cid）
  pid: number;              // 所属帖子 PID
  content: string;          // 内容
  timestamp: string;        // ISO 时间戳
  time: string;             // 格式化时间
  name_tag: string;         // 用户标识（如"洞主"、"Alice"）
  is_lz: boolean;           // 是否楼主
  reply_to: number|null;    // 回复的评论 ID
  images: Image[];          // 图片列表
  quote: Quote[];           // 引用的评论
}
```

## 🔧 前端集成示例

```html
<div id="app"></div>
<script src="parser.js"></script>
<script>
async function render() {
  const app = document.getElementById('app');
  const { posts } = await TreeholeAPI.getPosts(1, 10);
  
  for (const post of posts) {
    let imagesHtml = '';
    if (post.images.length > 0) {
      // 获取第一张图片
      const imgUrl = await TreeholeAPI.getImage(post.images[0].id);
      imagesHtml = `<img src="${imgUrl}" style="max-width:300px;">`;
    }
    
    app.innerHTML += `
      <div class="post">
        <h3>#${post.pid} · ${post.time}</h3>
        <p>${post.content}</p>
        ${imagesHtml}
        <span>💬 ${post.comment_num} ⭐ ${post.like_num}</span>
      </div>
    `;
  }
}
render();
</script>
```

## ⚠️ 注意事项

1. **图片必须认证**：直接访问图片 URL 会返回 401，必须调用 `getImage()`/`getThumbnail()`
2. **blob URL 生命周期**：blob URL 在页面刷新后失效，需要重新获取
3. **base64 大小**：base64 编码会增大约 33%，大图建议用 blob URL
4. **请求频率**：图片请求也受反爬限制，建议间隔 1 秒
