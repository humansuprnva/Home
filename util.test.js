/**
 * @jest-environment jsdom
 */

const fs = require('fs');

// We extract the `el` function from the HTML file to test it
const htmlContent = fs.readFileSync('text.txt', 'utf-8');

// Match the el function block
const elFunctionMatch = htmlContent.match(/function el\(tag, cls, text\) \{[\s\S]*?return e;\n\s*\}/);

if (!elFunctionMatch) {
  throw new Error("Could not find el function in text.txt");
}

// Evaluate the function in the current scope
let elFn;
eval("elFn = " + elFunctionMatch[0]);

describe('el utility function', () => {
  it('should create an element with the given tag', () => {
    const element = elFn('div');
    expect(element.tagName.toLowerCase()).toBe('div');
  });

  it('should apply the given class name', () => {
    const element = elFn('span', 'my-class');
    expect(element.className).toBe('my-class');
  });

  it('should not set className if cls is falsy', () => {
    const element = elFn('div', '');
    expect(element.className).toBe('');

    const element2 = elFn('div');
    expect(element2.className).toBe('');
  });

  it('should set innerHTML if text is provided', () => {
    const element = elFn('p', null, 'Hello <b>World</b>');
    expect(element.innerHTML).toBe('Hello <b>World</b>');
  });

  it('should not set innerHTML if text is undefined', () => {
    const element = elFn('div');
    expect(element.innerHTML).toBe('');
  });

  it('should allow setting empty string as text', () => {
    const element = elFn('div', null, '');
    expect(element.innerHTML).toBe('');
  });

  it('should set text content correctly', () => {
    const element = elFn('div', 'test-class', 'Testing 123');
    expect(element.tagName).toBe('DIV');
    expect(element.className).toBe('test-class');
    expect(element.innerHTML).toBe('Testing 123');
  });
});
