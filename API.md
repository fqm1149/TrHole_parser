# 树洞数据解析器 v4.0 - API 使用说明

## 📡 完整 API 列表

### 帖子相关

```javascript
// 获取帖子列表（带预览评论）
const posts = await TreeholeAPI.getPosts(page, limit);
// → { posts: Post[], total, page, hasMore }

// 获取单个帖子详情
const post = await TreeholeAPI.getPost(pid);
// → Post

// 获取帖子评论
const comments = await TreeholeAPI.getComments(pid, page, limit);
// → { comments: Comment[], total, hasMore }

// 搜索帖子
const results = await TreeholeAPI.search(keyword, page, limit);
// → { posts: Post[], total, keyword, hasMore }
```

### 元数据

```javascript
// 标签树
const tags = await TreeholeAPI.getTags();

// 导航项
const nav = await TreeholeAPI.getNavigation();

// 用户配置
const config = await TreeholeAPI.getUserConfig(type); // type: 2或3

// 收藏列表
const bookmarks = await TreeholeAPI.getBookmarks(page, limit);

// 未读消息
const msgs = await TreeholeAPI.getUnreadMessages(type); // 'int_msg' 或 'sys_msg'

// 匿名ID列表
const ids = await TreeholeAPI.getExclusiveIds();

// 屏蔽词
const words = await TreeholeAPI.getBlockingWords();

// 提醒列表
const reminders = await TreeholeAPI.getReminders(page, limit);

// 用户信息
const user = await TreeholeAPI.getUserInfo();
```

## 📊 数据结构

### Post
```json
{
  "pid": 8430775,
  "title": "",
  "content": "帖子内容...",
  "timestamp": "2026-07-30T09:45:00",
  "time": "3小时前",
  "like_num": 20,
  "tread_num": 0,
  "comment_num": 42,
  "share_num": 1,
  "images": [{"id": 49197, "url": "...", "thumbnail": "..."}],
  "tags": ["地概"],
  "user": {"uid": "xxx", "nickname": "匿名", "avatar": null},
  "preview_comments": [Comment, ...]
}
```

### Comment
```json
{
  "id": 38856036,
  "pid": 8430775,
  "content": "评论内容...",
  "timestamp": "2026-07-30T09:45:00",
  "time": "3小时前",
  "like_num": 5,
  "reply_to": null,
  "user": {"uid": "xxx", "nickname": "匿名", "avatar": null},
  "quote": {"id": 123, "content": "...", "user": "匿名"}
}
```

## 🔧 Headers（关键）

```
Authorization: Bearer <token>     ← localStorage('token')
X-XSRF-TOKEN: <xsrf>             ← cookie
uuid: Web_PKUHOLE_2.0.0_WEB_UUID_xxx  ← 自动生成
userAgent: pku_web                ← 固定值
Accept: application/json
Content-Type: application/json
```
