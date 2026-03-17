async function renderStandings() {
  const panel = document.getElementById('panel-standings');
  panel.innerHTML = '<div class="loading">Loading standings</div>';

  try {
    const [drivers, constructors] = await Promise.all([
      getDriverStandings(),
      getConstructorStandings(),
    ]);

    panel.innerHTML = `
      <div class="standings-toggle">
        <button class="standings-toggle__btn standings-toggle__btn--active" data-type="drivers">Drivers</button>
        <button class="standings-toggle__btn" data-type="constructors">Constructors</button>
      </div>

      <div class="standings-list" id="standings-drivers">
        ${drivers.map(d => `
          <div class="standing-row">
            <span class="standing-row__pos">${d.position}</span>
            <span class="standing-row__color" style="background: ${getConstructorColor(d.Constructors[0]?.constructorId)}"></span>
            <div class="standing-row__info">
              <span class="standing-row__name">${d.Driver.givenName} <strong>${d.Driver.familyName}</strong></span>
              <span class="standing-row__team">${d.Constructors[0]?.name || ''}</span>
            </div>
            <span class="standing-row__points">${d.points}<small>pts</small></span>
          </div>
        `).join('')}
      </div>

      <div class="standings-list" id="standings-constructors" style="display:none">
        ${constructors.map(c => `
          <div class="standing-row">
            <span class="standing-row__pos">${c.position}</span>
            <span class="standing-row__color" style="background: ${getConstructorColor(c.Constructor.constructorId)}"></span>
            <div class="standing-row__info">
              <span class="standing-row__name"><strong>${c.Constructor.name}</strong></span>
            </div>
            <span class="standing-row__points">${c.points}<small>pts</small></span>
          </div>
        `).join('')}
      </div>
    `;

    // Toggle drivers/constructors
    panel.querySelectorAll('.standings-toggle__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.standings-toggle__btn').forEach(b => b.classList.remove('standings-toggle__btn--active'));
        btn.classList.add('standings-toggle__btn--active');
        document.getElementById('standings-drivers').style.display = btn.dataset.type === 'drivers' ? '' : 'none';
        document.getElementById('standings-constructors').style.display = btn.dataset.type === 'constructors' ? '' : 'none';
      });
    });
  } catch (err) {
    panel.innerHTML = `<div class="error">Failed to load standings: ${err.message}</div>`;
  }
}
