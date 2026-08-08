const { JSDOM } = require('jsdom');
const fs = require('fs');

describe('loadState', () => {
  let dom;
  let window;

  beforeEach(() => {
    const html = fs.readFileSync('text.txt', 'utf8');
    // Replace boot() call with our exports to prevent timer loop and to expose internals
    const modifiedHtml = html.replace(/boot\(\);/, 'window.loadState = loadState; window.defaultConfig = defaultConfig; window.STORAGE_KEY = STORAGE_KEY;');

    dom = new JSDOM(modifiedHtml, {
      runScripts: "dangerously",
      beforeParse(win) {
        // structuredClone is not natively supported in older jsdom/node, so mock it
        win.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));

        // Mock localStorage properly for jsdom environment
        Object.defineProperty(win, 'localStorage', {
          value: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            clear: jest.fn()
          },
          writable: true
        });
      }
    });

    window = dom.window;
  });

  afterEach(() => {
    // Prevent memory leaks / jsdom timeouts
    window.close();
  });

  it('handles invalid JSON from localStorage by returning defaultConfig', () => {
    // Arrange
    window.localStorage.getItem.mockReturnValue('invalid-json-that-throws-error');

    // Act
    const state = window.loadState();

    // Assert
    // The loadState function should catch JSON.parse error and return the default config
    expect(state).toEqual(window.defaultConfig);
    expect(window.localStorage.getItem).toHaveBeenCalledWith(window.STORAGE_KEY);
  });

  it('loads valid state correctly', () => {
    // Arrange
    const customState = { ...window.defaultConfig, notes: 'some custom notes' };
    window.localStorage.getItem.mockReturnValue(JSON.stringify(customState));

    // Act
    const state = window.loadState();

    // Assert
    expect(state).toEqual(customState);
    expect(window.localStorage.getItem).toHaveBeenCalledWith(window.STORAGE_KEY);
  });

  it('returns default config when localStorage returns null', () => {
    // Arrange
    window.localStorage.getItem.mockReturnValue(null);

    // Act
    const state = window.loadState();

    // Assert
    expect(state).toEqual(window.defaultConfig);
    expect(window.localStorage.getItem).toHaveBeenCalledWith(window.STORAGE_KEY);
  });
});
