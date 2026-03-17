function applyTheme(themeId) {
  const theme = F1_TEAMS[themeId] || F1_TEAMS.f1;
  document.documentElement.style.setProperty('--color-primary', theme.primary);
  document.documentElement.style.setProperty('--color-primary-light', theme.primaryLight);
  chrome.storage.local.set({ theme: themeId });
}

function initThemes() {
  // Render theme grid
  const grid = document.getElementById('theme-grid');
  grid.innerHTML = '';

  Object.entries(F1_TEAMS).forEach(([id, theme]) => {
    const swatch = document.createElement('button');
    swatch.className = 'theme-swatch';
    swatch.dataset.theme = id;
    swatch.innerHTML = `
      <div class="theme-swatch__color" style="background: ${theme.primary}"></div>
      <span class="theme-swatch__name">${theme.name}</span>
    `;
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('theme-swatch--active'));
      swatch.classList.add('theme-swatch--active');
      applyTheme(id);
      document.getElementById('theme-modal').hidden = true;
    });
    grid.appendChild(swatch);
  });

  // Load saved theme
  chrome.storage.local.get('theme', ({ theme }) => {
    const id = theme || 'f1';
    applyTheme(id);
    const active = grid.querySelector(`[data-theme="${id}"]`);
    if (active) active.classList.add('theme-swatch--active');
  });
}
