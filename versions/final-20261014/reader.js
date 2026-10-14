const select = document.getElementById('page');
const slide = document.getElementById('slide');
const previous = document.getElementById('prev');
const next = document.getElementById('next');
function showPage(number) {
  const page = Math.max(1, Math.min(17, number));
  const path = `slides/${String(page).padStart(2, '0')}.webp`;
  select.value = String(page);
  slide.src = path;
  slide.alt = page === 1 ? '正式提案摘要表' : page === 17 ? '補充資料：來源、實測範圍與作品連結' : `正式提案正文 P${page - 1}`;
  document.getElementById('full-page').href = path;
  document.getElementById('position').textContent = `${page} / 17`;
  previous.disabled = page === 1;
  next.disabled = page === 17;
}
select.addEventListener('change', () => showPage(Number(select.value)));
previous.addEventListener('click', () => showPage(Number(select.value) - 1));
next.addEventListener('click', () => showPage(Number(select.value) + 1));
