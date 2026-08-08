const fs = require('fs');

describe('saveState from text.txt', () => {
  let extractedModule;

  beforeAll(() => {
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

  beforeEach(() => {
    const store = {};
    global.localStorage = {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      clear: jest.fn(() => {
        for (let key in store) delete store[key];
      }),
      store
    };

    jest.resetModules();
    extractedModule = require('../extracted.js');
  });

  afterEach(() => {
    delete global.localStorage;
  });

  afterAll(() => {
    delete global.structuredClone;
    if (fs.existsSync('extracted.js')) {
      fs.unlinkSync('extracted.js');
    }
  });

  it('should call localStorage.setItem with correct key and stringified state', () => {
    extractedModule.state.notes = 'Test notes from test';
    extractedModule.saveState();

    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      extractedModule.STORAGE_KEY,
      JSON.stringify(extractedModule.state)
    );
  });

  it('should actually store the value in mock localStorage', () => {
    extractedModule.state.notes = 'Test notes';
    extractedModule.state.agenda = [];
    extractedModule.state.links = [];

    extractedModule.saveState();

    expect(global.localStorage.store[extractedModule.STORAGE_KEY]).toBe('{"notes":"Test notes","agenda":[],"links":[]}');
  });

  it('should reflect changes to state when saveState is called again', () => {
    extractedModule.state.notes = 'Updated notes';
    extractedModule.state.agenda = [{ time: 'Morning', item: 'Test item' }];
    extractedModule.state.links = [];

    extractedModule.saveState();

    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      extractedModule.STORAGE_KEY,
      JSON.stringify({
        notes: 'Updated notes',
        agenda: [{ time: 'Morning', item: 'Test item' }],
        links: []
      })
    );
  });
});
