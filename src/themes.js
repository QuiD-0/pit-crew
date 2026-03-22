function applyTheme(themeId) {
  const theme = F1_TEAMS[themeId] || F1_TEAMS.f1;
  document.documentElement.style.setProperty('--color-primary', theme.primary);
  document.documentElement.style.setProperty('--color-primary-light', theme.primaryLight);
  chrome.storage.local.set({ theme: themeId });
}

function applyMode(mode) {
  if (mode === 'light') {
    document.documentElement.dataset.mode = 'light';
  } else {
    delete document.documentElement.dataset.mode;
  }
  chrome.storage.local.set({ mode });
}

function initThemes() {
  // Mode toggle
  const modeSwitch = document.getElementById('mode-switch');
  modeSwitch.addEventListener('click', () => {
    const isLight = document.documentElement.dataset.mode === 'light';
    const newMode = isLight ? 'dark' : 'light';
    applyMode(newMode);
    modeSwitch.classList.toggle('mode-toggle--light', newMode === 'light');
  });

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

  // Load saved theme & mode
  chrome.storage.local.get(['theme', 'mode'], ({ theme, mode }) => {
    const id = theme || 'f1';
    applyTheme(id);
    const active = grid.querySelector(`[data-theme="${id}"]`);
    if (active) active.classList.add('theme-swatch--active');

    const savedMode = mode || 'dark';
    applyMode(savedMode);
    modeSwitch.classList.toggle('mode-toggle--light', savedMode === 'light');
  });
}
