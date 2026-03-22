const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Chrome API mock
const storage = {};

globalThis.chrome = {
  storage: {
    local: {
      get(keys, cb) {
        if (keys === null) {
          cb({ ...storage });
        } else if (Array.isArray(keys)) {
          const result = {};
          for (const key of keys) {
            if (storage[key] !== undefined) result[key] = storage[key];
          }
          cb(result);
        } else {
          cb({ [keys]: storage[keys] || undefined });
        }
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
