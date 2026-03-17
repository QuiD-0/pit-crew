const CACHE_TTL = {
  schedule: 24 * 60 * 60 * 1000,   // 24시간
  standings: 60 * 60 * 1000,        // 1시간
  results: 60 * 60 * 1000,          // 1시간
};

async function cacheGet(key) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, (data) => {
      const entry = data[key];
      if (!entry) return resolve(null);
      if (Date.now() - entry.timestamp > (CACHE_TTL[key] || CACHE_TTL.schedule)) {
        return resolve(null);
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
