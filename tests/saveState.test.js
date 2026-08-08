const fs = require('fs');

describe('saveState from text.txt', () => {
  let extractedModule;

  beforeAll(() => {
    require('../test_extract.js');
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
