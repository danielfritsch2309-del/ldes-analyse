'use strict';

const TECH_PRESETS = {
  A: {
    'Li-Ion':     {energy_mwh:1000,power_mw:100,capex_power:318160,capex_energy:325740,opex_fixed:8952000, degradation:0.010, stack_share:0},
    'Redox-Flow': {energy_mwh:1000,power_mw:100,capex_power:0,     capex_energy:353045,opex_fixed:5800000, degradation:0.001, stack_share:0.30},
  },
  B: {
    'Li-Ion':     {energy_mwh:1000,power_mw:100,capex_power:318160,capex_energy:325740,opex_fixed:8952000, degradation:0.010, stack_share:0},
    'Redox-Flow': {energy_mwh:1000,power_mw:100,capex_power:0,     capex_energy:353045,opex_fixed:5800000, degradation:0.001, stack_share:0.30},
  },
  C: {
    'Li-Ion':     {energy_mwh:1000,power_mw:100,capex_power:289065,capex_energy:221197,opex_fixed:6360000, degradation:0.010, stack_share:0},
    'Redox-Flow': {energy_mwh:1000,power_mw:100,capex_power:0,     capex_energy:293027,opex_fixed:5800000, degradation:0.001, stack_share:0.30},
  },
};

const SCENARIO_LABELS = {
  A: 'Szenario A – Status quo (§118 EnWG)',
  B: 'Szenario B – Reform (ohne §118)',
  C: 'Szenario C – Zukunftsmarkt 2030',
};

const DEFAULTS = {
  A: {net:1.0,spread:60, wacc:0.07,tax:0.30,grid_fee:15,sub:0,
      liion:{cyc:300,eff:0.86,lifetime:12,stack_reinvest:0,  stack_year:12},
      rf:   {cyc:250,eff:0.75,lifetime:20,stack_reinvest:0.30,stack_year:15}},
  B: {net:0.0,spread:60, wacc:0.07,tax:0.30,grid_fee:15,sub:0,
      liion:{cyc:300,eff:0.86,lifetime:12,stack_reinvest:0,  stack_year:12},
      rf:   {cyc:250,eff:0.75,lifetime:20,stack_reinvest:0.30,stack_year:15}},
  C: {net:0.0,spread:80, wacc:0.07,tax:0.30,grid_fee:20,sub:0,
      liion:{cyc:350,eff:0.90,lifetime:15,stack_reinvest:0,  stack_year:12},
      rf:   {cyc:350,eff:0.82,lifetime:25,stack_reinvest:0.30,stack_year:15}},
};

const LIT = {
  A: {net:'Lit: 1.0 (§118 EnWG)',spread:'Lit: 60 €/MWh (Aurora/Agora 2025)',sub:'Lit: 0 €/MWh',wacc:'Lit: 0.07 (7%)',tax:'Lit: 0.30 (KStG §23)',grid_fee:'Lit: 15 €/MWh (BNetzA 2024)',
      liion:{cyc:'Lit: 300/a (SMARD 2023–25)',eff:'Lit: 0.86 (Sudiarto 2026)',lifetime:'Lit: 12a (Mongird 2020)',stack_reinvest:'Lit: 0 % (kein Stack-Tausch bei Li-Ion)',stack_year:'–'},
      rf:   {cyc:'Lit: 250/a (SMARD 2023–25)',eff:'Lit: 0.75 (Sudiarto 2026)',lifetime:'Lit: 20a (IRENA 2024, PNNL 2022)',stack_reinvest:'Lit: 30 % CAPEX (Viswanathan/PNNL-33283)',stack_year:'Lit: Jahr 15 (PNNL 2022, Mid-life Refurbishment)'}},
  B: {net:'Lit: 0.0 (§118 Reform)',spread:'Lit: 60 €/MWh (Aurora/Agora 2025)',sub:'Lit: 0 €/MWh',wacc:'Lit: 0.07 (7%)',tax:'Lit: 0.30 (KStG §23)',grid_fee:'Lit: 15 €/MWh (BNetzA 2024)',
      liion:{cyc:'Lit: 300/a (SMARD 2023–25)',eff:'Lit: 0.86 (Sudiarto 2026)',lifetime:'Lit: 12a (Mongird 2020)',stack_reinvest:'Lit: 0 % (kein Stack-Tausch bei Li-Ion)',stack_year:'–'},
      rf:   {cyc:'Lit: 250/a (SMARD 2023–25)',eff:'Lit: 0.75 (Sudiarto 2026)',lifetime:'Lit: 20a (IRENA 2024, PNNL 2022)',stack_reinvest:'Lit: 30 % CAPEX (Viswanathan/PNNL-33283)',stack_year:'Lit: Jahr 15 (PNNL 2022, Mid-life Refurbishment)'}},
  C: {net:'Lit: 0.0 (§118 Reform)',spread:'Lit: 80 €/MWh (Aurora 2025)',sub:'Lit: 0 €/MWh',wacc:'Lit: 0.07 (7%)',tax:'Lit: 0.30 (KStG §23)',grid_fee:'Lit: 20 €/MWh (BNetzA 2030)',
      liion:{cyc:'Lit: 350/a (Agora 2030)',eff:'Lit: 0.90 (Sudiarto 2026)',lifetime:'Lit: 15a (NREL ATB 2024)',stack_reinvest:'Lit: 0 % (kein Stack-Tausch bei Li-Ion)',stack_year:'–'},
      rf:   {cyc:'Lit: 350/a (Agora 2030)',eff:'Lit: 0.82 (Sprenkle 2023)',lifetime:'Lit: 25a (IRENA 2024, Sudiarto 2026)',stack_reinvest:'Lit: 30 % CAPEX (Viswanathan/PNNL-33283)',stack_year:'Lit: Jahr 15 (PNNL 2022, Mid-life Refurbishment)'}},
};

const COLORS = {
  A: {line:'#1e6fff', fill:'rgba(30,111,255,0.08)'},
  B: {line:'#ef4444', fill:'rgba(239,68,68,0.08)'},
  C: {line:'#22c55e', fill:'rgba(34,197,94,0.08)'},
};

let activeTech = 'Li-Ion';
let activeTab  = 'A';
let myChart    = null;
const state    = {A:null, B:null, C:null};

/* ── Calculations ── */
function defParams(sc) {
  const d = DEFAULTS[sc], tk = activeTech === 'Li-Ion' ? 'liion' : 'rf';
  return {tech:activeTech, net:d.net, spread:d.spread, wacc:d.wacc, tax:d.tax,
          grid_fee:d.grid_fee, sub:d.sub, cyc:d[tk].cyc, eff:d[tk].eff,
          lifetime:d[tk].lifetime, stack_reinvest:d[tk].stack_reinvest, stack_year:d[tk].stack_year};
}

function getCapex(sc, tech) {
  const t = TECH_PRESETS[sc][tech];
  return t.capex_power * t.power_mw + t.capex_energy * t.energy_mwh;
}

function computeCF(capex, annual_cf, lifetime, wacc, deg, stack_cost, stack_year) {
  const years = [0], cum = [-capex];
  let payback = null;
  for (let t = 1; t <= lifetime; t++) {
    let cf_t = annual_cf * Math.pow(1-deg, t-1) / Math.pow(1+wacc, t);
    // Stack reinvestment: one-time discounted cost in stack_year
    if (stack_cost > 0 && t === stack_year) {
      cf_t -= stack_cost / Math.pow(1+wacc, t);
    }
    cum.push(cum[t-1] + cf_t);
    years.push(t);
    if (payback === null && cum[t] >= 0)
      payback = (t-1) + (-cum[t-1] / (cum[t] - cum[t-1]));
  }
  return {years, cum, payback};
}

function calcLCOS(capex, opex, mwh, cyc, life, wacc, deg) {
  let c = capex, e = 0;
  for (let t = 1; t <= life; t++) {
    c += opex / Math.pow(1+wacc, t);
    e += cyc * mwh * Math.pow(1-deg, t-1) / Math.pow(1+wacc, t);
  }
  return e > 0 ? c / e : Infinity;
}

function calcBE(capex, opex, mwh, cyc, eff, net, gf, sub, tax, life, wacc, deg) {
  let ds = 0;
  for (let t = 1; t <= life; t++) ds += Math.pow(1-deg, t-1) / Math.pow(1+wacc, t);
  const A = cyc * mwh * eff * (1-tax) * ds;
  const B = (net * gf * mwh * cyc + sub - opex) * (1-tax) * ds;
  if (A <= 0) return '>600';
  const s = Math.ceil((capex - B) / A);
  return s <= 0 ? 1 : s > 600 ? '>600' : s;
}

function calc(sc, p) {
  const td  = TECH_PRESETS[sc][p.tech];
  const mwh = td.energy_mwh, deg = td.degradation, opex = td.opex_fixed;
  const cap = getCapex(sc, p.tech);
  const stack_cost = p.tech === 'Redox-Flow' ? cap * (p.stack_reinvest || 0) : 0;
  const stack_year = parseInt(p.stack_year) || 15;
  const annual_cf = (p.cyc*mwh*p.spread*p.eff + p.net*p.grid_fee*mwh*p.cyc + p.sub*mwh - opex) * (1-p.tax);
  const {years, cum, payback} = computeCF(cap, annual_cf, p.lifetime, p.wacc, deg, stack_cost, stack_year);
  const lcos = calcLCOS(cap + stack_cost, opex, mwh, p.cyc, p.lifetime, p.wacc, deg);
  const be   = calcBE(cap, opex, mwh, p.cyc, p.eff, p.net, p.grid_fee, p.sub*mwh, p.tax, p.lifetime, p.wacc, deg);
  const paybackStr = payback !== null ? `${payback.toFixed(1)} Jahre` : 'nicht innerhalb Lebensdauer';
  let extraPts = [];
  if (payback === null) {
    let prev = cum[cum.length-1];
    extraPts.push({x: p.lifetime, y: prev/1e6});
    for (let i = 1; i <= p.lifetime; i++) {
      const t = p.lifetime + i;
      prev += annual_cf * Math.pow(1-deg, t-1) / Math.pow(1+p.wacc, t);
      extraPts.push({x: t, y: prev/1e6});
    }
  }
  return {
    cap, opex, annual_cf, deg, stack_cost, stack_year,
    arb_at:   p.cyc*mwh*p.spread*p.eff*(1-p.tax),
    grid_at:  p.net*p.grid_fee*mwh*p.cyc*(1-p.tax),
    opex_at:  opex*(1-p.tax),
    payback, paybackStr, npv: cum[cum.length-1], lcos, be,
    years, cum, extraPts,
  };
}

/* ── Formatting ── */
const f1  = v => v.toFixed(1);
const fM  = v => (v/1e6).toFixed(2) + ' Mio€';
const fM1 = v => (v/1e6).toFixed(1) + ' Mio€';
const sgn = v => v >= 0 ? '+' : '';

/* ── Build tab panel HTML ── */
function buildPanel(sc) {
  const p = state[sc] || defParams(sc);
  const lit = LIT[sc], tk = activeTech === 'Li-Ion' ? 'liion' : 'rf', tl = lit[tk];
  const sl = (key, label, min, max, step, val, badge, litTxt) => `
    <div class="control-block">
      <div class="slider-header">
        <label for="${sc}_${key}">${label}</label>
        <span class="badge" id="${sc}_${key}_val">${badge}</span>
      </div>
      <input type="range" id="${sc}_${key}" min="${min}" max="${max}" step="${step}" value="${val}" data-sc="${sc}" data-key="${key}">
      <div class="lit">${litTxt}</div>
    </div>`;
  return `
    <div class="tab-panel" id="panel_${sc}" style="display:${sc===activeTab?'block':'none'}">
      <div class="tab-panel-header">
        <span class="tab-scenario-label">${SCENARIO_LABELS[sc]}</span>
        <button class="reset-tab-btn" data-sc="${sc}">↺ Reset</button>
      </div>
      <div class="section-divider">MARKTPARAMETER</div>
      ${sl('spread','Arbitrage-Spread',20,150,5,p.spread,p.spread+' €/MWh',lit.spread)}
      ${sl('cyc','Ladezyklen',50,500,10,p.cyc,p.cyc+' /a',tl.cyc)}
      ${sl('eff','Effizienz',0.60,1.00,0.01,p.eff,p.eff.toFixed(2),tl.eff)}
      <div class="section-divider">REGULATORIK</div>
      ${sl('net','Netzentlastung §118',0,1,0.1,p.net,p.net.toFixed(1),lit.net)}
      ${sl('grid_fee','Netzentgelt',0,40,1,p.grid_fee,p.grid_fee+' €/MWh',lit.grid_fee)}
      ${sl('sub','Subvention',0,100,1,p.sub,p.sub+' €/MWh',lit.sub)}
      <div class="section-divider">FINANZIERUNG</div>
      ${sl('wacc','WACC',0,0.15,0.01,p.wacc,(p.wacc*100).toFixed(1)+' %',lit.wacc)}
      ${sl('lifetime','Lebensdauer',8,25,1,p.lifetime,p.lifetime+' Jahre',tl.lifetime)}
      ${sl('tax','Steuersatz',0,0.5,0.05,p.tax,(p.tax*100).toFixed(1)+' %',lit.tax)}
      <div class="section-divider">BEDIENUNG</div>
      <p class="sidebar-hint">Pfeiltasten ← → für präzise Einstellung. ↺ Reset stellt Literaturwerte wieder her.</p>
      ${p.tech === 'Redox-Flow' ? `
      <div class="section-divider" style="color:#00b87a">MID-LIFE REFURBISHMENT (VRFB)</div>
      ${sl('stack_reinvest','Stack-Reinvestition',0,0.5,0.05,p.stack_reinvest,(p.stack_reinvest*100).toFixed(0)+' % CAPEX',tl.stack_reinvest)}
      ${sl('stack_year','Refurbishment-Jahr',8,20,1,p.stack_year,'Jahr '+p.stack_year,tl.stack_year)}
      ` : ''}
    </div>`;
}

function renderPanels() {
  document.getElementById('tab-panels').innerHTML = ['A','B','C'].map(buildPanel).join('');
  document.querySelectorAll('#tab-panels input[type=range]').forEach(el => {
    el.addEventListener('input', function() {
      const sc = this.dataset.sc, key = this.dataset.key, val = parseFloat(this.value);
      const b = document.getElementById(`${sc}_${key}_val`);
      if (b) {
        if      (key==='wacc')          b.textContent = (val*100).toFixed(1)+' %';
        else if (key==='tax')           b.textContent = (val*100).toFixed(1)+' %';
        else if (key==='eff')           b.textContent = val.toFixed(2);
        else if (key==='net')           b.textContent = val.toFixed(1);
        else if (key==='lifetime')      b.textContent = val+' Jahre';
        else if (key==='cyc')           b.textContent = val+' /a';
        else if (key==='stack_reinvest')b.textContent = (val*100).toFixed(0)+' % CAPEX';
        else if (key==='stack_year')    b.textContent = 'Jahr '+val;
        else                            b.textContent = val+' €/MWh';
      }
      state[sc] = readParams(sc);
      updateDirty();
      scheduleUpdate();
    });
  });
  document.querySelectorAll('.reset-tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const sc = this.dataset.sc;
      state[sc] = defParams(sc);  // set defaults FIRST
      renderPanels();              // then re-render with those defaults
      switchTab(activeTab);
      updateDirty();
      runUpdate();
    });
  });
}

function readParams(sc) {
  const g = key => parseFloat(document.getElementById(`${sc}_${key}`).value);
  const isRF = activeTech === 'Redox-Flow';
  const sr = isRF && document.getElementById(`${sc}_stack_reinvest`) ? parseFloat(document.getElementById(`${sc}_stack_reinvest`).value) : 0;
  const sy = isRF && document.getElementById(`${sc}_stack_year`)     ? parseInt(document.getElementById(`${sc}_stack_year`).value)     : 15;
  return {tech:activeTech, spread:g('spread'), cyc:g('cyc'), eff:g('eff'), net:g('net'),
          grid_fee:g('grid_fee'), sub:g('sub'), wacc:g('wacc'),
          lifetime:parseInt(document.getElementById(`${sc}_lifetime`).value), tax:g('tax'),
          stack_reinvest:sr, stack_year:sy};
}

function updateDirty() {
  ['A','B','C'].forEach(sc => {
    const p = state[sc], def = defParams(sc);
    const keys = ['spread','cyc','eff','net','grid_fee','sub','wacc','lifetime','tax','stack_reinvest','stack_year'];
    const dirty = p && keys.some(k => Math.abs((p[k]||0)-(def[k]||0)) > 0.0001);
    document.getElementById(`tab-dirty-${sc}`).classList.toggle('hidden', !dirty);
  });
}

function switchTab(sc) {
  activeTab = sc;
  ['A','B','C'].forEach(s => {
    document.getElementById(`tab-btn-${s}`).classList.toggle('active', s===sc);
    const panel = document.getElementById(`panel_${s}`);
    if (panel) panel.style.display = s===sc ? 'block' : 'none';
  });
  renderKPI(sc);
}

/* ── Render KPI + table ── */
function renderKPI(sc) {
  const p = state[sc] || defParams(sc);
  const r = calc(sc, p);
  const color = COLORS[sc].line;
  const npvM  = r.npv / 1e6;
  const npvCls = npvM > 0 ? 'kpi-green' : npvM > -50 ? 'kpi-orange' : 'kpi-red';
  const tc = activeTech === 'Li-Ion' ? 'blue' : 'teal';
  const beN = typeof r.be === 'number' ? r.be : null;
  const gap = beN !== null ? beN - p.spread : null;
  let stColor, stText;
  if (npvM > 0) {
    stColor = '#16a34a'; stText = `Wirtschaftlich — Amortisation in ${r.paybackStr}`;
  } else if (beN !== null && gap !== null) {
    stColor = npvM > -50 ? '#d97706' : '#dc2626';
    stText  = `Break-even Spread (${beN} €/MWh) liegt +${gap} €/MWh über Marktspread (${p.spread} €/MWh)`;
  } else {
    stColor = '#dc2626'; stText = 'Nicht wirtschaftlich innerhalb der Lebensdauer';
  }
  document.getElementById('results-card').innerHTML = `
    <div class="kpi-row">
      <div class="kpi-card"><div class="kpi-label">CAPEX</div><div class="kpi-value kpi-${tc}">${f1(r.cap/1e6)}</div><div class="kpi-sub">Mio€</div></div>
      <div class="kpi-card"><div class="kpi-label">NPV (Jahr ${p.lifetime})</div><div class="kpi-value ${npvCls}">${sgn(npvM)}${f1(npvM)}</div><div class="kpi-sub">Mio€</div></div>
      <div class="kpi-card"><div class="kpi-label">Amortisation</div><div class="kpi-value" style="font-size:.9rem">${r.paybackStr}</div><div class="kpi-sub">diskontiert</div></div>
      <div class="kpi-card"><div class="kpi-label">LCOS</div><div class="kpi-value kpi-${tc}">${f1(r.lcos)}</div><div class="kpi-sub">€/MWh</div></div>
      <div class="kpi-card"><div class="kpi-label">Break-even Spread</div><div class="kpi-value kpi-${tc}">${r.be}</div><div class="kpi-sub">€/MWh mind.</div></div>
    </div>
    <div class="results-card-inner">
      <div class="results-card-header" style="background:${color}22;border-bottom:1px solid ${color}44">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block"></span>
        ${activeTech} — ${SCENARIO_LABELS[sc]}
      </div>
      <table class="results-table">
        <thead><tr><th>Kennzahl</th><th>Wert</th><th>Erläuterung</th></tr></thead>
        <tbody>
          ${[
            ['CAPEX',                 fM1(r.cap),                      'Gesamtinvestition'],
            ['Degradation/a',         (r.deg*100).toFixed(2)+' %',     'Kapazitätsverlust/Jahr'],
            ...(r.stack_cost > 0 ? [[`Mid-life Refurbishment (Jahr ${r.stack_year})`, '−'+fM1(r.stack_cost), 'Stack-Austausch (Viswanathan/PNNL-33283)']] : []),
            ['Arbitrage-Erlös',       fM(r.arb_at)+'/a',               'nach Steuer'],
            ['Netzentgelt-Ersparnis', fM(r.grid_at)+'/a',              'nach Steuer'],
            ['OPEX (fix)',            '−'+fM(r.opex_at)+'/a',          'steuerlich abzugsfähig'],
            ['Jährl. Cashflow',       fM(r.annual_cf)+'/a',            'nach Steuer & OPEX'],
            ['LCOS',                  f1(r.lcos)+' €/MWh',             'Levelized Cost of Storage'],
            ['Break-even Spread',     r.be+' €/MWh',                   'mind. nötiger Spread'],
          ].map(([k,v,n]) => `<tr><td class="td-key">${k}</td><td class="td-val">${v}</td><td class="td-note">${n}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="results-status" style="background:${stColor}22;color:${stColor};border-top:1px solid ${stColor}44">${stText}</div>
    </div>`;
}

/* ── Render chart ── */
function renderChart() {
  const show = {
    A: document.getElementById('show-a').checked,
    B: document.getElementById('show-b').checked,
    C: document.getElementById('show-c').checked,
  };
  const datasets = [];
  const lifetimeLines = [];
  let yMin = -10, yMax = 10, xMax = 25;

  ['A','B','C'].forEach(sc => {
    if (!show[sc]) return;
    const p   = state[sc] || defParams(sc);
    const r   = calc(sc, p);
    const col = COLORS[sc];

    datasets.push({
      label:            `Sz. ${sc}`,
      data:             r.years.map((y,i) => ({x:y, y:r.cum[i]/1e6})),
      borderColor:      col.line,
      backgroundColor:  col.fill,
      borderWidth:      2.5,
      pointRadius:      0,
      pointHoverRadius: 5,
      fill:             false,
      tension:          0.3,
    });

    if (r.extraPts.length > 1) {
      datasets.push({
        label:       `Sz. ${sc} (extr.)`,
        data:        r.extraPts,
        borderColor: col.line,
        borderWidth: 1.5,
        borderDash:  [6, 4],
        pointRadius: 0,
        fill:        false,
        tension:     0.3,
      });
    }

    const allY = [...r.cum.map(v => v/1e6), ...r.extraPts.map(d => d.y)];
    yMin = Math.min(yMin, ...allY);
    yMax = Math.max(yMax, ...allY);
    const lastX = r.extraPts.length ? r.extraPts[r.extraPts.length-1].x : p.lifetime;
    xMax = Math.max(xMax, lastX + 2, p.lifetime + 4);

    lifetimeLines.push({x: p.lifetime, npv: r.npv/1e6, color: col.line, sc});
  });

  if (myChart) { myChart.destroy(); myChart = null; }

  // Custom plugin: draw vertical lifetime lines directly on canvas
  const lifetimePlugin = {
    id: 'lifetimeLines',
    afterDraw(chart) {
      const ctx  = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      lifetimeLines.forEach(({x, npv, color}) => {
        const xPx    = xAxis.getPixelForValue(x);
        const yTop   = yAxis.getPixelForValue(npv);
        const yBottom= yAxis.bottom;
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1.2;
        ctx.globalAlpha = 0.7;
        ctx.moveTo(xPx, yBottom);
        ctx.lineTo(xPx, yTop);
        ctx.stroke();
        // dot at NPV point
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.fillStyle   = color;
        ctx.arc(xPx, yTop, 4.5, 0, Math.PI * 2);
        ctx.fill();
        // NPV label
        ctx.fillStyle   = color;
        ctx.font        = 'bold 10px Segoe UI, sans-serif';
        ctx.textAlign   = 'left';
        ctx.fillText(`${npv.toFixed(1)} Mio€`, xPx + 6, yTop + 4);
        ctx.restore();
      });
    }
  };

  myChart = new Chart(document.getElementById('chart'), {
    type:    'line',
    data:    {datasets},
    plugins: [lifetimePlugin],
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction:         {mode:'index', intersect:false},
      scales: {
        x: {type:'linear', min:0, max:Math.ceil(xMax), title:{display:true,text:'Jahr',color:'#7a80a0',font:{size:11}}, grid:{color:'#2e335033'}, ticks:{color:'#7a80a0',stepSize:5}},
        y: {min:Math.floor(yMin*1.12), max:Math.ceil(Math.max(yMax*1.1,5)), title:{display:true,text:'Kumulierter Kapitalwert [Mio€]',color:'#7a80a0',font:{size:11}}, grid:{color:'#2e335033'}, ticks:{color:'#7a80a0', callback:v=>v.toFixed(0)+' Mio€'}},
      },
      plugins: {
        legend: {
          labels: {
            color:    '#e8eaf0',
            font:     {size:11},
            boxWidth: 18,
            filter:   item => item.text && !item.text.includes('extr.'),
          },
        },
        tooltip: {
          backgroundColor: '#22263aee',
          borderColor:     '#2e3350',
          borderWidth:     1,
          titleColor:      '#e8eaf0',
          bodyColor:       '#7a80a0',
          callbacks: {
            title: items => `Jahr ${items[0].parsed.x}`,
            label: item  => ` ${item.dataset.label}: ${item.parsed.y.toFixed(1)} Mio€`,
          },
        },
      },
    },
  });
}

/* ── Update loop ── */
let timer = null;
function scheduleUpdate() { clearTimeout(timer); timer = setTimeout(runUpdate, 80); }
function runUpdate() {
  // Only read active tab from DOM — others use saved state
  if (document.getElementById(`${activeTab}_spread`)) state[activeTab] = readParams(activeTab);
  renderKPI(activeTab);
  renderChart();
  updateDirty();
}

/* ── Tech toggle ── */
function setTech(tech) {
  activeTech = tech;
  document.getElementById('tech-liion').classList.toggle('active', tech==='Li-Ion');
  document.getElementById('tech-rf').classList.toggle('active',    tech==='Redox-Flow');
  document.body.classList.toggle('rf-mode', tech==='Redox-Flow');
  ['A','B','C'].forEach(sc => { state[sc] = defParams(sc); });
  renderPanels(); switchTab(activeTab); runUpdate();
}

/* ── Export CSV ── */
function exportCSV() {
  const rows = [['Szenario','Kennzahl','Wert','Einheit'].join(';')];
  ['A','B','C'].forEach(sc => {
    const p = state[sc] || defParams(sc);
    const r = calc(sc, p);
    [
      ['CAPEX',        (r.cap/1e6).toFixed(2),    'Mio€'],
      ['NPV',          (r.npv/1e6).toFixed(2),    'Mio€'],
      ['LCOS',          r.lcos.toFixed(1),         '€/MWh'],
      ['BE-Spread',     r.be,                      '€/MWh'],
      ['Amortisation',  r.paybackStr,              ''],
      ['Cashflow/a',   (r.annual_cf/1e6).toFixed(2),'Mio€/a'],
    ].forEach(([k,v,u]) => rows.push([`Sz.${sc}`,k,v,u].join(';')));
  });
  Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(new Blob(['\uFEFF'+rows.join('\n')], {type:'text/csv;charset=utf-8;'})),
    download: 'ldes.csv',
  }).click();
}

/* ── Init ── */
['A','B','C'].forEach(sc => { state[sc] = defParams(sc); });
renderPanels();
['A','B','C'].forEach(sc => {
  document.getElementById(`tab-btn-${sc}`).addEventListener('click', () => { switchTab(sc); renderChart(); });
});
document.getElementById('tech-liion').addEventListener('click', () => setTech('Li-Ion'));
document.getElementById('tech-rf').addEventListener('click',    () => setTech('Redox-Flow'));
['show-a','show-b','show-c'].forEach(id => {
  document.getElementById(id).addEventListener('change', renderChart);
});
document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
document.getElementById('btn-export-png').addEventListener('click', () => {
  if (!myChart) return;
  Object.assign(document.createElement('a'), {href: myChart.toBase64Image('image/png',1.0), download:'ldes_chart.png'}).click();
});
switchTab('A');
setTimeout(runUpdate, 100);