// 定義快取名稱與版本號
const CACHE_NAME = 'ai-works-cache-v1';

// 定義需要被快取的靜態檔案清單
const urlsToCache = [
  './',
  './index.html',
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
        console.log('快取已開啟');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. 攔截請求：優先從快取讀取，若無快取才透過網路抓取
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在快取中找到匹配的檔案，就直接回傳快取檔案
        if (response) {
          return response;
        }
        // 否則透過網路發送請求 (例如向你的 GAS API 要最新資料)
        return fetch(event.request);
      })
  );
});

// 3. 啟動階段：清除舊版本的快取 (未來若更新 v2 可確保舊檔被清除)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});