const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './text.txt'), 'utf8');
const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const elMatch = scriptContent.match(/function el\([\s\S]*?\n    \}/)[0];
const makeCardMatch = scriptContent.match(/function makeCard\([\s\S]*?\n    \}/)[0];

eval(elMatch);
eval(makeCardMatch);

describe('makeCard', () => {
  it('creates a basic card with correct classes and structure', () => {
    const card = makeCard('blue', '🚀', 'Test Kicker', 'Test Title');
    expect(card.tagName).toBe('ARTICLE');
    expect(card.className).toBe('widget-card');
    expect(card.dataset.accent).toBe('blue');
    expect(card.dataset.major).toBeUndefined();

    // Check inner structure
    const band = card.querySelector('.card-band');
    expect(band).not.toBeNull();

    const inner = card.querySelector('.widget-inner');
    expect(inner).not.toBeNull();

    const labelRow = inner.querySelector('.widget-label');
    expect(labelRow).not.toBeNull();

    const icon = labelRow.querySelector('.widget-icon');
    expect(icon).not.toBeNull();
    expect(icon.innerHTML).toBe('🚀');

    const kicker = labelRow.querySelector('.widget-kicker');
    expect(kicker).not.toBeNull();
    expect(kicker.innerHTML).toBe('Test Kicker');

    const title = labelRow.querySelector('.widget-title');
    expect(title).not.toBeNull();
    expect(title.innerHTML).toBe('Test Title');
  });

  it('creates a major card when isMajor is true', () => {
    const card = makeCard('red', '🔥', 'Kicker', 'Title', true);
    expect(card.dataset.major).toBe('true');
  });

  it('handles empty strings for icon, kicker, and title', () => {
    const card = makeCard('green', '', '', '');

    const icon = card.querySelector('.widget-icon');
    expect(icon.innerHTML).toBe('');

    const kicker = card.querySelector('.widget-kicker');
    expect(kicker.innerHTML).toBe('');

    const title = card.querySelector('.widget-title');
    expect(title.innerHTML).toBe('');
  });

  it('does not set data-major if isMajor is false or omitted', () => {
    const cardExplicit = makeCard('blue', '🚀', 'Test Kicker', 'Test Title', false);
    expect(cardExplicit.dataset.major).toBeUndefined();

    const cardOmitted = makeCard('blue', '🚀', 'Test Kicker', 'Test Title');
    expect(cardOmitted.dataset.major).toBeUndefined();
  });
});
