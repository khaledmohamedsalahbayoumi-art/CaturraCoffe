// Caturra Specialty Coffee Service Worker
// Enables Native Phone Lockscreen Notifications on iOS (PWA) & Android

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for message from main thread to show notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      ...options,
      badge: '/caturra_logo.jpg',
      icon: '/caturra_logo.jpg'
    });
  }
});

// Push event for remote push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'طلب جديد في متجر كاتورا! ☕', body: 'يوجد طلب جديد بانتظار التأكيد' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/caturra_logo.jpg',
      badge: '/caturra_logo.jpg',
      vibrate: [200, 100, 200],
      data: { url: '/' }
    })
  );
});

// Click notification event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
