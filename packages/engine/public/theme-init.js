(function () {
  var pref = 'system';
  try {
    pref = JSON.parse(localStorage.getItem('rhce:theme')) || 'system';
  } catch (e) {}
  var dark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  // The page's text written at build time is for search engines and readers without JavaScript; with
  // JavaScript the app draws the page, so the text stays hidden instead of flashing and jumping.
  document.documentElement.dataset.app = 'js';
})();
