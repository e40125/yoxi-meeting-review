export const DEADLINE = Date.parse('2026-10-14T13:00:00+08:00');
export const FINAL_WEEK_START = DEADLINE - 7 * 24 * 60 * 60 * 1000;

export function deadlineState(now) {
  const remaining = Math.max(0, DEADLINE - now);
  const minutes = Math.ceil(remaining / 60000);
  return {
    closed: now >= DEADLINE,
    days: Math.floor(minutes / 1440),
    hours: Math.floor(minutes % 1440 / 60),
    minutes: minutes % 60,
    elapsed: Math.max(0, Math.min(100, (now - FINAL_WEEK_START) / (DEADLINE - FINAL_WEEK_START) * 100)),
  };
}

export function updateDeadline(root, now = Date.now()) {
  const value = deadlineState(now);
  root.dataset.state = value.closed ? 'closed' : 'open';
  for (const unit of ['days', 'hours', 'minutes']) {
    root.querySelector(`[data-count="${unit}"]`).textContent = String(value[unit]).padStart(2, '0');
  }
  const track = root.querySelector('[role="progressbar"]');
  track.setAttribute('aria-valuenow', value.elapsed.toFixed(2));
  track.setAttribute('aria-valuetext', value.closed ? '初賽已截止' : `距初賽截止還有 ${value.days} 天 ${value.hours} 小時 ${value.minutes} 分鐘；此條顯示最後一週的時間進度。`);
  root.querySelector('.deadline-fill').style.width = `${value.elapsed}%`;
  root.querySelector('.deadline-countdown').hidden = value.closed;
  root.querySelector('.deadline-ended').hidden = !value.closed;
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('deadline');
  if (root) {
    updateDeadline(root);
    setInterval(() => updateDeadline(root), 1000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) updateDeadline(root);
    });
  }
}
