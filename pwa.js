/**
 * pwa.js — register the service worker so browsers offer "Install app".
 * Include with: <script src="/pwa.js" defer></script>
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .catch(function (err) { try { console.warn('[pwa] SW register failed:', err); } catch (e) {} });
  });
}
