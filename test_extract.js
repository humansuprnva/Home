const fs = require('fs');
const content = fs.readFileSync('text.txt', 'utf8');

const scriptStart = content.indexOf('<script>');
const scriptEnd = content.indexOf('</script>');
const scriptContent = content.substring(scriptStart + 8, scriptEnd);

const saveStateLines = scriptContent.split('\n').filter(line =>
  line.includes('const STORAGE_KEY') ||
  line.includes('const defaultConfig') ||
  line.includes('function loadState') ||
  line.includes('const state =') ||
  line.includes('function saveState') ||
  // And grab the actual function bodies for loadState and saveState
  line.trim().startsWith('try {') ||
  line.trim().startsWith('const raw = localStorage.getItem') ||
  line.trim().startsWith('return raw ?') ||
  line.trim().startsWith('} catch')
);

// We want exactly the code around saveState
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
