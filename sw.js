// sw.js
const CACHE_NAME = 'tarh-cache-v3';
const CORE_ASSETS = [
  '/',                    // صفحه اصلی
  '/index.html',          // فایل اصلی
  '/data.json',           // دیتای طرح‌ها
  '/manifest.json',       // مانیفست
  '/icons/icon-192.png',  // آیکن 192
  '/icons/icon-512.png',  // آیکن 512
  '/icons/apple-touch-icon.png', // آیکن iOS
  'https://cdn.jsdelivr.net/npm/vazirmatn@33.003/index.css',
  'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2'
];

// 📦 نصب اولیه: کش کردن فایل‌های اصلی
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// 🧹 حذف کش‌های قدیمی هنگام فعال‌سازی
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 🌐 استراتژی شبکه‌اول برای فایل‌های JSON و HTML
self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.url.endsWith('.json') || req.url.endsWith('.html')) {
    event.respondWith(
      fetch(req)
        .then(networkRes => {
          caches.open(CACHE_NAME).then(cache => cache.put(req, networkRes.clone()));
          return networkRes;
        })
        .catch(() => caches.match(req).then(cached => cached || offlinePage()))
    );
    return;
  }

  // 🪣 سایر درخواست‌ها: کش-اول
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(networkRes => {
        caches.open(CACHE_NAME).then(cache => cache.put(req, networkRes.clone()));
        return networkRes;
      }).catch(() => offlinePage());
    })
  );
});

// 📴 نمایش پیام ساده در حالت آفلاین
function offlinePage() {
  return new Response('<h3 style="padding:1rem;font-family:sans-serif">آفلاین هستید و این صفحه کش نشده است.</h3>', {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
