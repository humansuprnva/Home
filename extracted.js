    const STORAGE_KEY = 'levi-dashboard-v3';

    const defaultConfig = {
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
      const card = document.createElement('article');
      card.className = 'widget-card';
      if (isMajor) card.dataset.major = "true";
      card.dataset.accent = accent;

      const band = el('div', 'card-band');
      const inner = el('div', 'widget-inner');
      const labelRow = el('div', 'widget-label');
      labelRow.append(el('div', 'widget-icon', icon), el('div', '').appendChild(el('p', 'widget-kicker', kicker)).parentNode.appendChild(el('h2', 'widget-title', title)).parentNode);

      inner.appendChild(labelRow);
      card.append(band, inner);
      return card;
    }

    // ── Focus & State Engine ──────────────────────────────────────
    let focusedWidget = null;

    function toggleFocus(card) {
      if (focusedWidget === card) return; // Already focused

      document.querySelectorAll('.widget-card').forEach(c => {
        const isMajor = c.dataset.major === 'true';
        c.classList.remove('is-focused');
        c.classList.add(isMajor ? 'is-restored' : 'is-minimized');
      });

      card.classList.remove('is-minimized', 'is-restored');
      card.classList.add('is-focused');
      focusedWidget = card;
    }

    document.body.onclick = (e) => {
      // Click background to reset all cards
      if (e.target === document.body || e.target.classList.contains('scroll-stack') || e.target.classList.contains('grain')) {
        document.querySelectorAll('.widget-card').forEach(c => {
          c.classList.remove('is-focused', 'is-minimized', 'is-restored');
        });
        focusedWidget = null;
      }
    };

    function refreshFocus() {
      const focusLine = document.getElementById('focusLine');
      const lines = (state.notes || '').split('\n');
      const focusMatch = lines.find(l => l.toLowerCase().startsWith('focus:')) || lines.find(l => l.trim().length > 0);
      focusLine.textContent = focusMatch ? focusMatch.replace(/^focus:\s*/i, '').trim() : "Choose one direction.";
    }

    // ── Theme Engine ──────────────────────────────────────────────
    function applyTemporalTheme() {
      const hour = new Date().getHours();
      const body = document.body;
      body.classList.remove('theme-morning', 'theme-afternoon', 'theme-evening', 'theme-midnight');

      if (hour >= 5 && hour < 12) body.classList.add('theme-morning');
      else if (hour >= 12 && hour < 17) body.classList.add('theme-afternoon');
      else if (hour >= 17 && hour < 21) body.classList.add('theme-evening');
      else body.classList.add('theme-midnight');
    }

    // ── Widgets ───────────────────────────────────────────────────
    function buildCommandCenter() {
      const card = makeCard('sage', '🎯', 'Directives', 'Command Center', true);
      const body = card.querySelector('.widget-inner');

      const textarea = document.createElement('textarea');
      textarea.className = 'input-field';
      textarea.value = state.notes;
      textarea.placeholder = "Focus: ...";

      const agendaContainer = el('div', 'agenda-mini-stack');
      state.agenda.forEach(entry => {
        const row = el('div', 'agenda-row-inline');
        row.innerHTML = `<span class="tiny-time">${entry.time}</span> <span class="tiny-text">${entry.item}</span>`;
        agendaContainer.appendChild(row);
      });

      const saveBar = el('div', 'notes-save-bar');
      const clearBtn = el('button', 'clear-btn', 'Clear Notes');
      clearBtn.onclick = () => {
        if(confirm('Clear notes?')) { textarea.value = ''; state.notes = ''; saveState(); refreshFocus(); }
      };
      saveBar.append(clearBtn);

      body.append(textarea, agendaContainer, saveBar);

      card.onclick = (e) => { if (e.target.tagName !== 'TEXTAREA') toggleFocus(card); };
      textarea.oninput = () => { state.notes = textarea.value; saveState(); refreshFocus(); };

      return card;
    }

    function buildUniversalPortal() {
      const card = makeCard('sun', '💠', 'Gateway', 'Portal', false);
      const body = card.querySelector('.widget-inner');
      let mode = 'search';

      const toggleRow = el('div', 'portal-toggle-row');
      toggleRow.innerHTML = `<button class="mode-btn active" id="btnSearch">Search</button><button class="mode-btn" id="btnAI">AI</button>`;

      const input = document.createElement('input');
      input.className = 'input-field portal-input';
      input.placeholder = 'Search the web...';
      input.type = 'text';

      const execute = () => {
        const q = input.value.trim();
        if (!q) return;
        const url = mode === 'search'
          ? `https://www.google.com/search?q=${encodeURIComponent(q)}`
          : `https://gemini.google.com/app?q=${encodeURIComponent(q)}`;
        window.open(url, '_blank');
        input.value = ''; // clear after execution
      };

      toggleRow.querySelector('#btnSearch').onclick = (e) => {
        mode = 'search'; input.placeholder = 'Search the web...';
        e.target.classList.add('active'); toggleRow.querySelector('#btnAI').classList.remove('active');
        input.focus();
      };
      toggleRow.querySelector('#btnAI').onclick = (e) => {
        mode = 'ai'; input.placeholder = 'Ask anything...';
        e.target.classList.add('active'); toggleRow.querySelector('#btnSearch').classList.remove('active');
        input.focus();
      };

      input.onkeydown = (e) => { if (e.key === 'Enter') execute(); };
      body.append(toggleRow, input);
      card.onclick = (e) => { if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') toggleFocus(card); };
      return card;
    }

    function buildWeather() {
      const card = makeCard('terra', '🌤', 'Atmosphere', 'Weather', true);
      const body = card.querySelector('.widget-inner');

      const hero = el('div', 'weather-hero');
      const tempEl = el('div', 'weather-temp', '—');
      const condEl = el('div', 'weather-condition', 'Detecting location...');
      hero.append(tempEl, condEl);

      const detailView = el('div', 'weather-details');
      detailView.style.display = 'none';

      card.onclick = () => {
        toggleFocus(card);
        detailView.style.display = card.classList.contains('is-focused') ? 'flex' : 'none';
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async pos => {
          try {
            const { latitude: lat, longitude: lon } = pos.coords;
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
            const res = await fetch(url);
            const data = await res.json();

            tempEl.textContent = `${Math.round(data.current.temperature_2m)}°`;
            condEl.textContent = "Current Conditions";

            let forecastHTML = '<div class="forecast-grid">';
            for(let i=1; i<4; i++) {
              forecastHTML += `<div class="forecast-day"><p class="eyebrow">${new Date(data.daily.time[i]).toLocaleDateString([], {weekday:'short'})}</p><p><strong>${Math.round(data.daily.temperature_2m_max[i])}°</strong></p></div>`;
            }
            forecastHTML += '</div>';

            detailView.innerHTML = `<div class="weather-stats"><span>Wind: ${data.current.wind_speed_10m} mph</span><span>Humidity: ${data.current.relative_humidity_2m}%</span></div>${forecastHTML}`;
          } catch (e) { console.error(e); condEl.textContent = 'Forecast offline'; }
        });
      }
      body.append(hero, detailView);
      return card;
    }

    function buildLinks() {
      const card = makeCard('sea', '🔗', 'Shortcuts', 'Quick Links', false);
      const body = card.querySelector('.widget-inner');
      const grid = el('div', 'links-grid');
      state.links.forEach(l => {
        const a = el('a', 'chip', l.n); a.href = l.u; a.target = "_blank"; grid.appendChild(a);
      });
      body.appendChild(grid);
      card.onclick = (e) => { if(e.target.tagName !== 'A') toggleFocus(card); };
      return card;
    }

    // ── Global Features ───────────────────────────────────────────
    let pmoSeconds = 1500;
    let pmoInterval = null;

    function updatePmoDisplay() {
      const m = Math.floor(pmoSeconds / 60); const s = pmoSeconds % 60;
      const str = `${m}:${s.toString().padStart(2, '0')}`;
      document.getElementById('pmoDisplay').textContent = str;
      document.title = pmoInterval ? `(${str}) Levi's Dashboard` : "Levi's Dashboard";
    }

    function togglePomodoro() {
      if (pmoInterval) { clearInterval(pmoInterval); pmoInterval = null; }
      else {
        pmoInterval = setInterval(() => {
          if (pmoSeconds > 0) { pmoSeconds--; updatePmoDisplay(); }
          else { clearInterval(pmoInterval); pmoInterval = null; alert("Session complete."); }
        }, 1000);
      }
      updatePmoDisplay();
    }

    function toggleZen() {
      document.body.classList.toggle('zen-active');
    }

    async function initRSS() {
      const ticker = document.getElementById('tickerContent');
      const list = document.getElementById('rssList');
      try {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://www.theverge.com/rss/index.xml`);
        const data = await res.json();

        ticker.innerHTML = data.items.map(item => `<span class="ticker-item">${item.title}</span>`).join('');
        list.innerHTML = data.items.map(item => `
          <div class="rss-article">
            <a href="${item.link}" target="_blank">${item.title}</a>
            <div class="rss-date">${new Date(item.pubDate).toLocaleDateString()}</div>
          </div>
        `).join('');
      } catch (e) { console.error(e); ticker.innerHTML = '<span class="ticker-item">Feed unavailable</span>'; }
    }

    // ── Boot ──────────────────────────────────────────────────────
    function boot() {
      applyTemporalTheme();
      setInterval(applyTemporalTheme, 60000); // Check theme every minute

      const now = new Date();
      document.getElementById('dateLabel').textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

      const hr = now.getHours();
      document.getElementById('greeting').textContent = hr < 12 ? "Good morning, Levi." : hr < 18 ? "Good afternoon." : "Good evening.";
      refreshFocus();

      const stack = document.getElementById('scrollStack');
      [buildCommandCenter(), buildWeather(), buildUniversalPortal(), buildLinks()].forEach(w => stack.appendChild(w));

      initRSS();

      // Footer expansion logic
      const footer = document.getElementById('rssFooter');
      footer.addEventListener('transitionend', () => {
        const isExp = footer.classList.contains('is-expanded');
        document.getElementById('scrollStack').style.opacity = isExp ? '0.1' : '1';
        document.getElementById('scrollStack').style.pointerEvents = isExp ? 'none' : 'all';
      });
    }

    boot();
