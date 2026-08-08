const fs = require('fs');
const { JSDOM } = require('jsdom');

describe('toggleFocus', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    const html = fs.readFileSync('text.txt', 'utf-8');
    // Replace timers and fetches to prevent open handles during tests
    const safeHtml = html
      .replace(/setInterval/g, 'window.mockSetInterval')
      .replace(/fetch/g, 'window.mockFetch');

    dom = new JSDOM(safeHtml, {
      runScripts: "dangerously",
      beforeParse(window) {
        window.structuredClone = val => JSON.parse(JSON.stringify(val));
        window.mockSetInterval = () => 1;
        window.mockFetch = () => Promise.resolve({ json: () => Promise.resolve({ items: [], daily: { time: [] }, current: {} }) });
      }
    });
    document = dom.window.document;
    window = dom.window;
  });

  afterEach(() => {
    // Attempt to close anything if necessary
    window.close();
  });

  it('should exist on window', () => {
    expect(typeof window.toggleFocus).toBe('function');
  });

  it('should focus a card', () => {
    const card = document.createElement('div');
    card.className = 'widget-card';
    card.dataset.major = 'true';
    document.body.appendChild(card);

    // We also need another card to see the effect on others
    const otherCard = document.createElement('div');
    otherCard.className = 'widget-card';
    otherCard.dataset.major = 'false';
    document.body.appendChild(otherCard);

    window.toggleFocus(card);

    expect(card.classList.contains('is-focused')).toBe(true);
    expect(card.classList.contains('is-minimized')).toBe(false);
    expect(card.classList.contains('is-restored')).toBe(false);

    expect(otherCard.classList.contains('is-focused')).toBe(false);
    expect(otherCard.classList.contains('is-minimized')).toBe(true);

    // Check internal focusedWidget variable using a getter if possible,
    // or by inferring from behavior.
  });

  it('should restore major cards and minimize minor cards when another card is focused', () => {
    const mainCard = document.createElement('div');
    mainCard.className = 'widget-card';
    document.body.appendChild(mainCard);

    const majorCard = document.createElement('div');
    majorCard.className = 'widget-card';
    majorCard.dataset.major = 'true';
    document.body.appendChild(majorCard);

    const minorCard = document.createElement('div');
    minorCard.className = 'widget-card';
    minorCard.dataset.major = 'false';
    document.body.appendChild(minorCard);

    // Focus main card
    window.toggleFocus(mainCard);

    expect(majorCard.classList.contains('is-restored')).toBe(true);
    expect(majorCard.classList.contains('is-minimized')).toBe(false);

    expect(minorCard.classList.contains('is-minimized')).toBe(true);
    expect(minorCard.classList.contains('is-restored')).toBe(false);
  });

  it('should not do anything if the card is already focused', () => {
    const card = document.createElement('div');
    card.className = 'widget-card';
    document.body.appendChild(card);

    window.toggleFocus(card);
    expect(card.classList.contains('is-focused')).toBe(true);

    // Add a dummy class
    card.classList.add('dummy');

    // Focus again
    window.toggleFocus(card);

    // It should just return, not clearing classes etc.
    expect(card.classList.contains('dummy')).toBe(true);
  });

  it('should unfocus when body is clicked', () => {
    const card = document.createElement('div');
    card.className = 'widget-card';
    document.body.appendChild(card);

    window.toggleFocus(card);
    expect(card.classList.contains('is-focused')).toBe(true);

    // Simulate body click
    document.body.click();

    expect(card.classList.contains('is-focused')).toBe(false);
    expect(card.classList.contains('is-minimized')).toBe(false);
    expect(card.classList.contains('is-restored')).toBe(false);
  });
});
