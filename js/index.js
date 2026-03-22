(function () {
  var toggle = document.getElementById('nav-toggle');
  var label = document.querySelector('label[for="nav-toggle"]');
  if (!toggle || !label) return;

  function syncAria() {
    label.setAttribute('aria-expanded', toggle.checked ? 'true' : 'false');
    label.setAttribute('aria-label', toggle.checked ? '關閉選單' : '開啟選單');
  }

  syncAria();
  toggle.addEventListener('change', syncAria);

  var links = document.querySelectorAll('.nav__links a[href^="#"]');
  links.forEach(function (a) {
    a.addEventListener('click', function () {
      toggle.checked = false;
      syncAria();
    });
  });
})();
