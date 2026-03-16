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
// 3. 系統初始化
// ==========================================
window.onload = function() { 
  window.onscroll = function() {
    const btn = document.getElementById('backToTop');
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) { btn.classList.add('show'); } 
    else { btn.classList.remove('show'); }
  };
  loadData();
};

function loadData() {
  const loader = document.getElementById('loader');
  loader.style.display = 'block';
  loader.innerHTML = 'SYSTEM INITIALIZING... 系統讀取中...';
  
  fetch(`${GAS_URL}?action=getPortfolio`)
    .then(res => res.json())
    .then(json => {
      if(json.status === 'success') {
        initData(json.data);
      } else {
        showError(json.message);
      }
    })
    .catch(err => showError(err));
}

function showError(err) {
  document.getElementById('loader').style.display = 'none';
  alert('資料讀取失敗，請重新整理頁面。錯誤代碼: ' + err);
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
      switchTab(targetItem.type.toLowerCase() === 'apps' ? 'apps' : targetItem.type.toLowerCase() + 's');
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
  const containerId = 'gallery-' + (currentType === 'apps' ? 'apps' : currentType + 's');
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  currentRenderedCount = 0;
  loadMoreItems();
}

function loadMoreItems() {
  const containerId = 'gallery-' + (currentType === 'apps' ? 'apps' : currentType + 's');
  const container = document.getElementById(containerId);
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
  
  div.innerHTML = `
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
  div.onclick = () => openModal(item);
  return div;
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const btns = document.querySelectorAll('.tab-btn');
  if(tabName === 'images') { btns[0].classList.add('active'); currentType = 'image'; }
  else if(tabName === 'videos') { btns[1].classList.add('active'); currentType = 'video'; }
  else if(tabName === 'comics') { btns[2].classList.add('active'); currentType = 'comic'; }
  else if(tabName === 'apps') { btns[3].classList.add('active'); currentType = 'apps'; }
  document.querySelectorAll('.gallery-section').forEach(sec => sec.classList.remove('active'));
  document.getElementById('gallery-' + tabName).classList.add('active');
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
  fetch(`${GAS_URL}?action=getComments&resourceId=${resourceId}`)
    .then(res => res.json())
    .then(json => {
      if(json.status === 'success') {
        currentComments = json.data.reverse();
        renderedCommentCount = 0;
        document.getElementById('comments-list').innerHTML = '';
        if (currentComments.length === 0) {
          document.getElementById('comments-list').innerHTML = '尚無留言。';
        } else {
          renderComments();
        }
      }
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

  fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(json => {
    submitBtn.disabled = false;
    submitBtn.innerText = 'TRANSMIT / 傳送';
    if (json.status === 'success' && json.data.success) {
      contentInput.value = '';
      fetchComments(item.id); 
      item.commentCount = (item.commentCount || 0) + 1;
      renderModalContent(); 
    } else {
      alert("傳送失敗");
    }
  })
  .catch(() => {
    submitBtn.disabled = false;
    submitBtn.innerText = 'TRANSMIT / 傳送';
    alert("系統錯誤");
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

  fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
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
  .catch(() => {
    btn.disabled = false;
    btn.innerText = 'SUBSCRIBE';
    msg.style.color = 'var(--neon-pink)';
    msg.innerText = ">> SYSTEM ERROR";
  });
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