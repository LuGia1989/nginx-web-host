/* ============================================
   AI Command Center - Application Logic
   ============================================ */

(function () {
  'use strict';

  // ---- State ----
  let currentAppId = null;
  const appStates = {};   // { appId: "welcome" | "running" }
  const iframeCache = {}; // { appId: HTMLIFrameElement }
  let loadingTimerId = null;
  let loadingStartTime = null;
  let loadingAppId = null;
  const SLOW_THRESHOLD = 12; // seconds before showing "slow" warning

  // ---- DOM References ----
  const $ = (sel) => document.querySelector(sel);
  const portalTitle = $('#portal-title');
  const portalSubtitle = $('#portal-subtitle');
  const navList = $('#nav-list');
  const welcomeContainer = $('#welcome-container');
  const iframeContainer = $('#iframe-container');
  const loadingOverlay = $('#loading');
  const btnCollapse = $('#btn-collapse');
  const mobileHamburger = $('#mobile-hamburger');
  const mobileOverlay = $('#mobile-overlay');
  const sidebar = $('#sidebar');

  // ---- Initialize ----
  function init() {
    portalTitle.textContent = PORTAL_CONFIG.title;
    portalSubtitle.textContent = PORTAL_CONFIG.subtitle;
    document.title = PORTAL_CONFIG.title;

    PORTAL_CONFIG.apps.forEach((app) => {
      appStates[app.id] = 'welcome';
    });

    // Preload all app images into browser cache
    PORTAL_CONFIG.apps.forEach(function(app) {
      if (app.bgImage) { var i1 = new Image(); i1.src = app.bgImage; }
      if (app.screenImage) { var i2 = new Image(); i2.src = app.screenImage; }
    });

    renderSidebar();
    bindEvents();

    // Restore last tab or select first
    const lastTab = localStorage.getItem('portal-active-tab');
    const startApp = PORTAL_CONFIG.apps.find((a) => a.id === lastTab) || PORTAL_CONFIG.apps[0];
    if (startApp) selectApp(startApp.id);
  }

  // ---- Render Sidebar ----
  function renderSidebar() {
    navList.innerHTML = '';
    PORTAL_CONFIG.apps.forEach((app, index) => {
      const item = document.createElement('button');
      item.className = 'nav-item';
      item.setAttribute('role', 'tab');
      item.setAttribute('aria-selected', 'false');
      item.dataset.appId = app.id;
      item.style.setProperty('--app-color', app.color);
      item.innerHTML = `
        <span class="nav-icon">${app.logoImage ? `<img src="${app.logoImage}" alt="${app.name}" style="width:24px;height:24px;object-fit:contain;">` : app.icon}</span>
        <span class="nav-label">
          <span class="nav-name">${app.name}</span>
          <span class="nav-status">
            <span class="status-dot" id="status-${app.id}"></span>
            <span>Ready</span>
          </span>
        </span>
      `;
      item.addEventListener('click', () => selectApp(app.id));

      // Keyboard shortcut hint
      item.title = `${app.name} (${index + 1})`;
      navList.appendChild(item);
    });
  }

  // ---- Select App ----
  function selectApp(appId) {
    currentAppId = appId;
    localStorage.setItem('portal-active-tab', appId);

    // Always cancel any in-progress loading from previous tab
    hideLoading();

    // Update sidebar active state
    navList.querySelectorAll('.nav-item').forEach((item) => {
      const isActive = item.dataset.appId === appId;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', isActive);
    });

    const state = appStates[appId];
    if (state === 'running') {
      showIframe(appId);
    } else {
      showWelcomePage(appId);
    }

    // Close mobile sidebar
    closeMobileSidebar();
  }

  // ---- Welcome Page ----
  function showWelcomePage(appId) {
    var app = PORTAL_CONFIG.apps.find(function(a) { return a.id === appId; });
    if (!app) return;

    iframeContainer.classList.add('hidden');

    // Set background image on container
    if (app.bgImage) {
      welcomeContainer.style.backgroundImage = 'url(' + app.bgImage + ')';
      welcomeContainer.style.backgroundSize = 'cover';
      welcomeContainer.style.backgroundPosition = 'center';
      welcomeContainer.style.backgroundRepeat = 'no-repeat';
    } else {
      welcomeContainer.style.backgroundImage = 'none';
    }

    // Generate neuron SVG background for cards
    var neuronBg = generateNeuronCardBg(app);

    welcomeContainer.innerHTML = '<div style="'
      + 'position:relative;width:100%;height:100%;display:flex;'
      + 'padding:40px;gap:24px;align-items:center;'
      + 'background:rgba(10,14,23,0.6);overflow-y:auto;'
      + '">'
      // LEFT COLUMN - Card with neuron background
      + '<div style="'
      + 'flex:1;display:flex;flex-direction:column;align-items:center;'
      + 'justify-content:center;padding:30px;position:relative;overflow:hidden;'
      + 'background:#0a0f18;border-radius:16px;'
      + 'border:1px solid ' + hexToRgba(app.color, 0.25) + ';'
      + 'box-shadow:0 0 30px ' + hexToRgba(app.color, 0.06) + ';'
      + '">'
        + '<div style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.5;pointer-events:none;">' + neuronBg + '</div>'
        + '<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;">'
          + (app.screenImage
            ? '<div class="screen-' + (app.screenAnim || 'float') + '" style="width:100%;max-width:420px;margin-bottom:20px;border-radius:12px;overflow:hidden;position:relative;border:1px solid ' + hexToRgba(app.color, 0.3) + ';box-shadow:0 8px 40px ' + hexToRgba(app.color, 0.15) + ',0 0 60px ' + hexToRgba(app.color, 0.08) + ';"><img src="' + app.screenImage + '" alt="' + app.name + '" style="width:100%;display:block;"/>' + (app.screenAnim === 'scan' ? '<div class="screen-scan-line" style="--scan-color:' + app.color + ';"></div>' : '') + (app.screenAnim === 'drive' ? '<div class="screen-drive-car" style="--drive-color:' + app.color + ';"></div><div class="screen-drive-trail" style="--drive-color:' + app.color + ';"></div>' : '') + (app.screenAnim === 'walk' ? '<div class="screen-walk-figure" style="--walk-color:' + app.color + ';"></div><div class="screen-walk-figure screen-walk-figure-2" style="--walk-color:' + app.color + ';"></div><div class="screen-walk-shadow" style="--walk-color:' + app.color + ';"></div>' : '')
+ (app.screenAnim === 'typewriter' ? '<div class="screen-typewriter-bar" style="--typewriter-color:' + app.color + ';" data-text="&gt; Initializing multi-agent orchestration..."><div class="screen-typewriter-cursor" style="--typewriter-color:' + app.color + ';"></div></div>' : '') + '</div>'
            : '<div style="font-size:64px;margin-bottom:20px;">' + app.icon + '</div>')
          + '<div style="color:' + app.color + ';font-size:18px;font-weight:700;text-align:center;margin-bottom:20px;">' + app.name + '</div>'
          + '<button id="launch-btn" style="'
          + 'padding:14px 40px;font-size:16px;font-weight:600;color:#fff;'
          + 'background:linear-gradient(135deg,' + app.color + ',#7c3aed);'
          + 'border:none;border-radius:12px;cursor:pointer;letter-spacing:0.5px;'
          + 'box-shadow:0 4px 20px ' + hexToRgba(app.color, 0.3) + ';'
          + '">&#9654; Run Application</button>'
        + '</div>'
      + '</div>'
      // RIGHT COLUMN - Info with neuron background
      + '<div style="'
      + 'flex:1;padding:30px;position:relative;overflow:hidden;'
      + 'background:#080d15;border-radius:16px;'
      + 'border:1px solid ' + hexToRgba(app.color, 0.2) + ';'
      + 'box-shadow:0 0 30px ' + hexToRgba(app.color, 0.04) + ';'
      + '">'
        + '<div style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.35;pointer-events:none;">' + neuronBg + '</div>'
        + '<div style="position:relative;z-index:1;">'
          + '<div style="font-size:40px;margin-bottom:12px;">' + (app.logoImage ? '<img src="' + app.logoImage + '" alt="' + app.name + '" style="height:40px;object-fit:contain;">' : app.icon) + '</div>'
          + '<h2 style="font-size:28px;font-weight:700;color:#e8edf5;margin-bottom:16px;">' + app.name + '</h2>'
          + '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">'
            + (app.tags || []).map(function(t) {
              return '<span style="padding:4px 12px;font-size:12px;border-radius:20px;border:1px solid ' + hexToRgba(app.color, 0.4) + ';color:' + app.color + ';background:' + hexToRgba(app.color, 0.08) + ';">' + t + '</span>';
            }).join('')
          + '</div>'
          + '<p style="font-size:15px;line-height:1.7;color:#94a3b8;margin-bottom:24px;">' + app.description + '</p>'
          + (app.version ? '<div style="border-top:1px solid #1e293b;padding-top:16px;font-size:13px;color:#94a3b8;">Version: <span style="color:#e8edf5;">' + app.version + '</span></div>' : '')
        + '</div>'
      + '</div>'
    + '</div>';

    document.getElementById('launch-btn').addEventListener('click', function() { launchApp(appId); });
  }

  // ---- Generate neuron network SVG for card backgrounds ----
  function generateNeuronCardBg(app) {
    var color = app.color || '#00d4ff';
    var r = parseInt(color.slice(1, 3), 16);
    var g = parseInt(color.slice(3, 5), 16);
    var b = parseInt(color.slice(5, 7), 16);
    var seed = hashString(app.id + '-card');

    // Random nodes
    var nodes = [];
    for (var i = 0; i < 18; i++) {
      nodes.push({
        x: pseudoRandom(seed + i * 7) * 500,
        y: pseudoRandom(seed + i * 13) * 400
      });
    }

    // Connect nearby nodes
    var lines = [];
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x;
        var dy = nodes[i].y - nodes[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          lines.push({ from: nodes[i], to: nodes[j], op: (1 - dist / 180) * 0.5 });
        }
      }
    }

    return '<svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;">'
      + '<defs><radialGradient id="ng-' + app.id + '" cx="50%" cy="50%" r="60%">'
      + '<stop offset="0%" stop-color="rgba(' + r + ',' + g + ',' + b + ',0.1)"/>'
      + '<stop offset="100%" stop-color="transparent"/>'
      + '</radialGradient></defs>'
      + '<rect width="500" height="400" fill="url(#ng-' + app.id + ')"/>'
      + lines.map(function(l) {
        return '<line x1="' + l.from.x.toFixed(0) + '" y1="' + l.from.y.toFixed(0)
          + '" x2="' + l.to.x.toFixed(0) + '" y2="' + l.to.y.toFixed(0)
          + '" stroke="rgba(' + r + ',' + g + ',' + b + ',' + l.op.toFixed(2) + ')" stroke-width="1"/>';
      }).join('')
      + nodes.map(function(n, i) {
        var sz = i < 5 ? 4 : 2.5;
        var op = i < 5 ? 0.7 : 0.35;
        return '<circle cx="' + n.x.toFixed(0) + '" cy="' + n.y.toFixed(0)
          + '" r="' + sz + '" fill="rgba(' + r + ',' + g + ',' + b + ',' + op + ')"/>';
      }).join('')
      + '<circle cx="250" cy="200" r="60" fill="none" stroke="rgba(' + r + ',' + g + ',' + b + ',0.08)" stroke-width="1" stroke-dasharray="4,8"/>'
      + '<circle cx="250" cy="200" r="120" fill="none" stroke="rgba(' + r + ',' + g + ',' + b + ',0.04)" stroke-width="0.5" stroke-dasharray="3,10"/>'
      + '</svg>';
  }

  // ---- Launch App (iframe) ----
  function launchApp(appId) {
    const app = PORTAL_CONFIG.apps.find((a) => a.id === appId);
    if (!app) return;

    appStates[appId] = 'running';
    welcomeContainer.innerHTML = '';
    welcomeContainer.style.backgroundImage = 'none';

    // If iframe already exists and loaded, show it instantly (no loading screen)
    if (iframeCache[appId]) {
      showIframe(appId);
      return;
    }

    // First time: show loading and create iframe
    showLoading(app);
    createIframeWrapper(app);
    showIframe(appId);
  }

  // ---- Create iframe wrapper ----
  function createIframeWrapper(app) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width:100%;height:100%;display:none;position:relative;';
    wrapper.dataset.appId = app.id;

    const iframe = document.createElement('iframe');
    iframe.src = app.url;
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen');
    iframe.title = app.name;

    iframe.addEventListener('load', () => {
      if (loadingAppId === app.id) {
        hideLoading();
      }
      updateStatus(app.id, 'online');
    });

    iframe.addEventListener('error', () => {
      if (loadingAppId === app.id) {
        setLoadingStatus('Connection failed');
        showSlowWarning();
      }
      updateStatus(app.id, 'offline');
    });

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'iframe-back-btn';
    if (app.id === 'chat-assistant') backBtn.style.top = '54px';
    backBtn.innerHTML = '&#8592;&nbsp; Back to Overview';
    backBtn.addEventListener('click', () => backToOverview(app.id));

    // Open in new tab
    const newTabBtn = document.createElement('a');
    newTabBtn.className = 'iframe-newtab-btn';
    newTabBtn.href = app.url;
    newTabBtn.target = '_blank';
    newTabBtn.rel = 'noopener noreferrer';
    newTabBtn.innerHTML = '&#8599;&nbsp; Open in New Tab';
    if (app.id === 'chat-assistant') newTabBtn.style.top = '54px';

    wrapper.appendChild(backBtn);
    wrapper.appendChild(newTabBtn);
    wrapper.appendChild(iframe);
    iframeContainer.appendChild(wrapper);
    iframeCache[app.id] = wrapper;
  }

  // ---- Retry loading ----
  function retryApp(appId) {
    const app = PORTAL_CONFIG.apps.find((a) => a.id === appId);
    if (!app) return;

    // Destroy old iframe and create fresh one
    if (iframeCache[appId]) {
      iframeCache[appId].remove();
      delete iframeCache[appId];
    }

    showLoading(app);
    createIframeWrapper(app);
    showIframe(appId);
  }

  // ---- Show Iframe ----
  function showIframe(appId) {
    welcomeContainer.innerHTML = '';
    welcomeContainer.style.backgroundImage = 'none';
    iframeContainer.classList.remove('hidden');

    // Hide all iframe wrappers, show the active one
    iframeContainer.querySelectorAll('[data-app-id]').forEach((el) => {
      el.style.display = el.dataset.appId === appId ? 'block' : 'none';
    });

    // Check if this iframe is already loaded
    if (iframeCache[appId]) {
      const iframe = iframeCache[appId].querySelector('iframe');
      if (iframe) {
        let isLoaded = false;
        try {
          // Cross-origin iframes throw on contentDocument access -- that's fine,
          // it means the iframe loaded something from the remote origin
          const doc = iframe.contentDocument;
          if (doc && doc.readyState === 'complete' && doc.URL !== 'about:blank') {
            isLoaded = true;
          }
        } catch (e) {
          // Cross-origin: iframe loaded successfully
          isLoaded = true;
          updateStatus(appId, 'online');
        }

        if (isLoaded) {
          // Already loaded -- show instantly, no loading screen
          hideLoading();
        }
        // If not loaded yet, loading overlay stays from launchApp()
      }
    }
  }

  // ---- Back to Overview ----
  function backToOverview(appId) {
    appStates[appId] = 'welcome';
    iframeContainer.classList.add('hidden');
    hideLoading();
    showWelcomePage(appId);
  }

  // ---- Loading helpers ----
  function showLoading(app) {
    loadingAppId = app.id;
    loadingStartTime = Date.now();

    // Populate loading UI
    const icon = document.getElementById('loading-icon');
    const name = document.getElementById('loading-app-name');
    const status = document.getElementById('loading-status');
    const timer = document.getElementById('loading-timer');
    const slow = document.getElementById('loading-slow');
    const btnRetry = document.getElementById('loading-btn-retry');
    const btnNewTab = document.getElementById('loading-btn-newtab');
    const btnCancel = document.getElementById('loading-btn-cancel');

    icon.innerHTML = app.logoImage ? '<img src="' + app.logoImage + '" alt="' + app.name + '" style="height:40px;object-fit:contain;">' : app.icon;
    name.textContent = app.name;
    status.textContent = 'Connecting...';
    timer.textContent = '0s';
    slow.classList.remove('visible');
    loadingOverlay.style.setProperty('--loading-color', app.color);
    loadingOverlay.classList.remove('hidden');

    // Wire up buttons
    btnRetry.onclick = () => retryApp(app.id);
    btnNewTab.href = app.url;
    btnCancel.onclick = () => {
      hideLoading();
      backToOverview(app.id);
    };

    // Start elapsed timer
    clearInterval(loadingTimerId);
    loadingTimerId = setInterval(() => {
      if (!loadingStartTime) return;
      const elapsed = Math.floor((Date.now() - loadingStartTime) / 1000);
      timer.textContent = elapsed + 's';

      // Update status text as time progresses
      if (elapsed < 5) {
        status.textContent = 'Connecting...';
      } else if (elapsed < SLOW_THRESHOLD) {
        status.textContent = 'Still loading...';
      } else {
        status.textContent = 'Application is slow to respond';
        showSlowWarning();
      }
    }, 1000);
  }

  function hideLoading() {
    loadingOverlay.classList.add('hidden');
    loadingAppId = null;
    loadingStartTime = null;
    clearInterval(loadingTimerId);
    loadingTimerId = null;
  }

  function setLoadingStatus(text) {
    const status = document.getElementById('loading-status');
    if (status) status.textContent = text;
  }

  function showSlowWarning() {
    const slow = document.getElementById('loading-slow');
    if (slow) slow.classList.add('visible');
  }

  // ---- Update Status ----
  function updateStatus(appId, status) {
    const dot = document.getElementById(`status-${appId}`);
    if (dot) {
      dot.className = `status-dot ${status}`;
      const label = dot.nextElementSibling;
      if (label) label.textContent = status === 'online' ? 'Running' : status === 'offline' ? 'Error' : 'Ready';
    }
    const welcomeDot = document.getElementById(`welcome-status-${appId}`);
    if (welcomeDot) {
      welcomeDot.className = `status-dot ${status}`;
    }
  }

  // ---- Sidebar Collapse ----
  function toggleSidebar() {
    document.body.classList.toggle('sidebar-collapsed');
    const collapsed = document.body.classList.contains('sidebar-collapsed');
    btnCollapse.innerHTML = collapsed ? '&#8250;' : '&#8249;';
    localStorage.setItem('portal-sidebar-collapsed', collapsed);
  }

  // ---- Mobile Sidebar ----
  function openMobileSidebar() {
    sidebar.classList.add('mobile-open');
    mobileOverlay.classList.add('visible');
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('mobile-open');
    mobileOverlay.classList.remove('visible');
  }

  // ---- Bind Events ----
  function bindEvents() {
    btnCollapse.addEventListener('click', toggleSidebar);

    if (mobileHamburger) {
      mobileHamburger.addEventListener('click', openMobileSidebar);
    }
    if (mobileOverlay) {
      mobileOverlay.addEventListener('click', closeMobileSidebar);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Don't trigger if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= PORTAL_CONFIG.apps.length) {
        selectApp(PORTAL_CONFIG.apps[num - 1].id);
        return;
      }

      if (e.key === '[') {
        toggleSidebar();
      }
    });

    // Restore sidebar state
    if (localStorage.getItem('portal-sidebar-collapsed') === 'true') {
      document.body.classList.add('sidebar-collapsed');
      btnCollapse.innerHTML = '&#8250;';
    }
  }

  // ---- Generate Full-Page Background SVG ----
  function generateFullBackgroundSVG(app) {
    const color = app.color || '#00d4ff';
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const seed = hashString(app.id + '-bg');

    // Generate 40 neural network nodes across the viewport
    const nodes = [];
    for (let i = 0; i < 40; i++) {
      nodes.push({
        x: pseudoRandom(seed + i * 11) * 1920,
        y: pseudoRandom(seed + i * 17) * 1080,
        size: 2 + pseudoRandom(seed + i * 23) * 5
      });
    }

    // Connect nearby nodes with visible lines
    const lines = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 450) {
          lines.push({ from: nodes[i], to: nodes[j], opacity: (1 - dist / 450) * 0.45 });
        }
      }
    }

    // Circuit traces along edges
    const traces = [];
    for (let i = 0; i < 10; i++) {
      const startX = pseudoRandom(seed + i * 31) < 0.5 ? 0 : 1920;
      const startY = pseudoRandom(seed + i * 37) * 1080;
      const midX = startX === 0 ? 80 + pseudoRandom(seed + i * 41) * 400 : 1920 - 80 - pseudoRandom(seed + i * 41) * 400;
      const midY = startY + (pseudoRandom(seed + i * 43) - 0.5) * 100;
      const endX = startX === 0 ? midX + 150 + pseudoRandom(seed + i * 47) * 300 : midX - 150 - pseudoRandom(seed + i * 47) * 300;
      traces.push({ x1: startX, y1: startY, mx: midX, my: midY, x2: endX, y2: midY });
    }

    // Data flow curves
    const curves = [];
    for (let i = 0; i < 4; i++) {
      const y = 150 + pseudoRandom(seed + i * 51) * 780;
      const cp1y = y + (pseudoRandom(seed + i * 53) - 0.5) * 200;
      const cp2y = y + (pseudoRandom(seed + i * 57) - 0.5) * 200;
      curves.push({ y, cp1y, cp2y });
    }

    return `<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%">
      <defs>
        <radialGradient id="fbg1-${app.id}" cx="25%" cy="35%" r="55%">
          <stop offset="0%" stop-color="rgba(${r},${g},${b},0.12)"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
        <radialGradient id="fbg2-${app.id}" cx="75%" cy="65%" r="50%">
          <stop offset="0%" stop-color="rgba(${r},${g},${b},0.08)"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
        <radialGradient id="fbg3-${app.id}" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="rgba(${r},${g},${b},0.05)"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
        <filter id="fbglow-${app.id}">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4"/>
        </filter>
        <filter id="fbglowLg-${app.id}">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15"/>
        </filter>
      </defs>

      <!-- Dark base background -->
      <rect width="1920" height="1080" fill="#080c14"/>

      <!-- Colored ambient glows -->
      <rect width="1920" height="1080" fill="url(#fbg1-${app.id})"/>
      <rect width="1920" height="1080" fill="url(#fbg2-${app.id})"/>
      <rect width="1920" height="1080" fill="url(#fbg3-${app.id})"/>

      <!-- Grid pattern -->
      <g opacity="0.12">
        ${Array.from({ length: 25 }, (_, i) =>
          `<line x1="${i * 80}" y1="0" x2="${i * 80}" y2="1080" stroke="rgba(${r},${g},${b},0.3)" stroke-width="0.5"/>`
        ).join('')}
        ${Array.from({ length: 14 }, (_, i) =>
          `<line x1="0" y1="${i * 80}" x2="1920" y2="${i * 80}" stroke="rgba(${r},${g},${b},0.3)" stroke-width="0.5"/>`
        ).join('')}
      </g>

      <!-- Large glow orbs -->
      <circle cx="400" cy="350" r="200" fill="rgba(${r},${g},${b},0.04)" filter="url(#fbglowLg-${app.id})"/>
      <circle cx="1500" cy="700" r="250" fill="rgba(${r},${g},${b},0.035)" filter="url(#fbglowLg-${app.id})"/>
      <circle cx="960" cy="540" r="180" fill="rgba(${r},${g},${b},0.03)" filter="url(#fbglowLg-${app.id})"/>

      <!-- Neural network connection lines -->
      ${lines.map((l) =>
        `<line x1="${l.from.x.toFixed(0)}" y1="${l.from.y.toFixed(0)}" x2="${l.to.x.toFixed(0)}" y2="${l.to.y.toFixed(0)}" stroke="rgba(${r},${g},${b},${l.opacity.toFixed(2)})" stroke-width="1"/>`
      ).join('')}

      <!-- Neural nodes with glow -->
      ${nodes.map((n, i) => `
        <circle cx="${n.x.toFixed(0)}" cy="${n.y.toFixed(0)}" r="${(n.size * 1.8).toFixed(1)}" fill="rgba(${r},${g},${b},0.15)" filter="url(#fbglow-${app.id})"/>
        <circle cx="${n.x.toFixed(0)}" cy="${n.y.toFixed(0)}" r="${n.size.toFixed(1)}" fill="rgba(${r},${g},${b},${i < 10 ? 0.7 : 0.4})"/>
        ${n.size > 4 ? `<circle cx="${n.x.toFixed(0)}" cy="${n.y.toFixed(0)}" r="${(n.size * 0.4).toFixed(1)}" fill="rgba(255,255,255,0.5)"/>` : ''}
      `).join('')}

      <!-- Circuit board traces -->
      ${traces.map((t) =>
        `<path d="M${t.x1.toFixed(0)},${t.y1.toFixed(0)} L${t.mx.toFixed(0)},${t.my.toFixed(0)} L${t.x2.toFixed(0)},${t.y2.toFixed(0)}" stroke="rgba(${r},${g},${b},0.25)" stroke-width="1.2" fill="none"/>
         <circle cx="${t.mx.toFixed(0)}" cy="${t.my.toFixed(0)}" r="4" fill="rgba(${r},${g},${b},0.5)"/>
         <circle cx="${t.mx.toFixed(0)}" cy="${t.my.toFixed(0)}" r="2" fill="rgba(255,255,255,0.4)"/>`
      ).join('')}

      <!-- Data flow curves -->
      ${curves.map((c) =>
        `<path d="M0,${c.y.toFixed(0)} Q480,${c.cp1y.toFixed(0)} 960,${c.y.toFixed(0)} Q1440,${c.cp2y.toFixed(0)} 1920,${c.y.toFixed(0)}" stroke="rgba(${r},${g},${b},0.08)" stroke-width="1" fill="none"/>`
      ).join('')}

      <!-- Concentric rings at center -->
      <circle cx="960" cy="540" r="120" fill="none" stroke="rgba(${r},${g},${b},0.1)" stroke-width="1" stroke-dasharray="8,12"/>
      <circle cx="960" cy="540" r="220" fill="none" stroke="rgba(${r},${g},${b},0.06)" stroke-width="0.8" stroke-dasharray="6,16"/>
      <circle cx="960" cy="540" r="320" fill="none" stroke="rgba(${r},${g},${b},0.04)" stroke-width="0.6" stroke-dasharray="5,20"/>

      <!-- Corner bracket decorations -->
      <g opacity="0.4">
        <path d="M25,25 L100,25 M25,25 L25,100" stroke="rgba(${r},${g},${b},0.6)" stroke-width="1.5" fill="none"/>
        <path d="M1895,25 L1820,25 M1895,25 L1895,100" stroke="rgba(${r},${g},${b},0.6)" stroke-width="1.5" fill="none"/>
        <path d="M25,1055 L100,1055 M25,1055 L25,980" stroke="rgba(${r},${g},${b},0.6)" stroke-width="1.5" fill="none"/>
        <path d="M1895,1055 L1820,1055 M1895,1055 L1895,980" stroke="rgba(${r},${g},${b},0.6)" stroke-width="1.5" fill="none"/>
        <circle cx="25" cy="25" r="3" fill="rgba(${r},${g},${b},0.8)"/>
        <circle cx="1895" cy="25" r="3" fill="rgba(${r},${g},${b},0.8)"/>
        <circle cx="25" cy="1055" r="3" fill="rgba(${r},${g},${b},0.8)"/>
        <circle cx="1895" cy="1055" r="3" fill="rgba(${r},${g},${b},0.8)"/>
      </g>

      <!-- Floating particles with varied sizes -->
      ${Array.from({ length: 30 }, (_, i) =>
        `<circle cx="${(pseudoRandom(seed + i * 71) * 1920).toFixed(0)}" cy="${(pseudoRandom(seed + i * 73) * 1080).toFixed(0)}" r="${(1 + pseudoRandom(seed + i * 79) * 2).toFixed(1)}" fill="rgba(${r},${g},${b},${(0.25 + pseudoRandom(seed + i * 83) * 0.35).toFixed(2)})"/>`
      ).join('')}

      <!-- Binary data text (faint) -->
      <g opacity="0.06" font-family="monospace" font-size="11" fill="rgba(${r},${g},${b},1)">
        <text x="60" y="80">01101001 10110100</text>
        <text x="1680" y="120">11001010 01010111</text>
        <text x="60" y="1020">01110011 10001101</text>
        <text x="1680" y="980">11010110 01001011</text>
      </g>
    </svg>`;
  }

  // ---- Generate Placeholder SVG ----
  function generatePlaceholderSVG(app) {
    const color = app.color || '#00d4ff';
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    // Generate deterministic "random" positions based on app id
    const seed = hashString(app.id);
    const nodes = [];
    for (let i = 0; i < 12; i++) {
      nodes.push({
        x: 40 + pseudoRandom(seed + i * 7) * 720,
        y: 30 + pseudoRandom(seed + i * 13) * 390
      });
    }

    const lines = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          lines.push({ from: nodes[i], to: nodes[j], opacity: (1 - dist / 250) * 0.4 });
        }
      }
    }

    return `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-${app.id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a0e17"/>
          <stop offset="50%" stop-color="rgba(${r},${g},${b},0.08)"/>
          <stop offset="100%" stop-color="#0a0e17"/>
        </linearGradient>
        <radialGradient id="glow-${app.id}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(${r},${g},${b},0.15)"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
        <filter id="blur-${app.id}">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="800" height="500" fill="url(#bg-${app.id})"/>
      <rect width="800" height="500" fill="url(#glow-${app.id})"/>

      <!-- Grid lines -->
      ${Array.from({ length: 15 }, (_, i) =>
        `<line x1="${i * 55 + 20}" y1="0" x2="${i * 55 + 20}" y2="500" stroke="rgba(${r},${g},${b},0.04)" stroke-width="1"/>`
      ).join('')}
      ${Array.from({ length: 10 }, (_, i) =>
        `<line x1="0" y1="${i * 55 + 20}" x2="800" y2="${i * 55 + 20}" stroke="rgba(${r},${g},${b},0.04)" stroke-width="1"/>`
      ).join('')}

      <!-- Neural network lines -->
      ${lines.map((l) =>
        `<line x1="${l.from.x}" y1="${l.from.y}" x2="${l.to.x}" y2="${l.to.y}" stroke="rgba(${r},${g},${b},${l.opacity})" stroke-width="1"/>`
      ).join('')}

      <!-- Nodes -->
      ${nodes.map((n, i) => `
        <circle cx="${n.x}" cy="${n.y}" r="${i < 4 ? 5 : 3}" fill="rgba(${r},${g},${b},${i < 4 ? 0.7 : 0.3})" filter="url(#blur-${app.id})"/>
        <circle cx="${n.x}" cy="${n.y}" r="${i < 4 ? 3 : 2}" fill="rgba(${r},${g},${b},${i < 4 ? 0.9 : 0.5})"/>
      `).join('')}

      <!-- Center circle -->
      <circle cx="400" cy="230" r="45" fill="none" stroke="rgba(${r},${g},${b},0.2)" stroke-width="1.5"/>
      <circle cx="400" cy="230" r="25" fill="none" stroke="rgba(${r},${g},${b},0.3)" stroke-width="1"/>
      <circle cx="400" cy="230" r="8" fill="rgba(${r},${g},${b},0.6)"/>

      <!-- App icon text -->
      <text x="400" y="240" text-anchor="middle" font-size="30" fill="white" opacity="0.9">${app.icon}</text>

      <!-- App name -->
      <text x="400" y="330" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="22" font-weight="700" fill="rgba(${r},${g},${b},0.8)">
        ${app.name}
      </text>
      <text x="400" y="355" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="12" fill="rgba(255,255,255,0.3)" letter-spacing="3" text-transform="uppercase">
        ${(app.tags || []).join(' \u00B7 ')}
      </text>

      <!-- Corner decorations -->
      <path d="M20,20 L60,20 M20,20 L20,60" stroke="rgba(${r},${g},${b},0.3)" stroke-width="1.5" fill="none"/>
      <path d="M780,20 L740,20 M780,20 L780,60" stroke="rgba(${r},${g},${b},0.3)" stroke-width="1.5" fill="none"/>
      <path d="M20,480 L60,480 M20,480 L20,440" stroke="rgba(${r},${g},${b},0.3)" stroke-width="1.5" fill="none"/>
      <path d="M780,480 L740,480 M780,480 L780,440" stroke="rgba(${r},${g},${b},0.3)" stroke-width="1.5" fill="none"/>
    </svg>`;
  }

  // ---- Utility: hash string to number ----
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // ---- Utility: pseudo-random 0-1 from seed ----
  function pseudoRandom(seed) {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  }

  // ---- Utility: hex to rgba ----
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ---- Start ----
  document.addEventListener('DOMContentLoaded', init);
})();
