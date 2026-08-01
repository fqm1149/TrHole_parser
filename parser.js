/**
 * 树洞数据解析器 v3.0 - 完整 headers 认证
 * 
 * 关键 headers（从原版树洞抓取）：
 *   Authorization: Bearer <token>    ← localStorage('token')
 *   X-XSRF-TOKEN: <xsrf>            ← cookie('XSRF-TOKEN')
 *   uuid: Web_PKUHOLE_2.0.0_WEB_UUID_xxx  ← 设备唯一ID
 *   userAgent: pku_web               ← 自定义标识
 */
(function() {
  'use strict';

  const BASE = '/chapi/api/v3';
  
  // ===== 获取认证信息 =====
  function getAuthHeaders() {
    const token = localStorage.getItem('token') || '';
    const xsrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '';
    
    // uuid 格式：Web_PKUHOLE_2.0.0_WEB_UUID_xxxxxxxx
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

  // ===== 通用请求函数 =====
  async function request(endpoint, params = {}, method = 'GET') {
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
    
    const headers = getAuthHeaders();
    
    const options = {
      method,
      credentials: 'include',
      headers
    };
    
    if (method === 'POST') {
      options.body = JSON.stringify({});
    }
    
    const resp = await fetch(url.toString(), options);
    
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    
    const data = await resp.json();
    
    if (data.success === false) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data.data;
  }

  // ===== 获取帖子列表 =====
  async function getPosts(page = 1, limit = 20) {
    const data = await request(`${BASE}/hole/list_comments`, {
      page,
      limit,
      comment_limit: 3,
      is_follow: 1,
      comment_stream: 1
    });
    
    const posts = (data.data || []).map(parsePost);
    return {
      posts,
      total: data.total || 0,
      page: data.page || page,
      limit: data.limit || limit,
      hasMore: posts.length === limit
    };
  }

  // ===== 获取单个帖子 =====
  async function getPost(pid) {
    const data = await request(`${BASE}/hole/get`, { pid });
    return parsePost(data);
  }

  // ===== 获取评论 =====
  async function getComments(pid, page = 1, limit = 50) {
    const data = await request(`${BASE}/hole/list_comments`, {
      pid,
      page,
      limit,
      comment_limit: 0,
      comment_stream: 1
    });
    
    const comments = (data.data || []).map(parseComment);
    return {
      comments,
      total: data.total || 0,
      page: data.page || page,
      hasMore: comments.length === limit
    };
  }

  // ===== 搜索帖子 =====
  async function search(keyword, page = 1, limit = 20) {
    const data = await request(`${BASE}/hole/list_comments`, {
      keyword,
      page,
      limit,
      comment_limit: 3,
      is_follow: 1,
      comment_stream: 1
    });
    
    const posts = (data.data || []).map(parsePost);
    return {
      posts,
      total: data.total || 0,
      page: data.page || page,
      keyword,
      hasMore: posts.length === limit
    };
  }

  // ===== 获取标签 =====
  async function getTags() {
    return await request(`${BASE}/tags/tree`);
  }

  // ===== 获取用户信息 =====
  async function getUserInfo() {
    return await request(`${BASE}/users/info`, {}, 'POST');
  }

  // ===== 解析帖子 =====
  function parsePost(raw) {
    if (!raw) return null;
    return {
      pid: raw.pid,
      title: raw.title || '',
      content: raw.content || '',
      timestamp: raw.timestamp,
      time: formatTime(raw.timestamp),
      like_num: raw.like_num || 0,
      tread_num: raw.tread_num || 0,
      comment_num: raw.comment_num || 0,
      share_num: raw.share_num || 0,
      images: (raw.images || []).map(img => ({
        id: img.id,
        url: `/chapi/api/v3/media/getImageBinary?id=${img.id}`,
        thumbnail: `/chapi/api/v3/media/getThumbnail?id=${img.id}`
      })),
      tags: raw.tags || [],
      user: raw.user ? {
        uid: raw.user.uid,
        nickname: raw.user.nickname || '匿名',
        avatar: raw.user.avatar || null
      } : null,
      preview_comments: (raw.comments || []).map(parseComment),
      _raw: raw
    };
  }

  // ===== 解析评论 =====
  function parseComment(raw) {
    if (!raw) return null;
    return {
      id: raw.id,
      pid: raw.pid,
      content: raw.content || '',
      timestamp: raw.timestamp,
      time: formatTime(raw.timestamp),
      like_num: raw.like_num || 0,
      reply_to: raw.reply_to || null,
      user: raw.user ? {
        uid: raw.user.uid,
        nickname: raw.user.nickname || '匿名',
        avatar: raw.user.avatar || null
      } : null,
      quote: raw.quote ? {
        id: raw.quote.id,
        content: raw.quote.content,
        user: raw.quote.user?.nickname || '匿名'
      } : null,
      _raw: raw
    };
  }

  // ===== 时间格式化 =====
  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff/60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff/86400000)}天前`;
    return `${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;
  }

  // ===== 暴露全局 API =====
  window.TreeholeAPI = {
    getPosts,
    getPost,
    getComments,
    search,
    getTags,
    getUserInfo,
    version: '3.0.0'
  };

  console.log('[Treehole Parser v3.0] Loaded');
  console.log('[Treehole Parser v3.0] Headers: Authorization + XSRF + uuid + userAgent');
})();
