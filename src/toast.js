function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function showToast(msg, duration = 2000) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  el.classList.add('toast--visible');
  setTimeout(() => {
    el.classList.remove('toast--visible');
    setTimeout(() => { el.hidden = true; }, 300);
  }, duration);
}
