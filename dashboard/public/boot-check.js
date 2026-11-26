/*
 * Runs before the app. If the browser is too old, or the app hasn't drawn
 * anything after a few seconds, show a plain message instead of a white page.
 * Classic script, no modern syntax, so it runs on very old browsers too.
 */
(function () {
  function show(title, body) {
    var root = document.getElementById('root');
    if (!root || root.childNodes.length) return;
    document.body.style.cssText = 'margin:0;background:#0b2133;color:#fbf0d8;font-family:-apple-system,system-ui,sans-serif';
    root.innerHTML =
      '<div style="max-width:440px;margin:0 auto;padding:48px 24px;line-height:1.5">' +
      '<div style="width:44px;height:44px;border-radius:22px;background:#b02a29;margin-bottom:20px"></div>' +
      '<h1 style="font-size:24px;font-weight:600;margin:0 0 12px">' + title + '</h1>' +
      '<p style="font-size:16px;color:#e2d9c4;margin:0 0 16px">' + body + '</p>' +
      '<p style="font-size:14px;color:#93b4cc;margin:0">Browser: ' + navigator.userAgent.replace(/</g, '') + '</p>' +
      '<button type="button" style="margin-top:24px;font-size:16px;padding:12px 20px;border-radius:999px;border:1px solid #ff857c;background:#b02a29;color:#fbf0d8">Try again</button>' +
      '</div>';
    // No inline handlers: the production Content-Security-Policy blocks them.
    var btn = root.querySelector('button');
    if (btn) btn.addEventListener('click', function () { location.reload(); });
  }
  var modern =
    typeof window.CSS !== 'undefined' &&
    CSS.supports &&
    CSS.supports('color', 'color-mix(in srgb, red, blue)') &&
    typeof Promise !== 'undefined' &&
    'noModule' in document.createElement('script');
  if (!modern) {
    window.addEventListener('DOMContentLoaded', function () {
      show(
        'This browser is too old for Zwiers Home',
        'The dashboard needs iOS / iPadOS 16.4 or newer (or a current Chrome, Edge or Firefox). On an iPhone or iPad, check Settings → General → Software Update.'
      );
    });
    return;
  }
  // Safety net: nothing drawn after 8 s means the app failed to start.
  setTimeout(function () {
    show(
      'Zwiers Home couldn’t start',
      'Make sure you’re on the home Wi‑Fi and the Mac running the dashboard is awake, then try again.'
    );
  }, 8000);
})();
