/**
 * 树洞数据解析器 - Treehole Parser v1.0
 * 
 * 功能：解析北大树洞页面数据，暴露结构化 JSON API
 * 使用：在树洞页面的 Console 中调用 TreeholeAPI.xxx()
 * 
 * API 列表：
 *   TreeholeAPI.getPosts()           - 获取当前页面所有帖子
 *   TreeholeAPI.getPostDetail()      - 获取当前打开的帖子详情
 *   TreeholeAPI.getComments()        - 获取当前帖子的评论
 *   TreeholeAPI.search(keyword)      - 搜索帖子
 *   TreeholeAPI.refresh()            - 刷新页面数据
 *   TreeholeAPI.getRawData()         - 获取原始 DOM 数据
 */
(function() {
  'use strict';

  // ===== 解析单个帖子 =====
  function parsePost(row) {
    if (!row) return null;
    
    const postBox = row.querySelector('.box-post');
    const header = row.querySelector('.box-header');
    const content = row.querySelector('.box-content');
    const top = row.querySelector('.box-top.msy-post');
    
    if (!postBox || !content) return null;

    // PID
    const headerText = header?.textContent || '';
    const pidMatch = headerText.match(/#(\d+)/);
    const pid = pidMatch ? parseInt(pidMatch[1]) : null;

    // 时间
    const timeMatch = headerText.match(/(\d{1,2}-\d{1,2}\s+\d{2}:\d{2})/);
    const time = timeMatch ? timeMatch[1] : null;

    // 统计数据 - 格式: "1 20 42" (分享 点赞 评论) 在帖子开头
    const statsText = row.textContent || '';
    // 树洞的统计格式是 "分享数 点赞数 评论数" 在帖子最前面
    const statsMatch = statsText.match(/^(\d+)\s+(\d+)\s+(\d+)\s+#/);
    let shares = 0, likes = 0, comments = 0;
    if (statsMatch) {
      shares = parseInt(statsMatch[1]) || 0;
      likes = parseInt(statsMatch[2]) || 0;
      comments = parseInt(statsMatch[3]) || 0;
    }

    // 图片
    const hasImage = !!top?.style?.backgroundImage;
    const imageUrl = hasImage ? top.style.backgroundImage.replace(/url\(["']?/, '').replace(/["']?\)/, '') : null;

    // 标签
    const tags = [];
    content.querySelectorAll('a').forEach(a => {
      if (a.href?.includes('keyword=')) {
        tags.push(a.textContent.trim());
      }
    });

    return {
      pid,
      time,
      content: content.textContent.trim(),
      comments,
      likes,
      shares,
      hasImage,
      imageUrl,
      tags,
      element: row  // 保留 DOM 引用，供后续操作
    };
  }

  // ===== 解析评论 =====
  function parseComment(box, index) {
    if (!box) return null;
    
    const content = box.querySelector('.box-content-reply');
    const header = box.querySelector('.box-header');
    const quote = box.querySelector('.rItemQuoteTop');
    
    if (!content) return null;

    const headerText = header?.textContent || '';
    const pidMatch = headerText.match(/#(\d+)/);
    const timeMatch = headerText.match(/(\d{1,2}-\d{1,2}\s+\d{2}:\d{2})/);
    const userMatch = headerText.match(/\[(?:洞主|Alice|Bob|Carol|Dave|Eve|Francis|Grace|Hans|Iris|Jack|Kevin|Leo|Mike|Nick|Oscar|Piper|Quinn|Ray|Sam|Tina|Uma|Val|Wendy|Xander|Yuki|Zoe)\]/);

    return {
      index,
      pid: pidMatch ? parseInt(pidMatch[1]) : null,
      time: timeMatch ? timeMatch[1] : null,
      user: userMatch ? userMatch[0] : null,
      content: content.textContent.trim(),
      hasQuote: !!quote,
      quoteContent: quote?.textContent?.trim() || null,
      element: box
    };
  }

  // ===== 获取所有帖子 =====
  function getPosts() {
    const posts = [];
    document.querySelectorAll('.flow-item-row').forEach(row => {
      const post = parsePost(row);
      if (post) posts.push(post);
    });
    return posts;
  }

  // ===== 获取帖子详情 =====
  function getPostDetail() {
    // 尝试从侧边栏获取
    const sidebar = document.querySelector('.sidebar-content');
    if (!sidebar) return null;

    const postBox = sidebar.querySelector('.box-post');
    const content = sidebar.querySelector('.box-content-detail');
    const header = sidebar.querySelector('.box-header');
    const top = sidebar.querySelector('.box-top.msy-post');

    if (!postBox) return null;

    const headerText = header?.textContent || '';
    const pidMatch = headerText.match(/#(\d+)/);
    const timeMatch = headerText.match(/(\d{1,2}-\d{1,2}\s+\d{2}:\d{2})/);

    const statsText = sidebar.textContent || '';
    const commentMatch = statsText.match(/(\d+)\s*💬/);
    const likeMatch = statsText.match(/(\d+)\s*⭐/);

    const hasImage = !!top?.style?.backgroundImage;
    const imageUrl = hasImage ? top.style.backgroundImage.replace(/url\(["']?/, '').replace(/["']?\)/, '') : null;

    return {
      pid: pidMatch ? parseInt(pidMatch[1]) : null,
      time: timeMatch ? timeMatch[1] : null,
      content: content?.textContent?.trim() || '',
      comments: commentMatch ? parseInt(commentMatch[1]) : 0,
      likes: likeMatch ? parseInt(likeMatch[1]) : 0,
      hasImage,
      imageUrl
    };
  }

  // ===== 获取评论列表 =====
  function getComments() {
    const sidebar = document.querySelector('.sidebar-content');
    if (!sidebar) return [];

    const comments = [];
    sidebar.querySelectorAll('.commnet_box_inner').forEach((box, i) => {
      const comment = parseComment(box, i);
      if (comment) comments.push(comment);
    });
    return comments;
  }

  // ===== 搜索帖子 =====
  async function search(keyword) {
    // 通过 URL 参数搜索
    const searchUrl = `https://treehole.pku.edu.cn/ch/web/pc/index?keyword=${encodeURIComponent(keyword)}`;
    
    // 创建隐藏 iframe 加载搜索结果
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = searchUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const posts = [];
          iframeDoc.querySelectorAll('.flow-item-row').forEach(row => {
            const post = parsePost(row);
            if (post) posts.push(post);
          });
          document.body.removeChild(iframe);
          resolve(posts);
        } catch(e) {
          document.body.removeChild(iframe);
          resolve([]);
        }
      };
      
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch(e) {}
        resolve([]);
      }, 5000);
    });
  }

  // ===== 刷新数据 =====
  function refresh() {
    return {
      posts: getPosts(),
      detail: getPostDetail(),
      comments: getComments(),
      timestamp: new Date().toISOString()
    };
  }

  // ===== 获取原始数据 =====
  function getRawData() {
    return {
      posts: getPosts().map(p => ({...p, element: undefined})),
      detail: getPostDetail(),
      comments: getComments().map(c => ({...c, element: undefined})),
      url: location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    };
  }

  // ===== 暴露全局 API =====
  window.TreeholeAPI = {
    getPosts,
    getPostDetail,
    getComments,
    search,
    refresh,
    getRawData,
    version: '1.0.0'
  };

  console.log('[Treehole Parser] v1.0.0 loaded');
  console.log('[Treehole Parser] API: TreeholeAPI.getPosts() / getPostDetail() / getComments() / search(keyword) / refresh() / getRawData()');
})();
