/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Extract the required parts from text.txt to test them
const html = fs.readFileSync(path.resolve(__dirname, '../text.txt'), 'utf8');

// Extract variables needed for loadState
const defaultConfigMatch = html.match(/const defaultConfig = (\{[\s\S]*?\n    \});/);
const STORAGE_KEY_match = html.match(/const STORAGE_KEY = '([^']+)';/);
const STORAGE_KEY = STORAGE_KEY_match ? STORAGE_KEY_match[1] : 'levi-dashboard-v3';
const defaultConfig = eval('(' + defaultConfigMatch[1] + ')');

// Define structuredClone for Node environment if it's missing (Node < 17)
if (typeof structuredClone !== 'function') {
  global.structuredClone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Extract loadState code
// The regex below correctly matches the function block
const loadStateRegex = /function loadState\(\) \{[\s\S]*?catch \{ return structuredClone\(defaultConfig\); \}\n    \}/;
let loadStateFunctionCode = html.match(loadStateRegex)[0];

// Need to execute the function code in a context where it can access defaultConfig and STORAGE_KEY
const getLoadState = new Function('defaultConfig', 'STORAGE_KEY', 'structuredClone', `
  ${loadStateFunctionCode}
  return loadState;
`);

const loadState = getLoadState(defaultConfig, STORAGE_KEY, global.structuredClone);

describe('loadState', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear any mocks
    jest.restoreAllMocks();
  });

  test('should return defaultConfig if localStorage is empty', () => {
    const state = loadState();
    expect(state).toEqual(defaultConfig);
    // Should be a copy, not the exact same object reference
    expect(state).not.toBe(defaultConfig);
  });

  test('should return combined state if localStorage has valid JSON', () => {
    const customNotes = 'My custom notes';
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes: customNotes }));

    const state = loadState();

    // It should have the custom notes but keep the default agenda and links
    expect(state.notes).toBe(customNotes);
    expect(state.agenda).toEqual(defaultConfig.agenda);
    expect(state.links).toEqual(defaultConfig.links);
  });

  test('should return defaultConfig if localStorage has invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid json{');

    const state = loadState();
    expect(state).toEqual(defaultConfig);
  });

  test('should handle localStorage throwing an error', () => {
    // Mock localStorage.getItem to throw
    const errorSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Access denied');
    });

    const state = loadState();
    expect(state).toEqual(defaultConfig);

    errorSpy.mockRestore();
  });
});
