(async () => {
  const image = document.getElementById('slide-image');
  const select = document.getElementById('slide-select');
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  const error = document.getElementById('reader-error');
  let slides, current = 1;
  function indexFromHash() {
    const match = /^#slide-(\d+)$/.exec(location.hash);
    if (!match) return 1;
    return Math.max(0, Math.min(slides.length - 1, Number(match[1]) - 1));
  }
  function paragraph(value, className) {
    const p = document.createElement('p');
    p.textContent = value;
    if (className) p.className = className;
    return p;
  }
  function show(index) {
    current = index;
    const slide = slides[index];
    image.src = slide.image;
    image.alt = `${slide.label}：${slide.title}。完整文字可在下方展開。`;
    select.value = String(index);
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    document.getElementById('slide-status').textContent = `${slide.label}：${slide.title}`;
    const title = document.createElement('h2'); title.textContent = slide.title;
    document.getElementById('slide-text').replaceChildren(title, ...slide.text.map(t => paragraph(t)), paragraph(slide.footnote, 'status-note'));
    document.getElementById('slide-spoken').replaceChildren(...slide.notes.split('\n\n').filter(Boolean).map(t => paragraph(t)));
    document.title = `${slide.title}｜yoxi 初賽簡報`;
  }
  function navigate(index) {
    if (index < 0 || index >= slides.length) return;
    location.hash = `slide-${index + 1}`;
  }
  try {
    const response = await fetch('assets/proposal/slides.json');
    if (!response.ok) throw new Error('Slide data unavailable');
    slides = await response.json();
    show(indexFromHash());
    document.getElementById('slide-controls').hidden = false;
    window.addEventListener('hashchange', () => show(indexFromHash()));
    previous.addEventListener('click', () => navigate(current - 1));
    next.addEventListener('click', () => navigate(current + 1));
    select.addEventListener('change', () => navigate(Number(select.value)));
    document.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(event.target.tagName) || event.target.isContentEditable) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(current - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); navigate(current + 1); }
    });
    image.addEventListener('error', () => { error.hidden = false; });
    image.addEventListener('load', () => { error.hidden = true; });
  } catch {
    error.hidden = false;
  }
})();
