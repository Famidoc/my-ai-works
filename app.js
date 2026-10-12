// ==========================================
// 1. 全域變數與系統設定
// ==========================================
// 💡 您部署的 GAS Web App 網址
const GAS_URL = "https://script.google.com/macros/s/AKfycbxAt2_Sp1QsY-ajrnSA0_uyWXaYG2gdN2fJO55ktGbexB60Suj_RA9Q4V1Qj0Iih279FA/exec";

// 從網址列抓取深層連結 ID 與目前的網址
const urlParams = new URLSearchParams(window.location.search);
let requestedId = urlParams.get('id') || "";
let appUrl = window.location.href.split('?')[0]; 

let allData = [];
let currentList = []; 
let currentIndex = 0; 
let currentType = 'image'; 
let currentKeyword = '';
let currentRenderedCount = 0;
const CHUNK_SIZE = 12; 
let observer = null;
let sentinel = null;
let currentComments = [];
let renderedCommentCount = 0;
const COMMENT_CHUNK_SIZE = 5;

// 小說專用全域變數
let currentNovel = null;
let currentChapterIndex = 1;
let currentReaderTheme = 'reader-theme-dark';
let currentReaderFontSize = 1.15;

const getModalImageSize = () => window.innerWidth < 768 ? 'w800' : 'w1200';

// ==========================================
// 2. SVG 視覺圖示常數 (完整版)
// ==========================================
const eyeIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
const heartFilledSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
const heartOutlineSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
const commentIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
const eyeIconModal = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 6px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
const heartModalSvg = (isFilled) => `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${isFilled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 8px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
const shareIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 8px;"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>';
const commentIconModal = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 6px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

// ==========================================
// 3. 安全網路請求與系統初始化
// ==========================================
/**
 * 安全的 JSON 請求封裝
 * 1. 支援逾時中斷 (AbortController)
 * 2. 攔截 Google 伺服器回傳的 HTML 錯誤頁（<!DOCTYPE 或 <html 開頭）
 * 3. 遇到暫時性錯誤時自動重試 (Auto-Retry)
 */
async function safeFetchJson(url, options = {}, retries = 2, delayMs = 1500, timeoutMs = 15000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      const res = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      const rawText = await res.text();
      const trimmed = rawText.trim();
      
      // 檢查是否為 HTML 錯誤頁 (Google 伺服器維護/逾時/配額限制通常回傳 HTML)
      if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<head')) {
        throw new Error('Google 伺服器暫時忙碌或回傳錯誤頁面 (HTML)');
      }
      
      let json;
      try {
        json = JSON.parse(rawText);
      } catch (e) {
        throw new Error('資料格式解析失敗: ' + e.message);
      }
      
      return json;
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      const isLastAttempt = attempt === retries;
      
      console.warn(`[API] 請求失敗 (第 ${attempt + 1} 次):`, isAbort ? '連線逾時' : err.message);
      
      if (isLastAttempt) {
        if (isAbort) {
          throw new Error('連線逾時 (Google 伺服器回應過慢，請稍後重試)');
        }
        throw err;
      }
      
      // 等待後重試
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

window.onload = function() { 
  window.onscroll = function() {
    const btn = document.getElementById('backToTop');
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) { btn.classList.add('show'); } 
    else { btn.classList.remove('show'); }
  };
  loadData();
  checkSubscribeIntent();
  window.addEventListener('hashchange', checkSubscribeIntent);
};

function loadData() {
  const loader = document.getElementById('loader');
  
  // 🚀 三層載入策略：localStorage → data.json → GAS API
  // 第 1 層：嘗試從 localStorage 讀取快取（回訪使用者秒開）
  const cached = localStorage.getItem('portfolio_cache');
  let hasCachedData = false;
  
  if (cached) {
    try {
      const cachedData = JSON.parse(cached);
      if (Array.isArray(cachedData) && cachedData.length > 0) {
        initData(cachedData);   // ⚡ 秒開！先顯示上次的資料
        hasCachedData = true;
      }
    } catch(e) {
      localStorage.removeItem('portfolio_cache');
    }
  }
  
  // 第 2 層：新使用者沒有 localStorage → 從同源 data.json 快速載入
  if (!hasCachedData) {
    loader.style.display = 'block';
    loader.innerHTML = 'SYSTEM INITIALIZING... 系統讀取中...';
    
    fetch('./data.json')
      .then(res => {
        if (!res.ok) throw new Error('data.json not found');
        return res.json();
      })
      .then(staticData => {
        if (Array.isArray(staticData) && staticData.length > 0) {
          initData(staticData);   // ⚡ 新使用者也秒開！
          hasCachedData = true;
          // 同時寫入 localStorage，下次直接從第 1 層讀取
          try {
            localStorage.setItem('portfolio_cache', JSON.stringify(staticData));
          } catch(e) { /* ignore */ }
        }
      })
      .catch(err => {
        console.warn('[Loader] data.json 載入失敗，等待 GAS API:', err.message);
      });
  }
  
  // 第 3 層：背景向 GAS API 請求最新資料（確保資料是最新的）
  safeFetchJson(`${GAS_URL}?action=getPortfolio`, {}, 2, 1500, 15000)
    .then(json => {
      if (json.status === 'success') {
        try {
          localStorage.setItem('portfolio_cache', JSON.stringify(json.data));
        } catch(e) {
          console.warn('[Cache] localStorage 寫入失敗:', e.message);
        }
        initData(json.data);   // 用最新資料更新畫面
      } else if (!hasCachedData) {
        showError(json.message || '資料庫回傳狀態異常');
      }
    })
    .catch(err => {
      if (!hasCachedData) {
        showError(err.message || err);
      } else {
        console.warn('[API] 背景更新失敗，使用快取資料:', err.message || err);
      }
    });
}

function showError(err) {
  const loader = document.getElementById('loader');
  loader.style.display = 'block';
  loader.innerHTML = `
    <div style="color: var(--neon-pink); line-height: 1.6; padding: 20px 10px;">
      <p style="font-weight: bold; font-size: 1.1rem; margin-bottom: 8px;">⚠️ 資料讀取失敗</p>
      <p style="font-size: 0.95rem; color: #ccc; margin-bottom: 14px;">${err}</p>
      <button onclick="loadData()" style="padding: 8px 20px; background: rgba(0, 243, 255, 0.1); border: 1px solid var(--neon-blue); color: var(--neon-blue); cursor: pointer; border-radius: 4px; font-family: inherit; font-size: 0.95rem; transition: all 0.3s ease;">
        🔄 重新嘗試連線
      </button>
    </div>
  `;
}

// ==========================================
// 4. 畫面渲染與 UI 邏輯
// ==========================================
function initData(data) {
  document.getElementById('loader').style.display = 'none';
  allData = data;
  setupObserver();     
  if (requestedId && requestedId !== "") {
    const targetItem = allData.find(x => String(x.id) === String(requestedId));
    if (targetItem) {
      const typeStr = targetItem.type.toLowerCase();
      if (typeStr === 'novel') {
        switchTab('novels');
        const chParam = urlParams.get('ch');
        setTimeout(() => openNovelModal(targetItem, chParam ? parseInt(chParam) : null), 500);
        return;
      }
      switchTab(typeStr === 'apps' ? 'apps' : typeStr + 's');
      setTimeout(() => openModal(targetItem), 500);
      return; 
    }
  }
  switchTab('images'); 
}

function setupObserver() {
  const options = { root: null, rootMargin: '100px', threshold: 0.1 };
  observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) { loadMoreItems(); } }, options);
  sentinel = document.createElement('div'); sentinel.id = 'scroll-sentinel'; sentinel.style.height = '20px';
  sentinel.innerHTML = '<div style="text-align:center; color: var(--neon-dark);">LOADING MORE...</div>';
}

function updateGallery() {
  currentList = allData.filter(item => {
    const matchType = item.type.toLowerCase() === currentType;
    const content = (item.title + item.desc + item.tag).toLowerCase();
    const matchKeyword = currentKeyword === '' || content.includes(currentKeyword);
    return matchType && matchKeyword;
  });
  const sortBy = document.getElementById('sortSelect').value;
  currentList.sort((a, b) => {
    if (sortBy === 'popular') return (b.viewCount || 0) - (a.viewCount || 0);
    if (sortBy === 'liked') return (b.likes || 0) - (a.likes || 0);
    return 0; 
  });
  const containerId = 'gallery-' + (currentType === 'apps' ? 'apps' : (currentType === 'novel' ? 'novels' : currentType + 's'));
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
    currentRenderedCount = 0;
    loadMoreItems();
  }
}

function loadMoreItems() {
  const containerId = 'gallery-' + (currentType === 'apps' ? 'apps' : (currentType === 'novel' ? 'novels' : currentType + 's'));
  const container = document.getElementById(containerId);
  if (!container) return;
  if (sentinel.parentNode) { sentinel.parentNode.removeChild(sentinel); }
  const nextBatch = currentList.slice(currentRenderedCount, currentRenderedCount + CHUNK_SIZE);
  nextBatch.forEach(item => container.appendChild(createCard(item)));
  currentRenderedCount += nextBatch.length;
  if (currentRenderedCount < currentList.length) { container.appendChild(sentinel); observer.observe(sentinel); }
}

function createCard(item) {
  const div = document.createElement('div'); div.className = 'card';
  let realId = item.id.includes('@') ? item.id.split('@')[0] : item.id;
  let thumbUrl = (item.type.toLowerCase() === 'video') ? 
    'https://img.youtube.com/vi/' + realId + '/hqdefault.jpg' : 
    'https://drive.google.com/thumbnail?id=' + realId + '&sz=w400';
  
  const isNovel = item.type.toLowerCase() === 'novel';
  const badgeHtml = isNovel ? '<div class="novel-card-badge">📖 連載小說</div>' : '';

  div.innerHTML = `
    ${badgeHtml}
    <div class="thumb-wrapper"><img src="${thumbUrl}" loading="lazy"></div>
    <div class="info">
      <div class="card-meta">
        <h3>${item.title}</h3>
        <div class="card-meta-stats">
          <span class="view-count">${eyeIconSvg}${item.viewCount || 0}</span>
          <span class="like-count">${(localStorage.getItem('liked_'+item.id) === 'true' ? heartFilledSvg : heartOutlineSvg)}${item.likes || 0}</span>
          <span class="cmt-count">${commentIconSvg}${item.commentCount || 0}</span>
        </div>
      </div>
    </div>`;
  
  if (isNovel) {
    div.onclick = () => openNovelModal(item);
  } else {
    div.onclick = () => openModal(item);
  }
  return div;
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const btns = document.querySelectorAll('.tab-btn');
  if(tabName === 'images' && btns[0]) { btns[0].classList.add('active'); currentType = 'image'; }
  else if(tabName === 'videos' && btns[1]) { btns[1].classList.add('active'); currentType = 'video'; }
  else if(tabName === 'comics' && btns[2]) { btns[2].classList.add('active'); currentType = 'comic'; }
  else if(tabName === 'apps' && btns[3]) { btns[3].classList.add('active'); currentType = 'apps'; }
  else if(tabName === 'novels' && btns[4]) { btns[4].classList.add('active'); currentType = 'novel'; }
  
  document.querySelectorAll('.gallery-section').forEach(sec => sec.classList.remove('active'));
  const activeSec = document.getElementById('gallery-' + tabName);
  if (activeSec) activeSec.classList.add('active');
  updateGallery();
}

// ==========================================
// 5. 燈箱 (Modal) 與互動功能
// ==========================================
function openModal(item) {
  currentIndex = currentList.findIndex(x => String(x.id) === String(item.id));
  item.viewCount = (item.viewCount || 0) + 1;
  
  // 背景更新點閱率
  fetch(`${GAS_URL}?action=updateViewCount&resourceId=${item.id}`).catch(e => console.log(e));
  
  renderModalContent();
  document.getElementById('modal').style.display = 'block'; 
  document.body.style.overflow = 'hidden';
}

function renderModalContent() {
  const item = currentList[currentIndex] || currentList[0];
  if (!item) return;
  const container = document.getElementById('modal-media-container');
  const title = document.getElementById('modal-title');
  const desc = document.getElementById('modal-desc');
  const tag = document.getElementById('modal-tag');
  const actionsContainer = document.getElementById('modal-actions');
  
  title.innerHTML = `
    ${item.title} 
    <span style="font-size: 1.1rem; color: var(--neon-blue); margin-left: 15px;">${eyeIconModal}${item.viewCount || 0}</span>
    <span id="modal-cmt-count" style="font-size: 1.1rem; color: var(--neon-yellow); margin-left: 15px;">${commentIconModal}${item.commentCount || 0}</span>`;
  
  tag.innerText = item.tag || (item.type.toUpperCase() + ' WORK');
  container.innerHTML = ''; desc.innerHTML = ''; actionsContainer.innerHTML = ''; 

  let realId = item.id.includes('@') ? item.id.split('@')[0] : item.id;
  if (item.type.toLowerCase() === 'video') {
    container.innerHTML = `<iframe src="https://www.youtube.com/embed/${realId}?autoplay=1" allowfullscreen></iframe>`;
    desc.innerText = item.desc || "";
  } else {
    container.innerHTML = `<img src="https://drive.google.com/thumbnail?id=${realId}&sz=${getModalImageSize()}">`;
    if (item.type.toLowerCase() === 'apps' && item.desc && item.desc.trim() !== "") {
      const docBtn = document.createElement('a'); 
      docBtn.href = item.desc; 
      docBtn.target = "_blank"; 
      docBtn.className = "doc-btn"; 
      docBtn.innerText = "閱讀安裝及使用說明";
      actionsContainer.appendChild(docBtn); 
      desc.innerText = ""; 
    } else {
      desc.innerText = item.desc || "";
    }
  }

  const likeBtn = document.createElement('button');
  likeBtn.className = 'modal-like-btn' + (localStorage.getItem('liked_'+item.id) === 'true' ? ' liked' : '');
  likeBtn.innerHTML = heartModalSvg(localStorage.getItem('liked_'+item.id) === 'true') + ' LIKE (' + (item.likes || 0) + ')';
  if (localStorage.getItem('liked_'+item.id) !== 'true') {
    likeBtn.onclick = () => handleLike(item.id);
  }
  actionsContainer.appendChild(likeBtn);

  const shareBtn = document.createElement('button');
  shareBtn.className = 'share-btn'; shareBtn.innerHTML = shareIconSvg + 'SHARE';
  shareBtn.onclick = function() {
    const fullUrl = appUrl + "?id=" + encodeURIComponent(item.id);
    copyToClipboardSafe(fullUrl).then(() => {
      shareBtn.innerHTML = '✅ COPIED!';
      setTimeout(() => { shareBtn.innerHTML = shareIconSvg + 'SHARE'; }, 2000);
    });
  };
  actionsContainer.appendChild(shareBtn);

  fetchComments(item.id);
}

function handleLike(itemId) {
  if (localStorage.getItem('liked_' + itemId) === 'true') return;
  localStorage.setItem('liked_' + itemId, 'true');
  const item = allData.find(x => String(x.id) === String(itemId));
  if (item) {
    item.likes = (item.likes || 0) + 1;
    renderModalContent();
    fetch(`${GAS_URL}?action=addLike&resourceId=${itemId}`).catch(e => console.log(e));
  }
}

// ==========================================
// 6. 留言與訂閱功能 (Fetch API)
// ==========================================
function fetchComments(resourceId) {
  document.getElementById('comments-list').innerHTML = '讀取留言中...';
  safeFetchJson(`${GAS_URL}?action=getComments&resourceId=${resourceId}`, {}, 1, 1200)
    .then(json => {
      if(json.status === 'success') {
        currentComments = (json.data || []).reverse();
        renderedCommentCount = 0;
        document.getElementById('comments-list').innerHTML = '';
        if (currentComments.length === 0) {
          document.getElementById('comments-list').innerHTML = '尚無留言。';
        } else {
          renderComments();
        }
      } else {
        document.getElementById('comments-list').innerHTML = '讀取留言失敗。';
      }
    })
    .catch(() => {
      document.getElementById('comments-list').innerHTML = '讀取留言失敗（伺服器忙碌），請稍候重試。';
    });
}

function renderComments() {
  const list = document.getElementById('comments-list');
  const oldBtn = document.getElementById('load-more-btn');
  if (oldBtn) oldBtn.remove();
  
  const batch = currentComments.slice(renderedCommentCount, renderedCommentCount + COMMENT_CHUNK_SIZE);
  batch.forEach(cmt => {
    const div = document.createElement('div'); div.className = 'comment-card';
    let replyHtml = '';
    if (cmt.adminReply) {
      replyHtml = '<div class="admin-reply"><div class="admin-reply-header"><span>⤷ ADMIN REPLY // 站長回覆</span></div><div class="admin-reply-body">' + cmt.adminReply + '</div></div>';
    }
    div.innerHTML = '<div class="comment-header"><span class="comment-nick">' + cmt.nickname + '</span><span class="comment-time">' + cmt.timestamp + '</span></div><div class="comment-body">' + cmt.content + '</div>' + replyHtml;
    list.appendChild(div);
  });
  
  renderedCommentCount += batch.length;
  
  if (renderedCommentCount < currentComments.length) {
    const moreBtn = document.createElement('div');
    moreBtn.id = 'load-more-btn';
    moreBtn.className = 'load-more-comments';
    moreBtn.innerText = 'LOAD MORE LOGS / 載入更多留言';
    moreBtn.onclick = renderComments;
    list.appendChild(moreBtn);
  }
}

function submitComment() {
  const item = currentList[currentIndex];
  if (!item) return;
  const nickInput = document.getElementById('comment-nick');
  const contentInput = document.getElementById('comment-content');
  const submitBtn = document.getElementById('comment-submit');
  const nick = nickInput.value.trim() || "匿名訪客";
  const content = contentInput.value.trim();

  if (!content) { alert("請輸入留言內容"); return; }

  submitBtn.disabled = true;
  submitBtn.innerText = 'WAIT...';

  const payload = { action: 'addComment', resourceId: item.id, nickname: nick, content: content };

  safeFetchJson(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }, 1, 1500)
  .then(json => {
    submitBtn.disabled = false;
    submitBtn.innerText = 'TRANSMIT / 傳送';
    if (json.status === 'success' && json.data.success) {
      contentInput.value = '';
      fetchComments(item.id); 
      item.commentCount = (item.commentCount || 0) + 1;
      renderModalContent(); 
    } else {
      alert("傳送失敗: " + (json.message || "請稍候重試"));
    }
  })
  .catch(err => {
    submitBtn.disabled = false;
    submitBtn.innerText = 'TRANSMIT / 傳送';
    alert("連線忙碌中，請稍候再試 (" + (err.message || err) + ")");
  });
}

function subscribeNewsletter() {
  const emailInput = document.getElementById('sub-email');
  const btn = document.getElementById('sub-btn');
  const msg = document.getElementById('sub-msg');
  const email = emailInput.value.trim();

  if (!email || !email.includes('@')) {
    msg.style.color = 'var(--neon-pink)';
    msg.innerText = ">> PLEASE ENTER A VALID EMAIL";
    return;
  }

  btn.disabled = true;
  btn.innerText = 'WAIT...';
  msg.style.color = 'var(--neon-blue)';
  msg.innerText = ">> TRANSMITTING...";

  const payload = { action: 'addSubscriber', email: email };

  safeFetchJson(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }, 1, 1500)
  .then(json => {
    btn.disabled = false;
    btn.innerText = 'SUBSCRIBE';
    if (json.status === 'success' && json.data.success) {
      msg.style.color = '#fff';
      msg.innerText = ">> " + json.data.message;
      emailInput.value = '';
    } else {
      msg.style.color = 'var(--neon-pink)';
      msg.innerText = ">> " + (json.data.message || 'Error');
    }
    setTimeout(() => { msg.innerText = ""; }, 5000);
  })
  .catch(err => {
    btn.disabled = false;
    btn.innerText = 'SUBSCRIBE';
    msg.style.color = 'var(--neon-pink)';
    msg.innerText = ">> 連線逾時或伺服器忙碌，請稍候重試";
  });
}

// 支援社群直接訂閱連結 (#subscribe 或 ?subscribe=true 或 ?action=subscribe)
function checkSubscribeIntent() {
  const hash = (window.location.hash || "").toLowerCase();
  const currentParams = new URLSearchParams(window.location.search);
  const isSubscribe = hash === '#subscribe' || 
                      currentParams.get('subscribe') === 'true' || 
                      currentParams.get('action') === 'subscribe';
  if (isSubscribe) {
    setTimeout(() => {
      const emailInput = document.getElementById('sub-email');
      const msg = document.getElementById('sub-msg');
      if (emailInput) {
        emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emailInput.focus();
        emailInput.classList.add('sub-highlight');
        if (msg) {
          msg.style.color = 'var(--neon-blue)';
          msg.innerText = ">> 歡迎訂閱！請在此輸入 Email 接收最新作品通知";
        }
        setTimeout(() => {
          emailInput.classList.remove('sub-highlight');
        }, 3500);
      }
    }, 600);
  }
}

// ==========================================
// 7. 輔助功能
// ==========================================
function copyToClipboardSafe(text) {
  if (navigator.clipboard) { return navigator.clipboard.writeText(text); } 
  const textArea = document.createElement("textarea"); textArea.value = text;
  document.body.appendChild(textArea); textArea.select();
  document.execCommand('copy'); document.body.removeChild(textArea);
  return Promise.resolve();
}

function changeSlide(n) {
  currentIndex = (currentIndex + n + currentList.length) % currentList.length;
  openModal(currentList[currentIndex]);
}

function closeModalDirect() { document.getElementById('modal').style.display = 'none'; document.body.style.overflow = ''; }
function closeModal(e) { if (e.target.id === 'modal') closeModalDirect(); }
function filterData() { currentKeyword = document.getElementById('searchInput').value.toLowerCase(); updateGallery(); }

// ==========================================
// 8. 小說專屬閱讀燈箱 (Novel Reader Modal)
// ==========================================
function openNovelModal(item, targetChapterIndex = null) {
  currentNovel = item;
  
  // 更新點閱率
  currentNovel.viewCount = (currentNovel.viewCount || 0) + 1;
  fetch(`${GAS_URL}?action=updateViewCount&resourceId=${item.id}`).catch(e => console.log(e));
  
  document.getElementById('novel-toolbar-title').innerText = item.title;
  
  let realId = item.id.includes('@') ? item.id.split('@')[0] : item.id;
  document.getElementById('novel-cover-img').src = `https://drive.google.com/thumbnail?id=${realId}&sz=${getModalImageSize()}`;
  document.getElementById('novel-overview-title').innerText = item.title;
  document.getElementById('novel-overview-tag').innerText = item.tag || '#連載小說';
  
  // 故事簡介與防劇透處理
  const descText = item.desc || "暫無簡介";
  const descEl = document.getElementById('novel-overview-desc');
  const spoilerNotice = document.getElementById('novel-spoiler-notice');
  const toggleBtn = document.getElementById('novel-desc-toggle-btn');
  
  descEl.innerText = descText;
  descEl.classList.remove('expanded');
  
  // 若簡介超過 160 字或含有企劃、大綱、反轉、設定等關鍵字，自動顯示防雷警示並折疊
  const isDetailedOrSpoiler = descText.length > 160 || /大綱|設定|反轉|劇透|企劃|Logline/i.test(descText);
  if (isDetailedOrSpoiler) {
    if (spoilerNotice) spoilerNotice.style.display = 'flex';
    if (toggleBtn) {
      toggleBtn.style.display = 'inline-flex';
      toggleBtn.innerText = '展開完整設定大綱 ▾';
    }
  } else {
    if (spoilerNotice) spoilerNotice.style.display = 'none';
    if (toggleBtn) toggleBtn.style.display = 'none';
    descEl.classList.add('expanded');
  }
  
  document.getElementById('novel-overview-views').innerHTML = `${eyeIconSvg} 閱讀 ${item.viewCount || 0}`;
  document.getElementById('novel-overview-likes').innerHTML = `${heartFilledSvg} 按讚 ${item.likes || 0}`;
  
  const chapters = item.chapters || [];
  document.getElementById('novel-overview-chapters-count').innerHTML = `📑 共 ${chapters.length} 章`;
  
  // 建立章節下拉選單與 TOC 目錄列表
  populateChapterSelectAndTOC(chapters);
  
  // 若有指定章節，直接進入該章閱讀；否則先顯示目錄概覽
  if (targetChapterIndex && chapters.some(c => c.index === targetChapterIndex)) {
    loadChapter(targetChapterIndex);
  } else {
    showNovelOverview();
  }
  
  document.getElementById('novel-modal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function getCleanChapterTitle(index, rawTitle) {
  if (!rawTitle) return `第 ${index} 章`;
  let trimmed = String(rawTitle).trim();
  // 移除重複的「第 X 章」或「第 X 講/回/節」或數字前綴
  const chMatch = trimmed.match(/^第\s*\d+\s*[章講回節集話][:：\s]*(.*)$/i);
  if (chMatch) {
    const subTitle = chMatch[1].trim();
    return subTitle ? `第 ${index} 章：${subTitle}` : `第 ${index} 章`;
  }
  const numMatch = trimmed.match(/^\d+[_.\s]+(.*)$/);
  if (numMatch) {
    const subTitle = numMatch[1].trim();
    return subTitle ? `第 ${index} 章：${subTitle}` : `第 ${index} 章`;
  }
  return `第 ${index} 章：${trimmed}`;
}

function populateChapterSelectAndTOC(chapters) {
  const select = document.getElementById('novel-chapter-select');
  const tocList = document.getElementById('novel-toc-list');
  select.innerHTML = '<option value="0">📑 書籍概覽與目錄</option>';
  tocList.innerHTML = '';
  
  if (chapters.length === 0) {
    tocList.innerHTML = '<div style="color: #888; grid-column: 1 / -1; text-align: center; padding: 20px;">作者目前正準備上架各章節，敬請期待！</div>';
    return;
  }

  chapters.forEach(ch => {
    const cleanTitle = getCleanChapterTitle(ch.index, ch.title);
    
    // 下拉選單 option
    const opt = document.createElement('option');
    opt.value = ch.index;
    opt.text = ch.isUnlocked ? 
      cleanTitle : 
      `${cleanTitle} 🔒 (${ch.publishDate ? ch.publishDate.substring(5) : '即將解鎖'})`;
    select.appendChild(opt);
    
    // TOC 卡片
    const tocItem = document.createElement('div');
    tocItem.className = 'novel-toc-item' + (ch.isUnlocked ? '' : ' locked');
    tocItem.innerHTML = `
      <div class="toc-item-title">${escapeHtml(cleanTitle)}</div>
      <span class="toc-item-badge ${ch.isUnlocked ? 'toc-badge-unlocked' : 'toc-badge-locked'}">
        ${ch.isUnlocked ? '閱讀' : ('🔒 ' + (ch.publishDate ? ch.publishDate.substring(5) : '鎖定'))}
      </span>
    `;
    tocItem.onclick = () => loadChapter(ch.index);
    tocList.appendChild(tocItem);
  });
}

function toggleNovelDesc() {
  const descEl = document.getElementById('novel-overview-desc');
  const toggleBtn = document.getElementById('novel-desc-toggle-btn');
  if (!descEl) return;
  const isExpanded = descEl.classList.toggle('expanded');
  if (toggleBtn) {
    toggleBtn.innerText = isExpanded ? '收合大綱 ▴' : '展開完整設定大綱 ▾';
  }
}

function showNovelOverview() {
  document.getElementById('novel-overview-section').style.display = 'block';
  document.getElementById('novel-reading-section').style.display = 'none';
  document.getElementById('novel-chapter-select').value = "0";
}

function startReadingLatest() {
  if (!currentNovel || !currentNovel.chapters || currentNovel.chapters.length === 0) return;
  // 找到最後一個已解鎖的章節，或者第 1 章
  const unlocked = currentNovel.chapters.filter(c => c.isUnlocked);
  const target = unlocked.length > 0 ? unlocked[unlocked.length - 1] : currentNovel.chapters[0];
  loadChapter(target.index);
}

function onChapterSelectChange(val) {
  const idx = parseInt(val);
  if (idx === 0) {
    showNovelOverview();
  } else {
    loadChapter(idx);
  }
}

function loadChapter(chapterIndex) {
  if (!currentNovel || !currentNovel.chapters) return;
  const chapter = currentNovel.chapters.find(c => c.index === chapterIndex);
  if (!chapter) return;
  
  currentChapterIndex = chapterIndex;
  document.getElementById('novel-chapter-select').value = String(chapterIndex);
  
  document.getElementById('novel-overview-section').style.display = 'none';
  document.getElementById('novel-reading-section').style.display = 'block';
  
  // 滾動回頂部
  document.getElementById('novel-modal').scrollTo({ top: 0, behavior: 'smooth' });
  
  document.getElementById('chapter-num').innerText = `CHAPTER // ${chapter.index}`;
  document.getElementById('chapter-date').innerText = chapter.publishDate ? `發布日期：${chapter.publishDate}` : '';
  document.getElementById('chapter-title').innerText = getCleanChapterTitle(chapter.index, chapter.title);
  
  const contentBox = document.getElementById('chapter-content-box');
  
  if (chapter.isUnlocked) {
    // 渲染段落
    const paragraphs = (chapter.content || "").split(/\n+/).filter(p => p.trim() !== "");
    if (paragraphs.length > 0) {
      contentBox.innerHTML = paragraphs.map(p => `<p>${escapeHtml(p.trim())}</p>`).join('');
    } else {
      contentBox.innerHTML = '<p style="text-align:center; color: #888;">（本章暫無內文）</p>';
    }
  } else {
    // 鎖定卡片
    contentBox.innerHTML = `
      <div class="chapter-locked-card">
        <div class="locked-card-icon">🔒</div>
        <div class="locked-card-title">本章連載中 · 尚未開放</div>
        <div class="locked-card-date">預計解鎖日期：${chapter.publishDate || '即將上線'}</div>
        <div class="locked-card-tip">
          作者 Famidoc 正在全力以赴創作中！<br>
          親友們歡迎在下方提前留言預測劇情或催更～
        </div>
      </div>
    `;
  }
  
  // 更新導覽按鍵 (上一章 / 下一章)
  const prevBtn = document.getElementById('btn-prev-chapter');
  const nextBtn = document.getElementById('btn-next-chapter');
  
  prevBtn.disabled = (chapterIndex <= 1);
  nextBtn.disabled = (chapterIndex >= currentNovel.chapters.length);
  
  // 更新按讚按鈕
  renderChapterLikeBtn(chapter);
  
  // 更新分享按鈕
  const shareBtn = document.getElementById('chapter-share-btn');
  shareBtn.innerHTML = shareIconSvg + 'SHARE CHAPTER';
  
  // 載入本章專屬留言
  fetchChapterComments(chapter.id);
  
  // 背景更新章節點閱率
  fetch(`${GAS_URL}?action=updateViewCount&resourceId=${chapter.id}`).catch(e => console.log(e));
}

function navigateChapter(delta) {
  loadChapter(currentChapterIndex + delta);
}

function renderChapterLikeBtn(chapter) {
  const likeBtn = document.getElementById('chapter-like-btn');
  const isLiked = localStorage.getItem('liked_' + chapter.id) === 'true';
  likeBtn.className = 'modal-like-btn' + (isLiked ? ' liked' : '');
  likeBtn.innerHTML = heartModalSvg(isLiked) + ' LIKE (' + (chapter.likes || 0) + ')';
}

function handleChapterLike() {
  if (!currentNovel || !currentNovel.chapters) return;
  const chapter = currentNovel.chapters.find(c => c.index === currentChapterIndex);
  if (!chapter) return;
  if (localStorage.getItem('liked_' + chapter.id) === 'true') return;
  
  localStorage.setItem('liked_' + chapter.id, 'true');
  chapter.likes = (chapter.likes || 0) + 1;
  currentNovel.likes = (currentNovel.likes || 0) + 1;
  
  renderChapterLikeBtn(chapter);
  document.getElementById('novel-overview-likes').innerHTML = `${heartFilledSvg} 按讚 ${currentNovel.likes}`;
  fetch(`${GAS_URL}?action=addLike&resourceId=${chapter.id}`).catch(e => console.log(e));
}

function handleChapterShare() {
  if (!currentNovel) return;
  const shareBtn = document.getElementById('chapter-share-btn');
  const fullUrl = `${appUrl}?id=${encodeURIComponent(currentNovel.id)}&ch=${currentChapterIndex}`;
  copyToClipboardSafe(fullUrl).then(() => {
    shareBtn.innerHTML = '✅ COPIED CHAPTER LINK!';
    setTimeout(() => { shareBtn.innerHTML = shareIconSvg + 'SHARE CHAPTER'; }, 2000);
  });
}

// 閱讀主題與字級控制
function cycleReaderTheme() {
  const themes = ['reader-theme-dark', 'reader-theme-sepia', 'reader-theme-light'];
  const icons = { 'reader-theme-dark': '🌙', 'reader-theme-sepia': '📜', 'reader-theme-light': '☀️' };
  let currentIdx = themes.indexOf(currentReaderTheme);
  currentReaderTheme = themes[(currentIdx + 1) % themes.length];
  
  const contentBox = document.getElementById('chapter-content-box');
  const section = document.getElementById('novel-reading-section');
  
  themes.forEach(t => {
    contentBox.classList.remove(t);
    section.classList.remove(t);
  });
  contentBox.classList.add(currentReaderTheme);
  section.classList.add(currentReaderTheme);
  
  document.getElementById('reader-theme-btn').innerText = icons[currentReaderTheme];
}

function adjustFontSize(delta) {
  currentReaderFontSize = Math.max(0.95, Math.min(1.6, currentReaderFontSize + delta * 0.1));
  document.getElementById('chapter-content-box').style.setProperty('--novel-font-size', `${currentReaderFontSize}rem`);
}

function closeNovelModal(event) {
  if (event.target === document.getElementById('novel-modal')) {
    closeNovelModalDirect();
  }
}

function closeNovelModalDirect() {
  document.getElementById('novel-modal').style.display = 'none';
  document.body.style.overflow = '';
}

// 章節留言功能
function fetchChapterComments(chapterId) {
  const listEl = document.getElementById('chapter-comments-list');
  listEl.innerHTML = '<div class="comments-status">讀取本章留言中...</div>';
  safeFetchJson(`${GAS_URL}?action=getComments&resourceId=${chapterId}`, {}, 1, 1200)
    .then(data => {
      const comments = Array.isArray(data) ? data : (data.data || []);
      renderChapterComments(comments);
    })
    .catch(() => {
      listEl.innerHTML = '<div class="comments-status">暫無留言，歡迎搶頭香！</div>';
    });
}

function renderChapterComments(comments) {
  const listEl = document.getElementById('chapter-comments-list');
  listEl.innerHTML = '';
  if (!comments || comments.length === 0) {
    listEl.innerHTML = '<div class="comments-status">目前尚無留言，歡迎發表您對本章的想法！</div>';
    return;
  }
  comments.forEach(c => {
    const div = document.createElement('div');
    div.className = 'comment-card';
    let adminReplyHtml = '';
    if (c.adminReply && c.adminReply.trim() !== '') {
      adminReplyHtml = `
        <div class="admin-reply">
          <div class="admin-reply-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            站長回覆 // FAMIDOC CHANG
          </div>
          <div class="admin-reply-body">${escapeHtml(c.adminReply)}</div>
        </div>`;
    }
    div.innerHTML = `
      <div class="comment-header">
        <span class="comment-nick">${escapeHtml(c.nickname)}</span>
        <span class="comment-time">${escapeHtml(c.timestamp)}</span>
      </div>
      <div class="comment-body">${escapeHtml(c.content)}</div>
      ${adminReplyHtml}
    `;
    listEl.appendChild(div);
  });
}

function submitChapterComment() {
  if (!currentNovel || !currentNovel.chapters) return;
  const chapter = currentNovel.chapters.find(c => c.index === currentChapterIndex);
  if (!chapter) return;
  
  const nickInput = document.getElementById('chapter-comment-nick');
  const contentInput = document.getElementById('chapter-comment-content');
  const submitBtn = document.getElementById('chapter-comment-submit');
  
  const nick = nickInput.value.trim() || '匿名親友';
  const content = contentInput.value.trim();
  if (!content) { alert('請輸入留言內容！'); return; }
  
  submitBtn.disabled = true;
  submitBtn.innerText = 'TRANSMITTING...';
  
  fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'addComment', resourceId: chapter.id, nickname: nick, content: content })
  }).then(() => {
    contentInput.value = '';
    submitBtn.disabled = false;
    submitBtn.innerText = 'TRANSMIT / 傳送';
    chapter.commentCount = (chapter.commentCount || 0) + 1;
    setTimeout(() => fetchChapterComments(chapter.id), 1200);
  }).catch(() => {
    submitBtn.disabled = false;
    submitBtn.innerText = 'TRANSMIT / 傳送';
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}