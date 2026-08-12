      notes: 'Focus: Keep the signal high.\n\n- Task 1\n- Task 2',
      agenda: [
        { time: 'Morning',  item: 'Choose one clear priority.' },
        { time: 'Midday',   item: 'Tighten the work. Trim the noise.' },
        { time: 'Evening',  item: 'Leave yourself a clean runway for tomorrow.' },
      ],
      links: [
        { n: 'GitHub', u: 'https://github.com' },
        { n: 'Docs', u: 'https://developer.mozilla.org' },
        { n: 'News', u: 'https://news.ycombinator.com' }
      ]
    };

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? { ...structuredClone(defaultConfig), ...JSON.parse(raw) } : structuredClone(defaultConfig);
      } catch (e) { console.error(e); return structuredClone(defaultConfig); }
    }
    const state = loadState();
    function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

    // ── Utilities ─────────────────────────────────────────────────
    function el(tag, cls, text) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined) e.innerHTML = text; // Allow simple HTML
      return e;
    }

    function makeCard(accent, icon, kicker, title, isMajor = false) {
