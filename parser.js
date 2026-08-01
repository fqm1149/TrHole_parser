/**
 * 树洞数据解析器 v4.0 - 完整 API 覆盖
 * 
 * 抓取到的原版请求：
 *   GET  /hole/list_comments  - 帖子列表+评论
 *   GET  /hole/one?pid=XXX    - 单个帖子
 *   GET  /tags/tree           - 标签树
 *   GET  /navigation-items/list - 导航项
 *   GET  /user_config/get     - 用户配置
 *   GET  /bookmark/list       - 收藏列表
 *   GET  /message/un_read     - 未读消息
 *   GET  /exclusive_id/list   - 匿名ID列表
 *   GET  /person_blocking_words/index - 屏蔽词
 *   GET  /reminder/list       - 提醒列表
 *   POST /users/info          - 用户信息
 */
(function() {
  'use strict';

  const BASE = '/chapi/api/v3';
  
  // ===== 获取认证 headers =====
  function getAuthHeaders() {
    const token = localStorage.getItem('token') || '';
    const xsrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '';
    let uuid = localStorage.getItem('pku-uuid');
    if (!uuid) {
      uuid = 'Web_PKUHOLE_2.0.0_WEB_UUID_' + crypto.randomUUID();
      localStorage.setItem('pku-uuid', uuid);
    }
    return {
      'Authorization': `Bearer ${token}`,
      'X-XSRF-TOKEN': xsrf,
      'uuid': uuid,
      'userAgent': 'pku_web',
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    };
  }

  // ===== 通用请求 =====
  async function request(endpoint, params = {}, method = 'GET') {
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
    const options = {
      method,
      credentials: 'include',
      headers: getAuthHeaders()
    };
    if (method === 'POST') options.body = JSON.stringify({});
    const resp = await fetch(url.toString(), options);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.success === false) throw new Error(data.message);
    return data.data;
  }

  // ===== 帖子相关 =====
  async function getPosts(page = 1, limit = 10) {
    const data = await request(`${BASE}/hole/list_comments`, {
      page, limit, comment_limit: 10, is_follow: 1, comment_stream: 1
    });
    return {
      posts: (data.data || []).map(parsePost),
      total: data.total || 0,
      page: data.page || page,
      hasMore: (data.data || []).length === limit
    };
  }

  async function getPost(pid) {
    const data = await request(`${BASE}/hole/one`, { pid, comment_stream: 1 });
    return parsePost(data);
  }

  async function getComments(pid, page = 1, limit = 50) {
    const data = await request(`${BASE}/hole/list_comments`, {
      pid, page, limit, comment_limit: 0, comment_stream: 1
    });
    return {
      comments: (data.data || []).map(parseComment),
      total: data.total || 0,
      hasMore: (data.data || []).length === limit
    };
  }

  // ===== 搜索 =====
  async function search(keyword, page = 1, limit = 20) {
    const data = await request(`${BASE}/hole/list_comments`, {
      keyword, page, limit, comment_limit: 3, is_follow: 1, comment_stream: 1
    });
    return {
      posts: (data.data || []).map(parsePost),
      total: data.total || 0,
      keyword,
      hasMore: (data.data || []).length === limit
    };
  }

  // ===== 元数据 =====
  async function getTags() { return await request(`${BASE}/tags/tree`); }
  async function getNavigation() { return await request(`${BASE}/navigation-items/list`, { page: 1, limit: 1000 }); }
  async function getUserConfig(type = 2) { return await request(`${BASE}/user_config/get`, { type }); }
  async function getBookmarks(page = 1, limit = 60) { return await request(`${BASE}/bookmark/list`, { page, limit }); }
  async function getUnreadMessages(type = 'int_msg') { return await request(`${BASE}/message/un_read`, { message_type: type }); }
  async function getExclusiveIds() { return await request(`${BASE}/exclusive_id/list`); }
  async function getBlockingWords() { return await request(`${BASE}/person_blocking_words/index`); }
  async function getReminders(page = 1, limit = 1000) { return await request(`${BASE}/reminder/list`, { page, limit }); }
  async function getUserInfo() { return await request(`${BASE}/users/info`, {}, 'POST'); }

  // ===== 解析 =====
  function parsePost(r) {
    if (!r) return null;
    return {
      pid: r.pid, title: r.title || '', content: r.content || '',
      timestamp: r.timestamp, time: fmtTime(r.timestamp),
      like_num: r.like_num||0, tread_num: r.tread_num||0,
      comment_num: r.comment_num||0, share_num: r.share_num||0,
      images: (r.images||[]).map(img => ({
        id: img.id,
        url: `/chapi/api/v3/media/getImageBinary?id=${img.id}`,
        thumbnail: `/chapi/api/v3/media/getThumbnail?id=${img.id}`
      })),
      tags: r.tags||[],
      user: r.user ? { uid: r.user.uid, nickname: r.user.nickname||'匿名', avatar: r.user.avatar } : null,
      preview_comments: (r.comments||[]).map(parseComment),
      _raw: r
    };
  }

  function parseComment(r) {
    if (!r) return null;
    return {
      id: r.id, pid: r.pid, content: r.content||'',
      timestamp: r.timestamp, time: fmtTime(r.timestamp),
      like_num: r.like_num||0, reply_to: r.reply_to||null,
      user: r.user ? { uid: r.user.uid, nickname: r.user.nickname||'匿名', avatar: r.user.avatar } : null,
      quote: r.quote ? { id: r.quote.id, content: r.quote.content, user: r.quote.user?.nickname||'匿名' } : null,
      _raw: r
    };
  }

  function fmtTime(ts) {
    if (!ts) return '';
    const d = new Date(ts), now = new Date(), diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff/60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff/86400000)}天前`;
    return `${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  // ===== 暴露 API =====
  window.TreeholeAPI = {
    // 帖子
    getPosts, getPost, getComments, search,
    // 元数据
    getTags, getNavigation, getUserConfig, getBookmarks,
    getUnreadMessages, getExclusiveIds, getBlockingWords, getReminders, getUserInfo,
    version: '4.0.0'
  };

  console.log('[Treehole Parser v4.0] Loaded - Full API coverage');
})();
