# 树洞数据解析器 v7.2 - API 使用说明

## 📡 完整 API 列表

### 帖子相关
```javascript
// 获取帖子列表（分页）
const posts = await TreeholeAPI.getPosts(page, limit);
// → { posts: Post[], total, page, hasMore }

// 获取关注的帖子
const followed = await TreeholeAPI.getFollowed(page, limit);
// → { posts: Post[], total, page, hasMore }
// 内部: list_comments?is_follow=1

// 获取悬赏帖子
const bounty = await TreeholeAPI.getBounty(page, limit);
// → { posts: Post[], total, page, hasMore }
// 内部: list_comments?reward=1

// 获取单个帖子详情（含预览评论）
const post = await TreeholeAPI.getPost(pid);
// → Post

// 获取帖子评论（分页）
const comments = await TreeholeAPI.getComments(pid, page, limit);
// → { comments: Comment[], total, hasMore }
// 内部: comment/list（不是 hole/one！）

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
  content: string;          // 内容（原字段 hole.text）
  timestamp: string;        // ISO 时间戳
  time: string;             // 格式化时间
  like_num: number;         // 点赞数（原字段 hole.likenum）
  comment_num: number;      // 评论数（原字段 hole.reply）
  extra: number;            // 内部热度指标（不是转发数！）
  images: Image[];          // 图片列表
  tags: string[];           // 标签
  quote: any;               // 引用（可能是数组或对象，需 Array.isArray() 检查）
  preview_comments: Comment[];
}
```

### Comment
```typescript
{
  id: number;               // 评论ID (原字段 comment.cid)
  pid: number;              // 所属帖子 PID
  content: string;          // 内容（原字段 comment.text）
  time: string;             // 格式化时间
  name_tag: string;         // 用户标识（原字段 comment.name_tag）
  is_lz: boolean;           // 是否楼主
  reply_to: number|null;    // 回复的评论 ID（null=顶级评论）
}
```

## ⚠️ 踩坑记录

### 1. 评论 API 选择
```javascript
// ❌ 错误：hole/one 只返回约 10 条预览评论
const data = await request(`${BASE}/hole/one`, { pid });

// ✅ 正确：comment/list 返回所有评论，支持分页
const data = await request(`${BASE}/comment/list`, { pid, page, limit });
```

### 2. 响应格式
```javascript
// 实际响应结构
{ data: { list: [hole, hole, ...], total } }

// ❌ 错误的解析方式
const posts = data.data.data;  // undefined

// ✅ 正确的解析方式
const posts = data.data.list;
```

### 3. 字段映射
```javascript
// API 返回的字段名 ≠ 使用的字段名
hole.text       → content      // 帖子内容
hole.reply      → comment_num  // 评论数
hole.likenum    → like_num     // 点赞数
comment.cid     → id           // 评论ID
comment.text    → content      // 评论内容
comment.name_tag → name_tag    // 用户标识
```

### 4. 认证失败处理
```javascript
// 错误码 40002: 请手机短信验证
// 原因：仅 cookie 不够，需要 Bearer token
// 解决：用持久化 Chrome profile 保持登录态

// 启动 Chrome 时加参数：
// --user-data-dir=/path/to/persistent/profile
```

### 5. 引用格式检测
```javascript
// 帖子内容中的引用格式：# + 7位数字
const refRegex = /#(\d{7})/g;
const matches = content.match(refRegex);
// → ["#8416488", "#8430824"]

// quote 字段可能不是数组
const quotes = Array.isArray(post.quote) ? post.quote : [];
```

### 6. 请求频率控制
```javascript
// 建议请求间隔 ≥ 1 秒
// 避免触发反爬机制
await new Promise(r => setTimeout(r, 1000));
```

## 🔑 认证

需要浏览器已登录树洞，扩展自动使用：
- `Authorization: Bearer <pku_token>`
- `X-XSRF-TOKEN`（cookie）
- `_session`（HttpOnly cookie）
- `uuid`（自动生成）
