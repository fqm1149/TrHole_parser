# 树洞数据解析器 v7.0 - API 使用说明

## 📡 完整 API 列表

### 帖子相关

```javascript
// 获取帖子列表（分页）
const posts = await TreeholeAPI.getPosts(page, limit);
// → { posts: Post[], total, page, hasMore }

// 获取关注的帖子
const followed = await TreeholeAPI.getFollowed(page, limit);
// → { posts: Post[], total, page, hasMore }

// 获取悬赏帖子
const bounty = await TreeholeAPI.getBounty(page, limit);
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
// 获取原图 → blob URL
const url = await TreeholeAPI.getImage(mediaId);

// 获取原图 → base64
const base64 = await TreeholeAPI.getImage(mediaId, { asBase64: true });

// 获取缩略图
const thumb = await TreeholeAPI.getThumbnail(mediaId);

// 获取带水印原图
const watermark = await TreeholeAPI.getImage(mediaId, { watermark: true });

// 批量获取帖子的所有图片
const images = await TreeholeAPI.getImages(post.images);
// → [{ id, url, error }]
```

### 元数据

```javascript
const tags = await TreeholeAPI.getTags();
const nav = await TreeholeAPI.getNavigation();
const config = await TreeholeAPI.getUserConfig(type);
const bookmarks = await TreeholeAPI.getBookmarks(page, limit);
const msgs = await TreeholeAPI.getUnreadMessages(type);
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
  time: string;             // 格式化时间
  like_num: number;         // 点赞数
  comment_num: number;      // 评论数
  images: Image[];          // 图片列表
  tags: string[];           // 标签
  preview_comments: Comment[];
}
```

### Comment
```typescript
{
  id: number;               // 评论ID (cid)
  pid: number;              // 所属帖子 PID
  content: string;          // 内容
  time: string;             // 格式化时间
  name_tag: string;         // 用户标识
  is_lz: boolean;           // 是否楼主
  reply_to: number|null;    // 回复的评论 ID
}
```

## ⚠️ 注意事项

1. `getFollowed()` 需要用户已登录且有关注的帖子
2. `getBounty()` 参数 `reward=1` 可能需要验证
3. 图片必须认证访问，直接 URL 返回 401
4. 请求间隔建议 1 秒以上
