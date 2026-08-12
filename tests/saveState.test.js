const fs = require('fs');
const test = require('node:test');
const assert = require('node:assert');

test('saveState from text.txt', async (t) => {
  let extractedModule;

  t.before(() => {
    const content = fs.readFileSync('text.txt', 'utf8');
    const scriptStart = content.indexOf('<script>');
    const scriptEnd = content.indexOf('</script>');
    const scriptContent = content.substring(scriptStart + 8, scriptEnd);

    const regex = /const STORAGE_KEY[\s\S]*?function saveState\(\) \{ localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(state\)\); \}/;
    const match = scriptContent.match(regex);

    if (match) {
      let moduleContent = match[0];

      // Make state mutable
      moduleContent = moduleContent.replace(/const state = loadState\(\);/, 'var state = loadState();');
      moduleContent = moduleContent.replace(/const STORAGE_KEY = 'levi-dashboard-v3';/, 'var STORAGE_KEY = "levi-dashboard-v3";');
      moduleContent = moduleContent.replace(/const defaultConfig =/, 'var defaultConfig =');

      let prefix = `
      global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
      `;

      let suffix = `
      module.exports = {
        saveState,
        loadState,
        get state() { return state; },
        set state(newS) { state = newS; },
        get STORAGE_KEY() { return STORAGE_KEY; },
        set STORAGE_KEY(newK) { STORAGE_KEY = newK; }
      };
      `;

      fs.writeFileSync('extracted.js', prefix + moduleContent + suffix);
    }
  });

  t.beforeEach(() => {
    const store = {};
    global.localStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => {
        store[key] = value.toString();
      },
      clear: () => {
        for (let key in store) delete store[key];
      },
      store
    };

    // Using require caching workaround for standard require
    delete require.cache[require.resolve('../extracted.js')];
    extractedModule = require('../extracted.js');
  });

  t.afterEach(() => {
    delete global.localStorage;
  });

  t.after(() => {
    delete global.structuredClone;
    if (fs.existsSync('extracted.js')) {
      fs.unlinkSync('extracted.js');
    }
  });

  await t.test('should call localStorage.setItem with correct key and stringified state', () => {
    extractedModule.state.notes = 'Test notes from test';
    extractedModule.saveState();

    const parsed = JSON.parse(global.localStorage.store[extractedModule.STORAGE_KEY]);
    assert.strictEqual(parsed.notes, 'Test notes from test');
  });

  await t.test('should actually store the value in mock localStorage', () => {
    extractedModule.state.notes = 'Test notes';
    extractedModule.state.agenda = [];
    extractedModule.state.links = [];

    extractedModule.saveState();

    assert.strictEqual(
      global.localStorage.store[extractedModule.STORAGE_KEY],
      '{"notes":"Test notes","agenda":[],"links":[]}'
    );
  });

  await t.test('should reflect changes to state when saveState is called again', () => {
    extractedModule.state.notes = 'Updated notes';
    extractedModule.state.agenda = [{ time: 'Morning', item: 'Test item' }];
    extractedModule.state.links = [];

    extractedModule.saveState();

    assert.strictEqual(
      global.localStorage.store[extractedModule.STORAGE_KEY],
      '{"notes":"Updated notes","agenda":[{"time":"Morning","item":"Test item"}],"links":[]}'
    );
  });
});
