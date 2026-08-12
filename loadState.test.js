const fs = require('fs');
const { JSDOM } = require('jsdom');

describe('loadState', () => {
  let dom;
  let window;

  beforeEach(() => {
    const html = fs.readFileSync('./text.txt', 'utf8');

    dom = new JSDOM(html, {
      url: "http://localhost/",
      runScripts: "outside-only"
    });
    window = dom.window;

    window.structuredClone = (val) => JSON.parse(JSON.stringify(val));

    // Mock setInterval and navigator to prevent hanging and errors
    window.setInterval = jest.fn();
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn()
    };

    window.localStorage.clear();
  });

  afterEach(() => {
    // cleanup
    dom.window.close();
  });

  it('should load default config when localStorage is empty', () => {
    const scriptEl = window.document.querySelector('script');
    window.eval(scriptEl.textContent);

    const state = window.loadState();

    expect(state.notes).toContain('Focus: Keep the signal high.');
  });

  it('should load saved config when localStorage has valid JSON', () => {
    const customConfig = {
      notes: 'Custom notes',
      agenda: [],
      links: []
    };
    window.localStorage.setItem('levi-dashboard-v3', JSON.stringify(customConfig));

    const scriptEl = window.document.querySelector('script');
    window.eval(scriptEl.textContent);

    const state = window.loadState();

    expect(state.notes).toBe('Custom notes');
  });

  it('should fallback to default config when localStorage has invalid JSON', () => {
    window.localStorage.setItem('levi-dashboard-v3', 'not valid json {');

    const scriptEl = window.document.querySelector('script');
    window.eval(scriptEl.textContent);

    const state = window.loadState();

    expect(state.notes).toContain('Focus: Keep the signal high.');
  });
});
