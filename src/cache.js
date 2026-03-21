const CACHE_TTL = {
  schedule: 24 * 60 * 60 * 1000,           // 24시간
  standings_drivers: 60 * 60 * 1000,       // 1시간
  standings_constructors: 60 * 60 * 1000,  // 1시간
  results: 60 * 60 * 1000,                 // 1시간
};

async function cacheGet(key, options = {}) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, (data) => {
      const entry = data[key];
      if (!entry) return resolve(null);

      const ttl = CACHE_TTL[key] || CACHE_TTL.schedule;
      const isStale = Date.now() - entry.timestamp > ttl;

      if (isStale && !options.stale) return resolve(null);
      if (options.stale) {
        return resolve({ data: entry.data, timestamp: entry.timestamp, isStale });
      }
      resolve(entry.data);
    });
  });
}

async function cacheSet(key, data) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: { data, timestamp: Date.now() } }, resolve);
  });
}

async function cacheInvalidate(keys) {
  const data = await new Promise(resolve =>
    chrome.storage.local.get(keys, resolve)
  );
  const updates = {};
  for (const key of keys) {
    if (data[key]) updates[key] = { ...data[key], timestamp: 0 };
  }
  if (Object.keys(updates).length === 0) return;
  return new Promise(resolve =>
    chrome.storage.local.set(updates, resolve)
  );
}
