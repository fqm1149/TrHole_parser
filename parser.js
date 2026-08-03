/**
 * 树洞数据解析器 v5.0 - 修复数据结构映射
 * 
 * 实际 API 返回格式：
 *   getPost(pid) → { hole: {...}, list: [...comments] }
 *   getPosts()   → { data: [{hole, list}, ...], total: N }
 *   
 * 字段映射：
 *   hole.text       → content
 *   hole.timestamp  → Unix seconds (需 ×1000 转 ms)
 *   hole.reply      → comment_num
 *   hole.likenum    → like_num
 *   hole.tags_info  → tags
 *   comment.cid     → id
 *   comment.text    → content
 *   comment.name_tag → user label (洞主/Alice...)
 *   comment.comment_id → reply_to
 */
(function() {
  'use strict';

  const BASE = '/chapi/api/v3';
  
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

  async function request(endpoint, params = {}, method = 'GET') {
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
    const options = { method, credentials: 'include', headers: getAuthHeaders() };
    if (method === 'POST') options.body = JSON.stringify({});
    const resp = await fetch(url.toString(), options);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.success === false) throw new Error(data.message || `code ${data.code}`);
    return data.data;
  }

  // ===== getPosts =====
  async function getPosts(page = 1, limit = 10) {
    const data = await request(`${BASE}/hole/list_comments`, {
      page, limit, comment_limit: 3, is_follow: 1, comment_stream: 1
    });
    // data = { list: [{hole, list}, ...], total }
    const items = data.list || [];
    const posts = items.map(wrapPost);
    return { posts, total: data.total || 0, page, hasMore: posts.length === limit };
  }

  // ===== getPost =====
  async function getPost(pid) {
    const data = await request(`${BASE}/hole/one`, { pid, comment_stream: 1 });
    // data = { hole: {...}, list: [...] }
    return wrapPost(data);
  }

  // ===== getComments =====
  async function getComments(pid, page = 1, limit = 50) {
    const data = await request(`${BASE}/hole/list_comments`, {
      pid, page, limit, comment_limit: 0, comment_stream: 1
    });
    // data = { list: [{hole, list}, ...], total }
    const items = data.list || [];
    const comments = [];
    items.forEach(item => {
      if (Array.isArray(item.list)) {
        item.list.forEach(c => comments.push(wrapComment(c, item.hole)));
      }
    });
    return { comments, total: data.total || 0, hasMore: comments.length === limit };
  }

  // ===== search =====
  async function search(keyword, page = 1, limit = 20) {
    const data = await request(`${BASE}/hole/list_comments`, {
      keyword, page, limit, comment_limit: 3, is_follow: 1, comment_stream: 1
    });
    const items = data.list || [];
    return { posts: items.map(wrapPost), total: data.total || 0, keyword, hasMore: items.length === limit };
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

  // ===== wrapPost: {hole, list} → 标准 Post =====
  function wrapPost(item) {
    if (!item || !item.hole) return null;
    const h = item.hole;
    return {
      pid: h.pid,
      content: h.text || '',
      timestamp: h.timestamp ? new Date(h.timestamp * 1000).toISOString() : null,
      time: fmtTime(h.timestamp),
      type: h.type,
      like_num: h.likenum || 0,
      tread_num: h.tread_num || 0,
      comment_num: h.reply || 0,
      share_num: h.extra || 0,
      tags: Array.isArray(h.tags_info) ? h.tags_info.map(t => t.name || t) : [],
      images: parseMediaIds(h.media_ids),
      anonymous: h.anonymous === 1,
      is_follow: h.is_follow === 1,
      is_top: h.is_top === 1,
      fold: h.fold || 0,
      preview_comments: Array.isArray(item.list) ? item.list.map(c => wrapComment(c, h)) : [],
      _raw: item
    };
  }

  // ===== wrapComment =====
  function wrapComment(c, hole) {
    if (!c) return null;
    return {
      id: c.cid,
      pid: c.pid,
      content: c.text || '',
      timestamp: c.timestamp ? new Date(c.timestamp * 1000).toISOString() : null,
      time: fmtTime(c.timestamp),
      name_tag: c.name_tag || null,
      is_lz: c.is_lz === 1,
      reply_to: c.comment_id || null,
      anonymous: c.anonymous === 1,
      images: parseMediaIds(c.media_ids),
      quote: Array.isArray(c.quote) ? c.quote.map(q => ({
        id: q.cid,
        content: q.text,
        name_tag: q.name_tag
      })) : [],
      _raw: c
    };
  }

  // ===== parseMediaIds =====
  function parseMediaIds(ids) {
    if (!ids || ids === '') return [];
    const idList = typeof ids === 'string' ? ids.split(',') : Array.isArray(ids) ? ids : [];
    return idList.filter(Boolean).map(id => ({
      id: parseInt(id),
      url: `/chapi/api/v3/media/getImageBinary?id=${id}`,
      thumbnail: `/chapi/api/v3/media/getThumbnail?id=${id}`
    }));
  }

  // ===== fmtTime =====
  function fmtTime(ts) {
    if (!ts) return '';
    const d = new Date(ts * 1000), now = new Date(), diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff/60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff/86400000)}天前`;
    return `${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  window.TreeholeAPI = {
    getPosts, getPost, getComments, search,
    getTags, getNavigation, getUserConfig, getBookmarks,
    getUnreadMessages, getExclusiveIds, getBlockingWords, getReminders, getUserInfo,
    version: '5.0.0'
  };
  console.log('[Treehole Parser v5.0] Loaded - Fixed data mapping');
})();
