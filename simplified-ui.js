document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('touchstart', () => btn.classList.add('active'));
  btn.addEventListener('touchend', () => btn.classList.remove('active'));
});

document.getElementById('hub-main').addEventListener('dblclick', () => {
  showToast('Double-tap to duplicate bot (placeholder)', 'info');
});