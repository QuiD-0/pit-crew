const F1_TEAMS = {
  f1:           { name: 'F1',           primary: '#e10600', primaryLight: '#ff1e00' },
  red_bull:     { name: 'Red Bull',     primary: '#3671C6', primaryLight: '#4a8ae0' },
  ferrari:      { name: 'Ferrari',      primary: '#E8002D', primaryLight: '#ff1a45' },
  mclaren:      { name: 'McLaren',      primary: '#FF8000', primaryLight: '#ff9933' },
  mercedes:     { name: 'Mercedes',     primary: '#27F4D2', primaryLight: '#4df7dd' },
  aston_martin: { name: 'Aston Martin', primary: '#229971', primaryLight: '#2db88a' },
  alpine:       { name: 'Alpine',       primary: '#0093CC', primaryLight: '#00aaee' },
  williams:     { name: 'Williams',     primary: '#1868DB', primaryLight: '#3580f0' },
  rb:           { name: 'Racing Bulls', primary: '#6692FF', primaryLight: '#88aaff' },
  haas:         { name: 'Haas',         primary: '#B6BABD', primaryLight: '#cdd0d3' },
  sauber:       { name: 'Sauber',       primary: '#52E252', primaryLight: '#6ee66e' },
  cadillac:     { name: 'Cadillac',     primary: '#1E4D2B', primaryLight: '#2a6b3d' },
};

function getConstructorColor(constructorId) {
  return F1_TEAMS[constructorId]?.primary || '#888';
}
