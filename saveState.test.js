const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');

test('saveState tests', async (t) => {
    // Read text.txt
    const content = fs.readFileSync('text.txt', 'utf8');

    // We only need the code from <script> to // ── Utilities
    // We will evaluate it in a context
    const scriptStart = content.indexOf('<script>') + 8;
    const utilitiesStart = content.indexOf('// ── Utilities');
    const scriptCode = content.substring(scriptStart, utilitiesStart);

    // We need to modify the script slightly to make `state` and `saveState` accessible in the context
    // by changing `const state = ...` to `var state = ...` or just exposing it directly.
    const modifiedScriptCode = scriptCode.replace('const state =', 'var state =');

    await t.test('should save state to localStorage', () => {
        let mockLocalStorage = {};
        const context = vm.createContext({
            localStorage: {
                setItem: (key, value) => { mockLocalStorage[key] = value; },
                getItem: (key) => mockLocalStorage[key]
            },
            structuredClone: (obj) => JSON.parse(JSON.stringify(obj)),
            JSON: JSON
        });

        vm.runInContext(modifiedScriptCode, context);

        // Modify state and test saveState
        context.state.notes = 'test modified notes';
        vm.runInContext('saveState()', context);

        assert.ok(mockLocalStorage['levi-dashboard-v3']);
        const storedState = JSON.parse(mockLocalStorage['levi-dashboard-v3']);
        assert.strictEqual(storedState.notes, 'test modified notes');
    });

    await t.test('should overwrite existing state in localStorage', () => {
        let mockLocalStorage = {
            'levi-dashboard-v3': JSON.stringify({ notes: 'old notes' })
        };
        const context = vm.createContext({
            localStorage: {
                setItem: (key, value) => { mockLocalStorage[key] = value; },
                getItem: (key) => mockLocalStorage[key]
            },
            structuredClone: (obj) => JSON.parse(JSON.stringify(obj)),
            JSON: JSON
        });

        vm.runInContext(modifiedScriptCode, context);

        // Modify state and test saveState
        context.state.notes = 'new notes';
        vm.runInContext('saveState()', context);

        const storedState = JSON.parse(mockLocalStorage['levi-dashboard-v3']);
        assert.strictEqual(storedState.notes, 'new notes');
    });
});
