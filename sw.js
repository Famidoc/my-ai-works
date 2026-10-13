// 定義快取名稱與版本號 (v3: 支援小說深層連結與忽略網址參數匹配)
const CACHE_NAME = 'ai-works-cache-v3';

// 定義需要被快取的靜態檔案清單
const urlsToCache = [
  './',
  './index.html',
  './github-pages.html',
  './style.css',
  './app.js',
  './manifest.json',
  './favicon.png' 
];

// 1. 安裝階段：將靜態檔案寫入快取
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('快取已開啟 (v3)');
        return cache.addAll(urlsToCache);
      })
  );
  // 立即啟用新版 Service Worker，不等待舊版關閉
  self.skipWaiting();
});

// 2. 攔截請求：根據請求類型使用不同策略
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // 🔥 GAS API 請求 & Google 服務 → 永遠走網路，絕不快取
  // 避免把 GAS 的 HTML 錯誤頁或過期資料快取起來
  if (url.includes('script.google.com') || 
      url.includes('googleapis.com') ||
      url.includes('action=')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 🔥 外部資源 (Google Fonts, YouTube 縮圖, Drive 圖片等) → Network First
  if (!url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // 🔥 本站靜態資源 → Stale-While-Revalidate (忽略 query string 參數以確保 ?id=... 深層連結與版本參數正常匹配)
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // 只快取成功的回應
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse); // 離線時 fallback 到快取
        
        return cachedResponse || fetchPromise;
      })
    )
  );
});

// 3. 啟動階段：清除舊版本的快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      // 立即接管所有頁面
      return self.clients.claim();
    })
  );
});