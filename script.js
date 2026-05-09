'use strict';

/* ── Technology definitions ──────────────────────── */
const TECH_PRESETS = {
  A: {
    'Li-Ion': {
      energy_mwh: 1000, power_mw: 100,
      capex_power_eur_per_mw:   318_160,
      capex_energy_eur_per_mwh: 325_740,
      opex_fixed: 8_952_000,
      degradation: 0.02,
    },
    'Redox-Flow': {
      energy_mwh: 1000, power_mw: 100,
      capex_power_eur_per_mw:   0,
      capex_energy_eur_per_mwh: 353_045,
      opex_fixed: 9_500_000,
      degradation: 0.005,
    },
  },
  B: {
    'Li-Ion': {
      energy_mwh: 1000, power_mw: 100,
      capex_power_eur_per_mw:   318_160,
      capex_energy_eur_per_mwh: 325_740,
      opex_fixed: 8_952_000,
      degradation: 0.02,
    },
    'Redox-Flow': {
      energy_mwh: 1000, power_mw: 100,
      capex_power_eur_per_mw:   0,
      capex_energy_eur_per_mwh: 353_045,
      opex_fixed: 9_500_000,
      degradation: 0.005,
    },
  },
  C: {
    'Li-Ion': {
      energy_mwh: 1000, power_mw: 100,
      capex_power_eur_per_mw:   289_065,
      capex_energy_eur_per_mwh: 221_197,
      opex_fixed: 6_360_000,
      degradation: 0.02,
    },
    'Redox-Flow': {
      energy_mwh: 1000, power_mw: 100,
      capex_power_eur_per_mw:   109_724,
      capex_energy_eur_per_mwh: 281_680,
      opex_fixed: 8_000_000,
      degradation: 0.005,
    },
  },
};

const SCENARIO_LABELS = {
  A: 'Szenario A: Status quo',
  B: 'Szenario B: Reform (ohne §118)',
  C: 'Szenario C: Zukunftsmarkt 2030',
};

const SCENARIO_DEFAULTS = {
  A: { net: 1.0, spread: 60, wacc: 0.07, tax: 0.30, grid_fee: 15, sub: 0,
       liion: { cyc: 300, eff: 0.86, lifetime: 12 },
       rf:    { cyc: 250, eff: 0.75, lifetime: 15 } },
  B: { net: 0.0, spread: 60, wacc: 0.07, tax: 0.30, grid_fee: 15, sub: 0,
       liion: { cyc: 300, eff: 0.86, lifetime: 12 },
       rf:    { cyc: 250, eff: 0.75, lifetime: 15 } },
  C: { net: 0.0, spread: 80, wacc: 0.07, tax: 0.30, grid_fee: 20, sub: 0,
       liion: { cyc: 350, eff: 0.90, lifetime: 15 },
       rf:    { cyc: 350, eff: 0.82, lifetime: 20 } },
};

const LIT_NOTES = {
  A: {
    net:      'Lit: 1.0 (§118 EnWG, Status quo)',
    spread:   'Lit: 60 €/MWh (Aurora/Agora 2025)',
    sub:      'Lit: 0 €/MWh (kein Standardwert)',
    wacc:     'Lit: 0.07 (Branchenüblich, 7%)',
    tax:      'Lit: 0.30 (KStG §23, Deutschland)',
    grid_fee: 'Lit: 15 €/MWh (BNetzA 2024)',
    liion:    { cyc: 'Lit: 300/a (SMARD 2023–25)', eff: 'Lit: 0.86 (Sudiarto et al. 2026)', lifetime: 'Lit: 12a (Mongird et al. 2020)' },
    rf:       { cyc: 'Lit: 250/a (SMARD 2023–25)', eff: 'Lit: 0.75 (Sudiarto et al. 2026)', lifetime: 'Lit: 15a (Mongird et al. 2020)' },
  },
  B: {
    net:      'Lit: 0.0 (§118 EnWG Reform, BNetzA 2025)',
    spread:   'Lit: 60 €/MWh (Aurora/Agora 2025)',
    sub:      'Lit: 0 €/MWh (kein Standardwert)',
    wacc:     'Lit: 0.07 (Branchenüblich, 7%)',
    tax:      'Lit: 0.30 (KStG §23, Deutschland)',
    grid_fee: 'Lit: 15 €/MWh (BNetzA 2024)',
    liion:    { cyc: 'Lit: 300/a (SMARD 2023–25)', eff: 'Lit: 0.86 (Sudiarto et al. 2026)', lifetime: 'Lit: 12a (Mongird et al. 2020)' },
    rf:       { cyc: 'Lit: 250/a (SMARD 2023–25)', eff: 'Lit: 0.75 (Sudiarto et al. 2026)', lifetime: 'Lit: 15a (Mongird et al. 2020)' },
  },
  C: {
    net:      'Lit: 0.0 (§118 Reform)',
    spread:   'Lit: 80 €/MWh (Aurora Energy Research 2025)',
    sub:      'Lit: 0 €/MWh (kein Standardwert)',
    wacc:     'Lit: 0.07 (Branchenüblich, 7%)',
    tax:      'Lit: 0.30 (KStG §23, Deutschland)',
    grid_fee: 'Lit: 20 €/MWh (BNetzA Prognose 2030)',
    liion:    { cyc: 'Lit: 350/a (Agora 2030-Prognose)', eff: 'Lit: 0.90 (Projektion 2030, Sudiarto et al. 2026)', lifetime: 'Lit: 15a (NREL ATB 2024)' },
    rf:       { cyc: 'Lit: 350/a (Agora 2030-Prognose)', eff: 'Lit: 0.82 (Projektion 2030, Sprenkle et al. 2023)', lifetime: 'Lit: 20a (Sprenkle et al. 2023)' },
  },
};

/* ── State ───────────────────────────────────────── */
let activeScenario = 'A';
let activeTech     = 'Li-Ion';
let chart          = null;

/* ── Calculations ────────────────────────────────── */
function getCapex(scenario, tech) {
  const t = TECH_PRESETS[scenario][tech];
  return t.capex_power_eur_per_mw * t.power_mw + t.capex_energy_eur_per_mwh * t.energy_mwh;
}

function computeCumCf(capex, annual_cf, lifetime, wacc, degradation) {
  const years  = [0];
  const cum_cf = [-capex];
  let payback  = null;

  for (let t = 1; t <= lifetime; t++) {
    const degraded   = annual_cf * Math.pow(1 - degradation, t - 1);
    const discounted = degraded  / Math.pow(1 + wacc, t);
    cum_cf.push(cum_cf[t - 1] + discounted);
    years.push(t);
    if (payback === null && cum_cf[t] >= 0) {
      const frac = -cum_cf[t - 1] / (cum_cf[t] - cum_cf[t - 1]);
      payback = (t - 1) + frac;
    }
  }
  return { years, cum_cf, payback };
}

function calcLCOS(capex, opex_fixed, energy_mwh, cyc, lifetime, wacc, degradation) {
  let pv_costs  = capex;
  let pv_energy = 0;
  for (let t = 1; t <= lifetime; t++) {
    pv_costs  += opex_fixed / Math.pow(1 + wacc, t);
    pv_energy += cyc * energy_mwh * Math.pow(1 - degradation, t - 1) / Math.pow(1 + wacc, t);
  }
  return pv_energy > 0 ? pv_costs / pv_energy : Infinity;
}

function calcBreakEvenSpread(capex, opex_fixed, energy_mwh, cyc, eff, net, grid_fee, sub_abs, tax, lifetime, wacc, degradation) {
  const grid_fixed = net * grid_fee * energy_mwh * cyc;
  for (let s = 1; s <= 600; s++) {
    const arb  = cyc * energy_mwh * s * eff;
    const cf   = (arb + grid_fixed + sub_abs - opex_fixed) * (1 - tax);
    const { cum_cf } = computeCumCf(capex, cf, lifetime, wacc, degradation);
    if (cum_cf[cum_cf.length - 1] >= 0) return s;
  }
  return '>600';
}

function calculate(params) {
  const { tech, net, spread, sub, cyc, wacc, tax, grid_fee, eff, lifetime } = params;
  const techData    = TECH_PRESETS[activeScenario][tech];
  const energy_mwh  = techData.energy_mwh;
  const degradation = techData.degradation;
  const opex_fixed  = techData.opex_fixed;
  const capex_total = getCapex(activeScenario, tech);

  const sub_abs          = sub * energy_mwh;
  const arbitrage_gross  = cyc * energy_mwh * spread * eff;
  const grid_gross       = net * grid_fee * energy_mwh * cyc;
  const arb_after_tax    = arbitrage_gross * (1 - tax);
  const grid_after_tax   = grid_gross * (1 - tax);
  const opex_after_tax   = opex_fixed * (1 - tax);
  const sub_after_tax    = sub_abs * (1 - tax);
  const annual_cf        = arb_after_tax + grid_after_tax - opex_after_tax + sub_after_tax;

  const { years, cum_cf, payback } = computeCumCf(capex_total, annual_cf, lifetime, wacc, degradation);
  const lcos        = calcLCOS(capex_total, opex_fixed, energy_mwh, cyc, lifetime, wacc, degradation);
  const be_spread   = calcBreakEvenSpread(capex_total, opex_fixed, energy_mwh, cyc, eff, net, grid_fee, sub_abs, tax, lifetime, wacc, degradation);

  // Extrapolation if not paid back within lifetime
  let extraYears   = null;
  let totalYears   = null;
  let paybackStr   = '';
  if (payback !== null) {
    paybackStr = `${payback.toFixed(1)} Jahre`;
  } else {
    const last_cum = cum_cf[cum_cf.length - 1];
    const last_cf  = annual_cf * Math.pow(1 - degradation, lifetime) / Math.pow(1 + wacc, lifetime);
    if (last_cf > 0 && last_cum < 0) {
      extraYears = -last_cum / last_cf;
      totalYears = lifetime + extraYears;
      paybackStr = `~${Math.round(totalYears)} Jahre (extrapoliert)`;
    } else {
      paybackStr = 'nie wirtschaftlich';
    }
  }

  const npv = cum_cf[cum_cf.length - 1];

  return {
    capex_total, opex_fixed, annual_cf,
    arb_after_tax, grid_after_tax, opex_after_tax, sub_after_tax,
    payback, paybackStr, npv, lcos, be_spread,
    years, cum_cf, extraYears, totalYears,
    degradation, energy_mwh,
  };
}

/* ── Formatting helpers ──────────────────────────── */
const fmt1  = v => v.toFixed(1);
const fmt2  = v => v.toFixed(2);
const fmtM  = v => (v / 1e6).toFixed(2) + ' Mio€';
const fmtM1 = v => (v / 1e6).toFixed(1) + ' Mio€';
const sign  = v => v >= 0 ? '+' : '';

/* ── Render results card ─────────────────────────── */
function renderResults(r, params) {
  const { tech, lifetime } = params;
  const color = tech === 'Li-Ion' ? '#1e6fff' : '#00b87a';
  const npvM  = r.npv / 1e6;

  let statusColor, statusText;
  if (npvM > 0) {
    statusColor = '#16a34a'; statusText = '✅ Wirtschaftlich — Projekt rentabel innerhalb der Lebensdauer';
  } else if (npvM > -100) {
    statusColor = '#d97706'; statusText = '⚠️ Grenzwertig — Projekt knapp unwirtschaftlich';
  } else {
    statusColor = '#dc2626'; statusText = '❌ Unwirtschaftlich — Projekt nicht rentabel';
  }

  const npvStyle = npvM > 0 ? 'kpi-green' : npvM > -100 ? 'kpi-orange' : 'kpi-red';
  const capexMio = r.capex_total / 1e6;

  // KPI row
  const kpiHtml = `
    <div class="kpi-row" style="margin-bottom:18px;">
      <div class="kpi-card">
        <div class="kpi-label">CAPEX</div>
        <div class="kpi-value kpi-${tech === 'Li-Ion' ? 'blue' : 'teal'}">${fmt1(capexMio)}</div>
        <div class="kpi-sub">Mio€ Gesamtinvestition</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">NPV (Jahr ${lifetime})</div>
        <div class="kpi-value ${npvStyle}">${sign(npvM)}${fmt1(npvM)}</div>
        <div class="kpi-sub">Mio€ Kapitalwert</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Amortisation</div>
        <div class="kpi-value" style="font-size:1rem;">${r.paybackStr}</div>
        <div class="kpi-sub">diskontiert</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">LCOS</div>
        <div class="kpi-value kpi-${tech === 'Li-Ion' ? 'blue' : 'teal'}">${fmt1(r.lcos)}</div>
        <div class="kpi-sub">€/MWh Levelized Cost</div>
      </div>
    </div>`;

  const rows = [
    ['CAPEX',                fmtM1(r.capex_total),               'Gesamtinvestition'],
    ['Arbitrage-Erlös',      fmtM(r.arb_after_tax) + '/a',       'nach Steuer'],
    ['Netzentgelt-Ersparnis',fmtM(r.grid_after_tax) + '/a',      'nach Steuer'],
    ['OPEX (fix)',           '−' + fmtM(r.opex_after_tax) + '/a','steuerlich abzugsfähig'],
    ['Jährl. Cashflow',      fmtM(r.annual_cf) + '/a',           'nach Steuer & OPEX'],
    ['LCOS',                 fmt1(r.lcos) + ' €/MWh',            'Levelized Cost of Storage'],
    ['Break-even Spread',    r.be_spread + ' €/MWh',             'mind. nötiger Arbitrage-Spread'],
  ];

  const tableHtml = `
    <table class="results-table">
      <thead>
        <tr>
          <th>Kennzahl</th>
          <th>Wert</th>
          <th>Erläuterung</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(([k, v, n]) => `
          <tr>
            <td class="td-key">${k}</td>
            <td class="td-val">${v}</td>
            <td class="td-note">${n}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;

  document.getElementById('results-card').innerHTML = `
    ${kpiHtml}
    <div class="results-card">
      <div class="results-card-header" style="background:${color}22; border-bottom:1px solid ${color}44;">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span>
        ${tech} — 100 MW / 1.000 MWh&nbsp;&nbsp;·&nbsp;&nbsp;${SCENARIO_LABELS[activeScenario]}
      </div>
      ${tableHtml}
      <div class="results-status" style="background:${statusColor}22; color:${statusColor}; border-top:1px solid ${statusColor}44;">
        ${statusText}
      </div>
    </div>`;
}

/* ── Render chart ────────────────────────────────── */
function renderChart(r, params) {
  const { tech, lifetime, wacc, degradation_unused } = params;
  const degradation = r.degradation;
  const color = tech === 'Li-Ion' ? '#1e6fff' : '#00b87a';

  const mainData = r.years.map((y, i) => ({ x: y, y: r.cum_cf[i] / 1e6 }));

  let extraData = [];
  if (r.extraYears !== null) {
    const extLen = Math.min(Math.ceil(r.extraYears) + 1, 50);
    let prevCum  = r.cum_cf[r.cum_cf.length - 1];
    extraData.push({ x: lifetime, y: prevCum / 1e6 });
    for (let i = 1; i <= extLen; i++) {
      const t   = lifetime + i;
      const dcf = r.annual_cf * Math.pow(1 - degradation, t - 1) / Math.pow(1 + wacc, t);
      prevCum  += dcf;
      extraData.push({ x: t, y: prevCum / 1e6 });
    }
  }

  // X-axis extent
  const endX = r.totalYears
    ? r.totalYears * 1.1
    : r.payback
    ? Math.max(r.payback * 1.3, lifetime * 1.2)
    : lifetime * 1.3;

  const allY = [...r.cum_cf.map(v => v / 1e6), ...extraData.map(d => d.y)];
  const yMin = Math.min(...allY) * 1.12;
  const yMax = Math.max(20, r.capex_total / 1e6 * 0.08);

  const datasets = [
    {
      label: 'Kum. Cashflow (diskontiert)',
      data: mainData,
      borderColor: color,
      backgroundColor: color + '18',
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 5,
      fill: true,
      tension: 0.35,
      order: 1,
    },
  ];

  if (extraData.length) {
    datasets.push({
      label: 'Extrapolation (nach Lebensdauer)',
      data: extraData,
      borderColor: color,
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 0,
      fill: false,
      tension: 0.35,
      order: 2,
    });
  }

  const annotations = {};

  // Breakeven line
  annotations.breakeven = {
    type: 'line', yMin: 0, yMax: 0,
    borderColor: '#ef4444', borderWidth: 1.5,
    borderDash: [6, 3],
    label: { content: 'Break-even', enabled: true, position: 'start', color: '#ef4444', backgroundColor: 'transparent', font: { size: 10 } },
  };

  // Lifetime line
  annotations.lifetime = {
    type: 'line', xMin: lifetime, xMax: lifetime,
    borderColor: '#7a80a0', borderWidth: 1.2, borderDash: [4, 3],
    label: { content: `Ende Lebensdauer (Jahr ${lifetime})`, enabled: true, position: 'start', color: '#7a80a0', backgroundColor: '#1a1d26ee', font: { size: 9 }, yAdjust: -10 },
  };

  // Payback line
  if (r.payback !== null) {
    annotations.payback = {
      type: 'line', xMin: r.payback, xMax: r.payback,
      borderColor: '#22c55e', borderWidth: 1.8,
      label: { content: `Amortisation: ${r.payback.toFixed(1)}a`, enabled: true, position: 'end', color: '#22c55e', backgroundColor: '#1a1d26ee', font: { size: 9 }, yAdjust: 10 },
    };
  } else if (r.totalYears !== null) {
    annotations.payback = {
      type: 'line', xMin: r.totalYears, xMax: r.totalYears,
      borderColor: '#22c55e', borderWidth: 1.5, borderDash: [4, 3],
      label: { content: `Amortisation (extr.): ~${Math.round(r.totalYears)}a`, enabled: true, position: 'end', color: '#22c55e', backgroundColor: '#1a1d26ee', font: { size: 9 }, yAdjust: 10 },
    };
  }

  const cfg = {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.5,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          type: 'linear',
          min: 0, max: Math.ceil(endX),
          title: { display: true, text: 'Jahr', color: '#7a80a0', font: { size: 11 } },
          grid:  { color: '#2e335088' },
          ticks: { color: '#7a80a0', stepSize: 1 },
        },
        y: {
          min: yMin, max: yMax,
          title: { display: true, text: 'Kumulierter Kapitalwert [Mio€]', color: '#7a80a0', font: { size: 11 } },
          grid:  { color: '#2e335088' },
          ticks: { color: '#7a80a0', callback: v => v.toFixed(0) + ' Mio€' },
        },
      },
      plugins: {
        legend: {
          labels: { color: '#e8eaf0', font: { size: 11 }, boxWidth: 18 },
        },
        tooltip: {
          backgroundColor: '#22263aee',
          borderColor: '#2e3350',
          borderWidth: 1,
          titleColor: '#e8eaf0',
          bodyColor: '#7a80a0',
          callbacks: {
            title: items => `Jahr ${items[0].parsed.x}`,
            label: item => ` ${item.dataset.label}: ${item.parsed.y.toFixed(1)} Mio€`,
          },
        },
        annotation: { annotations },
      },
    },
  };

  if (chart) { chart.destroy(); }
  chart = new Chart(document.getElementById('chart'), cfg);
}

/* ── Main update ─────────────────────────────────── */
function getParams() {
  const g = id => document.getElementById(id);
  return {
    tech:     activeTech,
    net:      parseFloat(g('net').value),
    spread:   parseFloat(g('spread').value),
    sub:      parseFloat(g('sub').value),
    cyc:      parseFloat(g('cyc').value),
    wacc:     parseFloat(g('wacc').value),
    tax:      parseFloat(g('tax').value),
    grid_fee: parseFloat(g('grid_fee').value),
    eff:      parseFloat(g('eff').value),
    lifetime: parseInt(g('lifetime').value),
  };
}

function updateBadges(params) {
  const g = id => document.getElementById(id);
  g('net-val').textContent      = params.net.toFixed(1);
  g('spread-val').textContent   = params.spread + ' €/MWh';
  g('sub-val').textContent      = params.sub + ' €/MWh';
  g('cyc-val').textContent      = params.cyc + ' /a';
  g('wacc-val').textContent     = (params.wacc * 100).toFixed(1) + ' %';
  g('tax-val').textContent      = (params.tax * 100).toFixed(1) + ' %';
  g('grid_fee-val').textContent = params.grid_fee + ' €/MWh';
  g('eff-val').textContent      = params.eff.toFixed(2);
  g('lifetime-val').textContent = params.lifetime + ' Jahre';
}

let updateTimer = null;
function scheduleUpdate() {
  clearTimeout(updateTimer);
  updateTimer = setTimeout(runUpdate, 60);
}

function runUpdate() {
  const params = getParams();
  updateBadges(params);
  const r = calculate(params);
  renderResults(r, params);
  renderChart(r, params);
}

/* ── Scenario logic ──────────────────────────────── */
function applyScenario(s) {
  activeScenario = s;
  const techKey  = activeTech === 'Li-Ion' ? 'liion' : 'rf';
  const def      = SCENARIO_DEFAULTS[s];
  const techDef  = def[techKey];
  const lit      = LIT_NOTES[s];
  const techLit  = lit[techKey];

  const set = (id, val) => { document.getElementById(id).value = val; };
  set('net',      def.net);
  set('spread',   def.spread);
  set('wacc',     def.wacc);
  set('tax',      def.tax);
  set('grid_fee', def.grid_fee);
  set('sub',      def.sub);
  set('cyc',      techDef.cyc);
  set('eff',      techDef.eff);
  set('lifetime', techDef.lifetime);

  document.getElementById('net-lit').textContent      = lit.net;
  document.getElementById('spread-lit').textContent   = lit.spread;
  document.getElementById('sub-lit').textContent      = lit.sub;
  document.getElementById('wacc-lit').textContent     = lit.wacc;
  document.getElementById('tax-lit').textContent      = lit.tax;
  document.getElementById('grid_fee-lit').textContent = lit.grid_fee;
  document.getElementById('cyc-lit').textContent      = techLit.cyc;
  document.getElementById('eff-lit').textContent      = techLit.eff;
  document.getElementById('lifetime-lit').textContent = techLit.lifetime;

  // Update scenario button styles
  ['A', 'B', 'C'].forEach(k => {
    const btn = document.getElementById('btn-' + k.toLowerCase());
    btn.classList.toggle('active', k === s);
    btn.querySelector('.dot').textContent = k === s ? '●' : '○';
  });

  runUpdate();
}

function setTech(tech) {
  activeTech = tech;
  document.getElementById('tech-liion').classList.toggle('active', tech === 'Li-Ion');
  document.getElementById('tech-rf').classList.toggle('active',    tech === 'Redox-Flow');
  document.body.classList.toggle('rf-mode', tech === 'Redox-Flow');
  applyScenario(activeScenario);
}

/* ── Wire up sliders ─────────────────────────────── */
function init() {
  ['net', 'spread', 'sub', 'cyc', 'wacc', 'tax', 'grid_fee', 'eff', 'lifetime'].forEach(id => {
    document.getElementById(id).addEventListener('input', scheduleUpdate);
  });

  // Chart.js annotation plugin (inline minimal version via CDN loaded below)
  applyScenario('A');
}

// Load Chart.js annotation plugin then init
(function loadAnnotationPlugin() {
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js';
  s.onload = () => {
    Chart.register(window['chartjs-plugin-annotation']);
    init();
  };
  s.onerror = () => {
    // fallback without annotations
    init();
  };
  document.head.appendChild(s);
})();
