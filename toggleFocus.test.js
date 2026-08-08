const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('toggleFocus', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, 'text.txt'), 'utf8');
    // Replace boot() so it doesn't run fetch calls which timeout JSDOM
    const safeHtml = html.replace('boot();', '');

    dom = new JSDOM(safeHtml, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.structuredClone = (val) => JSON.parse(JSON.stringify(val));
        window.fetch = () => Promise.resolve({ json: () => Promise.resolve({}) });
      }
    });
    document = dom.window.document;
    window = dom.window;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('should set is-focused class on the targeted card', () => {
    const card = document.createElement('div');
    card.className = 'widget-card';
    card.dataset.major = 'true';
    document.body.appendChild(card);

    window.toggleFocus(card);
    expect(card.classList.contains('is-focused')).toBe(true);
  });

  test('should do nothing if the card is already focused', () => {
    const card = document.createElement('div');
    card.className = 'widget-card';
    document.body.appendChild(card);

    window.toggleFocus(card);
    expect(card.classList.contains('is-focused')).toBe(true);

    card.classList.remove('is-focused');
    window.toggleFocus(card);
    expect(card.classList.contains('is-focused')).toBe(false);
  });

  test('should properly update classes on all cards', () => {
    const majorCard1 = document.createElement('div');
    majorCard1.className = 'widget-card';
    majorCard1.dataset.major = 'true';

    const majorCard2 = document.createElement('div');
    majorCard2.className = 'widget-card';
    majorCard2.dataset.major = 'true';
    majorCard2.classList.add('is-focused');

    const minorCard = document.createElement('div');
    minorCard.className = 'widget-card';
    minorCard.dataset.major = 'false';

    document.body.appendChild(majorCard1);
    document.body.appendChild(majorCard2);
    document.body.appendChild(minorCard);

    window.toggleFocus(majorCard1);

    expect(majorCard1.classList.contains('is-focused')).toBe(true);
    expect(majorCard1.classList.contains('is-minimized')).toBe(false);
    expect(majorCard1.classList.contains('is-restored')).toBe(false);

    expect(majorCard2.classList.contains('is-focused')).toBe(false);
    expect(majorCard2.classList.contains('is-restored')).toBe(true);
    expect(majorCard2.classList.contains('is-minimized')).toBe(false);

    expect(minorCard.classList.contains('is-focused')).toBe(false);
    expect(minorCard.classList.contains('is-restored')).toBe(false);
    expect(minorCard.classList.contains('is-minimized')).toBe(true);
  });

  test('should work when targeting a minor card', () => {
    const majorCard = document.createElement('div');
    majorCard.className = 'widget-card';
    majorCard.dataset.major = 'true';

    const minorCard = document.createElement('div');
    minorCard.className = 'widget-card';
    minorCard.dataset.major = 'false';

    document.body.appendChild(majorCard);
    document.body.appendChild(minorCard);

    window.toggleFocus(minorCard);

    expect(minorCard.classList.contains('is-focused')).toBe(true);
    expect(minorCard.classList.contains('is-minimized')).toBe(false);
    expect(minorCard.classList.contains('is-restored')).toBe(false);

    expect(majorCard.classList.contains('is-focused')).toBe(false);
    expect(majorCard.classList.contains('is-restored')).toBe(true);
    expect(majorCard.classList.contains('is-minimized')).toBe(false);
  });

  test('should ignore cards that do not have the .widget-card class', () => {
    const nonCard = document.createElement('div');
    nonCard.className = 'some-other-class';
    nonCard.dataset.major = 'true';
    document.body.appendChild(nonCard);

    const card = document.createElement('div');
    card.className = 'widget-card';
    document.body.appendChild(card);

    window.toggleFocus(card);

    expect(nonCard.classList.contains('is-restored')).toBe(false);
    expect(nonCard.classList.contains('is-minimized')).toBe(false);
    expect(card.classList.contains('is-focused')).toBe(true);
  });
});
