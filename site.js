const menu = document.querySelector('.sidebar details');
if (menu) {
  const narrow = window.matchMedia('(max-width: 700px)');
  function updateMenu() { menu.open = !narrow.matches; }
  updateMenu();
  narrow.addEventListener('change', updateMenu);
}
