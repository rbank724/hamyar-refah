// sw.js
const CACHE_NAME = 'tarh-cache-v2';
const CORE_ASSETS = [
  '/',               // صفحه اصلی
  '/index.html',     // فایل اصلی
  '/data.json',      // دیتای طرح‌ها
  'https://cdn.jsdelivr.net/npm/vazirmatn@33.003/index.css',
  'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2'
];

// نصب اولیه: منابع اصلی را کش کن
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting(); // فعال‌سازی سریع
});

// پاک کردن کش‌های قدیمی هنگام فعال‌سازی
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// استراتژی شبکه-اول با کش پشتیبان برای data.json و HTMLهای طرح
self.addEventListener('fetch', event => {
  const req = event.request;

  // برای فایل‌های داده و htmlهای طرح، همیشه سعی کن از شبکه تازه بگیری
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

  // برای سایر منابع: کش-اول
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

// پیام ساده در حالت آفلاین
function offlinePage() {
  return new Response('<h3 style="padding:1rem;font-family:sans-serif">آفلاین هستید و این صفحه کش نشده است.</h3>', {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
