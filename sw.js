// 아기 기록표 — 홈 화면 추가용 최소 서비스워커 (캐시 없음, 항상 네트워크)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
