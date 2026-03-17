const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Chrome API mock
const storage = {};

globalThis.chrome = {
  storage: {
    local: {
      get(key, cb) {
        cb({ [key]: storage[key] || undefined });
      },
      set(obj, cb) {
        Object.assign(storage, obj);
        if (cb) cb();
      },
      remove(keys, cb) {
        for (const key of keys) delete storage[key];
        if (cb) cb();
      },
    },
  },
};

// document mock (minimal)
globalThis.document = {
  getElementById: () => ({ innerHTML: '', querySelector: () => null, querySelectorAll: () => [] }),
  querySelectorAll: () => [],
  documentElement: { style: { setProperty: () => {} } },
};

function resetStorage() {
  for (const key of Object.keys(storage)) delete storage[key];
}

function loadSrc(...files) {
  const root = path.resolve(__dirname, '..');
  for (const file of files) {
    const code = fs.readFileSync(path.join(root, file), 'utf-8');
    vm.runInThisContext(code, { filename: file });
  }
}

module.exports = { storage, resetStorage, loadSrc };
