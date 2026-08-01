/**
 * 树洞数据解析器 v2.0 - 直接调用后端 API
 * 
 * 功能：通过树洞 RESTful API 获取结构化数据
 * 依赖：浏览器的登录态 Cookie（无需前端 DOM）
 * 
 * API 列表：
 *   TreeholeAPI.getPosts(page, limit)     - 获取帖子列表
 *   TreeholeAPI.getPost(pid)              - 获取单个帖子详情
 *   TreeholeAPI.getComments(pid, page)    - 获取帖子评论
 *   TreeholeAPI.search(keyword, page)     - 搜索帖子
 *   TreeholeAPI.getTags()                 - 获取标签树
 *   TreeholeAPI.getUserInfo()             - 获取当前用户信息
 */
(function() {
  'use strict';

  const BASE = '/chapi/api/v3';
  
  // ===== 通用请求函数 =====
  async function request(endpoint, params = {}) {
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
    
    const resp = await fetch(url.toString(), {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    
    const data = await resp.json();
    
    // 树洞 API 统一返回格式: { success, message, data }
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
      comment_limit: 3,  // 每个帖子预览3条评论
      is_follow: 1,
      comment_stream: 1
    });
    
    // 解析帖子列表
    const posts = (data.data || []).map(parsePostFromAPI);
    
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
    return parsePostFromAPI(data);
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
    
    const comments = (data.data || []).map(parseCommentFromAPI);
    
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
    
    const posts = (data.data || []).map(parsePostFromAPI);
    
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
    const data = await request(`${BASE}/tags/tree`);
    return data;
  }

  // ===== 获取用户信息 =====
  async function getUserInfo() {
    const data = await request(`${BASE}/users/info`, {}, 'POST');
    return data;
  }

  // ===== 解析帖子数据（从 API 响应） =====
  function parsePostFromAPI(raw) {
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
      // 预览评论（如果有）
      preview_comments: (raw.comments || []).map(parseCommentFromAPI),
      // 原始数据（调试用）
      _raw: raw
    };
  }

  // ===== 解析评论数据（从 API 响应） =====
  function parseCommentFromAPI(raw) {
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
      // 引用的评论
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
    version: '2.0.0'
  };

  console.log('[Treehole Parser v2.0] Loaded');
  console.log('[Treehole Parser v2.0] API: TreeholeAPI.getPosts() / getPost(pid) / getComments(pid) / search(keyword)');
})();
