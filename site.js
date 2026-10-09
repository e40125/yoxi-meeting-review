const menu = document.querySelector('.sidebar details');
if (menu) {
  const narrow = window.matchMedia('(max-width: 700px)');
  function updateMenu() { menu.open = !narrow.matches; }
  updateMenu();
  narrow.addEventListener('change', updateMenu);
}

function revealAnchor() {
  let target;
  try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
  if (!target) return;
  let element = target;
  while (element) { if (element.tagName === 'DETAILS') element.open = true; element = element.parentElement; }
  requestAnimationFrame(() => target.scrollIntoView());
}
window.addEventListener('hashchange', revealAnchor);
if (location.hash) revealAnchor();
const currentLink = document.querySelector('.sidebar a[aria-current="page"]');
if (currentLink) { let p = currentLink.parentElement; while(p && !p.classList.contains('sidebar')) { if(p.classList.contains('deep-nav')) p.open=true; p=p.parentElement; } }

let printClosedSections = null;
function expandForPrint() {
  if (printClosedSections !== null) return;
  printClosedSections = Array.from(document.querySelectorAll('main details:not([open])'));
  printClosedSections.forEach(section => { section.open = true; });
}
function restoreAfterPrint() {
  if (printClosedSections === null) return;
  printClosedSections.forEach(section => { section.open = false; });
  printClosedSections = null;
}
window.addEventListener('beforeprint', expandForPrint);
window.addEventListener('afterprint', restoreAfterPrint);
const printMedia = window.matchMedia('print');
printMedia.addEventListener('change', event => event.matches ? expandForPrint() : restoreAfterPrint());
if (printMedia.matches) expandForPrint();
