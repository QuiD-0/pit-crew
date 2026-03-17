const TEAM_THEMES = {
  f1: { name: 'F1', primary: '#e10600', primaryLight: '#ff1e00' },
  red_bull: { name: 'Red Bull', primary: '#3671C6', primaryLight: '#4a8ae0' },
  ferrari: { name: 'Ferrari', primary: '#E8002D', primaryLight: '#ff1a45' },
  mclaren: { name: 'McLaren', primary: '#FF8000', primaryLight: '#ff9933' },
  mercedes: { name: 'Mercedes', primary: '#27F4D2', primaryLight: '#4df7dd' },
  aston_martin: { name: 'Aston Martin', primary: '#229971', primaryLight: '#2db88a' },
  alpine: { name: 'Alpine', primary: '#0093CC', primaryLight: '#00aaee' },
  williams: { name: 'Williams', primary: '#1868DB', primaryLight: '#3580f0' },
  rb: { name: 'Racing Bulls', primary: '#6692FF', primaryLight: '#88aaff' },
  haas: { name: 'Haas', primary: '#B6BABD', primaryLight: '#cdd0d3' },
  sauber: { name: 'Sauber', primary: '#52E252', primaryLight: '#6ee66e' },
};

function applyTheme(themeId) {
  const theme = TEAM_THEMES[themeId] || TEAM_THEMES.f1;
  document.documentElement.style.setProperty('--color-primary', theme.primary);
  document.documentElement.style.setProperty('--color-primary-light', theme.primaryLight);
  chrome.storage.local.set({ theme: themeId });
}

function initThemes() {
  // Render theme grid
  const grid = document.getElementById('theme-grid');
  grid.innerHTML = '';

  Object.entries(TEAM_THEMES).forEach(([id, theme]) => {
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
