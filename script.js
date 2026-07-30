'use strict';

const TECH_PRESETS = {
  A: {
    'Li-Ion':     {energy_mwh:1000,power_mw:100,capex_power:318160,capex_energy:325740,opex_fixed:8952000, degradation:0.015,stack_share:0},
    'Redox-Flow': {energy_mwh:1000,power_mw:100,capex_power:0,     capex_energy:353045,opex_fixed:5800000, degradation:0.002,stack_share:0.25},
  },
  B: {
    'Li-Ion':     {energy_mwh:1000,power_mw:100,capex_power:318160,capex_energy:325740,opex_fixed:8952000, degradation:0.015,stack_share:0},
    'Redox-Flow': {energy_mwh:1000,power_mw:100,capex_power:0,     capex_energy:353045,opex_fixed:5800000, degradation:0.002,stack_share:0.25},
  },
  C: {
    'Li-Ion':     {energy_mwh:1000,power_mw:100,capex_power:289065,capex_energy:221197,opex_fixed:6360000, degradation:0.015,stack_share:0},
    'Redox-Flow': {energy_mwh:1000,power_mw:100,capex_power:0,     capex_energy:257500,opex_fixed:5800000, degradation:0.002,stack_share:0.25},
  },
  D: {
    'Li-Ion':     {energy_mwh:1000,power_mw:100,capex_power:289065,capex_energy:221197,opex_fixed:6360000, degradation:0.015,stack_share:0},
    'Redox-Flow': {energy_mwh:1000,power_mw:100,capex_power:0,     capex_energy:257500,opex_fixed:5800000, degradation:0.002,stack_share:0.25},
  },
};

const SCENARIO_LABELS = {
  A: 'Szenario A – Status quo (§118 EnWG)',
  B: 'Szenario B – Reform (ohne §118)',
  C: 'Szenario C – Zukunftsmarkt 2030',
  D: 'Szenario D – Politisches Förderszenario 2030',
};

const DEFAULTS = {
  A: {net:1.0,spread:60, wacc:0.06,tax:0.30,grid_fee:15,sub:0,
      liion:{cyc:300,eff:0.86,lifetime:15,stack_reinvest:0,stack_year:15,salvage:0},
      rf:   {cyc:250,eff:0.75,lifetime:20,stack_reinvest:0.25,stack_year:15,salvage:0.35}},
  B: {net:0.0,spread:60, wacc:0.06,tax:0.30,grid_fee:15,sub:0,
      liion:{cyc:300,eff:0.86,lifetime:15,stack_reinvest:0,stack_year:15,salvage:0},
      rf:   {cyc:250,eff:0.75,lifetime:20,stack_reinvest:0.25,stack_year:15,salvage:0.35}},
  C: {net:0.0,spread:80, wacc:0.06,tax:0.30,grid_fee:20,sub:0,
      liion:{cyc:350,eff:0.90,lifetime:20,stack_reinvest:0,stack_year:15,salvage:0},
      rf:   {cyc:350,eff:0.82,lifetime:25,stack_reinvest:0.25,stack_year:15,salvage:0.35}},
  D: {net:0.5,spread:80, wacc:0.05,tax:0.30,grid_fee:20,sub:50,
      liion:{cyc:350,eff:0.90,lifetime:20,stack_reinvest:0,stack_year:15,salvage:0},
      rf:   {cyc:350,eff:0.82,lifetime:25,stack_reinvest:0.25,stack_year:15,salvage:0.35}},
};

const LIT = {
  A: {net:'Lit: 1.0 (§118 EnWG)',spread:'Lit: 60 €/MWh (Aurora/Agora 2025)',sub:'Lit: 0 €/MWh',wacc:'Lit: 0.06 (6%, Kost et al. 2024, Fraunhofer ISE)',tax:'Lit: 0.30 (KStG §23)',grid_fee:'Lit: 15 €/MWh (BNetzA 2024)',
      liion:{cyc:'Lit: 300/a (SMARD 2023–25)',eff:'Lit: 0.86 (Sudiarto 2026)',lifetime:'Lit: 15a (NREL ATB 2024, LFP-Standard)',stack_reinvest:'0 % (kein Stack-Tausch bei Li-Ion)',stack_year:'–',salvage:'0 % (kein Restwert Li-Ion)'},
      rf:   {cyc:'Lit: 250/a (SMARD 2023–25)',eff:'Lit: 0.75 (Sudiarto 2026)',lifetime:'Lit: 20a (IRENA 2024, PNNL 2022)',stack_reinvest:'Lit: 25 % CAPEX (Viswanathan/PNNL-33283)',stack_year:'Lit: Jahr 15 (Blume 2023, PNNL 2022)',salvage:'Lit: 35 % CAPEX (PNNL 2022, Blume 2023)'}},
  B: {net:'Lit: 0.0 (§118 Reform)',spread:'Lit: 60 €/MWh (Aurora/Agora 2025)',sub:'Lit: 0 €/MWh',wacc:'Lit: 0.06 (6%, Kost et al. 2024, Fraunhofer ISE)',tax:'Lit: 0.30 (KStG §23)',grid_fee:'Lit: 15 €/MWh (BNetzA 2024)',
      liion:{cyc:'Lit: 300/a (SMARD 2023–25)',eff:'Lit: 0.86 (Sudiarto 2026)',lifetime:'Lit: 15a (NREL ATB 2024, LFP-Standard)',stack_reinvest:'0 % (kein Stack-Tausch bei Li-Ion)',stack_year:'–',salvage:'0 % (kein Restwert Li-Ion)'},
      rf:   {cyc:'Lit: 250/a (SMARD 2023–25)',eff:'Lit: 0.75 (Sudiarto 2026)',lifetime:'Lit: 20a (IRENA 2024, PNNL 2022)',stack_reinvest:'Lit: 25 % CAPEX (Viswanathan/PNNL-33283)',stack_year:'Lit: Jahr 15 (Blume 2023, PNNL 2022)',salvage:'Lit: 35 % CAPEX (PNNL 2022, Blume 2023)'}},
  C: {net:'Lit: 0.0 (§118 Reform)',spread:'Lit: 80 €/MWh (Aurora 2025)',sub:'Lit: 0 €/MWh',wacc:'Lit: 0.06 (6%, Kost et al. 2024, Fraunhofer ISE)',tax:'Lit: 0.30 (KStG §23)',grid_fee:'Lit: 20 €/MWh (BNetzA 2030)',
      liion:{cyc:'Lit: 350/a (Agora 2030)',eff:'Lit: 0.90 (Sudiarto 2026)',lifetime:'Lit: 20a (DOE Storage Innovations 2030)',stack_reinvest:'0 % (kein Stack-Tausch bei Li-Ion)',stack_year:'–',salvage:'0 % (kein Restwert Li-Ion)'},
      rf:   {cyc:'Lit: 350/a (Agora 2030)',eff:'Lit: 0.82 (Sprenkle 2023)',lifetime:'Lit: 25a (IRENA 2024, Sudiarto 2026)',stack_reinvest:'Lit: 25 % CAPEX 2030 (Lernkurve -35%, PNNL ESGC 2024)',stack_year:'Lit: Jahr 15 (Blume 2023, PNNL 2022)',salvage:'Lit: 35 % CAPEX (PNNL 2022, Blume 2023)'}},
  D: {net:'Annahme: 0.5 (§118-Nachfolgeregelung, 50% Teilbefreiung)',spread:'Lit: 80 €/MWh (Aurora 2025)',sub:'Annahme: 50 €/MWh (Kapazitätsprämie, Orientierung UK Capacity Market)',wacc:'Annahme: 0.05 (5%, reduziert durch Planungssicherheit)',tax:'Lit: 0.30 (KStG §23)',grid_fee:'Lit: 20 €/MWh (BNetzA 2030)',
      liion:{cyc:'Lit: 350/a (Agora 2030)',eff:'Lit: 0.90 (Sudiarto 2026)',lifetime:'Lit: 20a (DOE Storage Innovations 2030)',stack_reinvest:'0 % (kein Stack-Tausch bei Li-Ion)',stack_year:'–',salvage:'0 % (kein Restwert Li-Ion)'},
      rf:   {cyc:'Lit: 350/a (Agora 2030)',eff:'Lit: 0.82 (Sprenkle 2023)',lifetime:'Lit: 25a (IRENA 2024, Sudiarto 2026)',stack_reinvest:'Lit: 25 % CAPEX 2030 (Lernkurve -35%, PNNL ESGC 2024)',stack_year:'Lit: Jahr 15 (Blume 2023, PNNL 2022)',salvage:'Lit: 35 % CAPEX (PNNL 2022, Blume 2023)'}},
};

// 8 colors: Li-Ion = 4 blues, Redox-Flow = 4 reds
const CURVE_COLORS = {
  'A-Li-Ion':     {line:'#1a3a6b', fill:'rgba(26,58,107,0.12)'},
  'B-Li-Ion':     {line:'#2979ff', fill:'rgba(41,121,255,0.12)'},
  'C-Li-Ion':     {line:'#00acc1', fill:'rgba(0,172,193,0.12)'},
  'D-Li-Ion':     {line:'#90caf9', fill:'rgba(144,202,249,0.12)'},
  'A-Redox-Flow': {line:'#6d1a1a', fill:'rgba(109,26,26,0.12)'},
  'B-Redox-Flow': {line:'#e91e8c', fill:'rgba(233,30,140,0.12)'},
  'C-Redox-Flow': {line:'#ff6d00', fill:'rgba(255,109,0,0.12)'},
  'D-Redox-Flow': {line:'#ffb3c6', fill:'rgba(255,179,198,0.12)'},
};

// State: tech as outer tab, scenario as inner selector
let activeTech = 'Li-Ion';
let myChart    = null;
const state = {
  'Li-Ion':     {A: null, B: null, C: null, D: null},
  'Redox-Flow': {A: null, B: null, C: null, D: null},
};
const tabSc = {'Li-Ion': 'A', 'Redox-Flow': 'A'};

/* ── Calculations ── */
function defParams(sc, tech) {
  const d = DEFAULTS[sc], tk = tech === 'Li-Ion' ? 'liion' : 'rf';
  return {tech, net:d.net, spread:d.spread, wacc:d.wacc, tax:d.tax,
          grid_fee:d.grid_fee, sub:d.sub, cyc:d[tk].cyc, eff:d[tk].eff,
          lifetime:d[tk].lifetime, stack_reinvest:d[tk].stack_reinvest,
          stack_year:d[tk].stack_year, salvage:d[tk].salvage};
}

function getCapex(sc, tech) {
  const t = TECH_PRESETS[sc][tech];
  return t.capex_power * t.power_mw + t.capex_energy * t.energy_mwh;
}

function computeCF(capex, cf_var, cf_fix, lifetime, wacc, deg, stack_cost, stack_year, salvage_val) {
  const years = [0], cum = [-capex];
  let payback = null;
  for (let t = 1; t <= lifetime; t++) {
    const eff_deg   = (stack_cost > 0 && t > stack_year) ? deg * 0.5 : deg;
    const deg_factor = (stack_cost > 0 && t > stack_year)
      ? Math.pow(1 - eff_deg, t - stack_year - 1)
      : Math.pow(1 - deg, t - 1);
    // Degradation wirkt nur auf durchsatzbasierte Erlöse (Arbitrage, Netzentgelt-Ersparnis),
    // nicht auf fixe Größen (OPEX, Kapazitätsprämie)
    let cf_t = (cf_var * deg_factor + cf_fix) / Math.pow(1 + wacc, t);
    if (stack_cost > 0 && t === stack_year) cf_t -= stack_cost / Math.pow(1 + wacc, t);
    if (t === lifetime && salvage_val > 0)  cf_t += salvage_val / Math.pow(1 + wacc, t);
    cum.push(cum[t-1] + cf_t);
    years.push(t);
    if (payback === null && cum[t] >= 0)
      payback = (t-1) + (-cum[t-1] / (cum[t] - cum[t-1]));
  }
  let extraPayback = null;
  if (payback === null) {
    let prev = cum[cum.length-1];
    const MAX = lifetime * 2;
    for (let i = 1; i <= MAX - lifetime; i++) {
      const t   = lifetime + i;
      const dcf = (cf_var * Math.pow(1-deg, t-1) + cf_fix) / Math.pow(1+wacc, t);
      prev += dcf;
      if (prev >= 0) { extraPayback = lifetime + i - 1 + (-( prev-dcf) / dcf); break; }
    }
  }
  return {years, cum, payback, extraPayback};
}

function calcLCOS(capex, opex, mwh, cyc, life, wacc, deg, stack_cost, salvage_val) {
  let c = capex + stack_cost - salvage_val, e = 0;
  for (let t = 1; t <= life; t++) {
    c += opex / Math.pow(1+wacc, t);
    e += cyc * mwh * Math.pow(1-deg, t-1) / Math.pow(1+wacc, t);
  }
  return e > 0 ? c / e : Infinity;
}

function calcBE(capex, opex, mwh, cyc, eff, net, gf, sub, tax, life, wacc, deg) {
  let ds_deg = 0, ds_plain = 0;
  for (let t = 1; t <= life; t++) {
    ds_deg   += Math.pow(1-deg, t-1) / Math.pow(1+wacc, t); // durchsatzbasiert (degradiert)
    ds_plain += 1 / Math.pow(1+wacc, t);                     // fix (keine Degradation)
  }
  const A = cyc * mwh * eff * (1-tax) * ds_deg;
  const B = (net * gf * mwh * cyc) * (1-tax) * ds_deg + (sub - opex) * (1-tax) * ds_plain;
  if (A <= 0) return '>600';
  const s = Math.ceil((capex - B) / A);
  return s <= 0 ? 1 : s > 600 ? '>600' : s;
}

function calc(sc, p) {
  const td  = TECH_PRESETS[sc][p.tech];
  const mwh = td.energy_mwh, deg = td.degradation, opex = td.opex_fixed;
  const cap = getCapex(sc, p.tech);
  const stack_cost  = p.tech === 'Redox-Flow' ? cap * (p.stack_reinvest||0) : 0;
  const stack_year  = parseInt(p.stack_year)||15;
  const salvage_val = cap * (p.salvage||0);
  const sub_annual = p.sub * td.power_mw * 1000;
  // Durchsatzbasierte Erlöse (Arbitrage, Netzentgelt-Ersparnis) degradieren mit der Batterie;
  // fixe Größen (OPEX, Kapazitätsprämie) sind kapazitäts-/anlagenbezogen und degradieren nicht
  const cf_var = (p.cyc*mwh*p.spread*p.eff + p.net*p.grid_fee*mwh*p.cyc) * (1-p.tax);
  const cf_fix = (sub_annual - opex) * (1-p.tax);
  const annual_cf = cf_var + cf_fix;
  const {years, cum, payback, extraPayback} = computeCF(cap, cf_var, cf_fix, p.lifetime, p.wacc, deg, stack_cost, stack_year, salvage_val);
  const lcos = calcLCOS(cap, opex, mwh, p.cyc, p.lifetime, p.wacc, deg, stack_cost, salvage_val);
  const be = calcBE(cap, opex, mwh, p.cyc, p.eff, p.net, p.grid_fee, sub_annual, p.tax, p.lifetime, p.wacc, deg);
  let paybackStr;
  if (payback !== null)           paybackStr = `${payback.toFixed(1)} Jahre`;
  else if (extraPayback !== null) paybackStr = `~${Math.round(extraPayback)} Jahre (extr.)`;
  else                            paybackStr = `> ${p.lifetime * 2} Jahre`;
  let extraPts = [];
  if (payback === null) {
    let prev = cum[cum.length-1];
    extraPts.push({x: p.lifetime, y: prev/1e6});
    for (let i = 1; i <= p.lifetime; i++) {
      const t = p.lifetime + i;
      prev += (cf_var * Math.pow(1-deg, t-1) + cf_fix) / Math.pow(1+p.wacc, t);
      extraPts.push({x: t, y: prev/1e6});
    }
  }
  return {cap, opex, annual_cf, deg, stack_cost, stack_year, salvage_val,
          arb_at: p.cyc*mwh*p.spread*p.eff*(1-p.tax),
          grid_at: p.net*p.grid_fee*mwh*p.cyc*(1-p.tax),
          opex_at: opex*(1-p.tax),
          payback, paybackStr, npv: cum[cum.length-1], lcos, be, years, cum, extraPts};
}

const f1  = v => v.toFixed(1);
const fM  = v => (v/1e6).toFixed(2)+' Mio€';
const fM1 = v => (v/1e6).toFixed(1)+' Mio€';
const sgn = v => v >= 0 ? '+' : '';

/* ── Build panel ── */
function buildPanel(tech) {
  const sc   = tabSc[tech];
  const p    = state[tech][sc] || defParams(sc, tech);
  const lit  = LIT[sc];
  const tk   = tech === 'Li-Ion' ? 'liion' : 'rf';
  const tl   = lit[tk];
  const isRF = tech === 'Redox-Flow';
  const pid  = key => `${tech.replace('-','')}_${key}`;

  const sl = (key, label, min, max, step, val, badge, litTxt) => `
    <div class="control-block">
      <div class="slider-header">
        <label for="${pid(key)}">${label}</label>
        <span class="badge" id="${pid(key)}_val">${badge}</span>
      </div>
      <input type="range" id="${pid(key)}" min="${min}" max="${max}" step="${step}" value="${val}" data-tech="${tech}" data-key="${key}">
      <div class="lit">${litTxt}</div>
    </div>`;

  const scLabels = {A:'Status quo', B:'Reform', C:'2030', D:'Förderung'};

  return `
    <div class="tab-panel ${isRF ? 'rf-mode-panel rf-panel' : 'li-panel'} sc-active-${sc}" id="panel_${tech.replace('-','')}" style="display:${tech===activeTech?'block':'none'}">
      <div class="tab-panel-header">
        <span class="tab-scenario-label">${tech === 'Li-Ion' ? 'Lithium-Ionen' : 'Vanadium Redox-Flow'}</span>
        <button class="reset-tab-btn" data-tech="${tech}">↺ Reset</button>
      </div>
      <div class="sc-toggle-inline">
        ${['A','B','C','D'].map(s => `
          <button class="sc-btn-inline ${s===sc?'active':''}" data-tech="${tech}" data-sc="${s}">
            Sz. ${s}<br><small>${scLabels[s]}</small>
          </button>`).join('')}
      </div>
      <div class="section-divider">MARKTPARAMETER</div>
      ${sl('spread','Arbitrage-Spread',20,150,5,p.spread,p.spread+' €/MWh',lit.spread)}
      ${sl('cyc','Ladezyklen',50,500,10,p.cyc,p.cyc+' /a',tl.cyc)}
      ${sl('eff','Effizienz',0.60,1.00,0.01,p.eff,p.eff.toFixed(2),tl.eff)}
      <div class="section-divider">REGULATORIK</div>
      ${sl('net','Netzentlastung §118',0,1,0.1,p.net,p.net.toFixed(1),lit.net)}
      ${sl('grid_fee','Netzentgelt',0,40,1,p.grid_fee,p.grid_fee+' €/MWh',lit.grid_fee)}
      ${sl('sub','Kapazitätsprämie',0,100,1,p.sub,p.sub+' €/MWh',lit.sub)}
      <div class="section-divider">FINANZIERUNG</div>
      ${sl('wacc','WACC',0,0.15,0.01,p.wacc,(p.wacc*100).toFixed(1)+' %',lit.wacc)}
      ${sl('lifetime','Lebensdauer',10,35,1,p.lifetime,p.lifetime+' Jahre',tl.lifetime)}
      ${sl('tax','Steuersatz',0,0.5,0.05,p.tax,(p.tax*100).toFixed(1)+' %',lit.tax)}
      ${isRF ? `
      <div class="rf-section-label" style="color:var(--rf-b)">MID-LIFE REFURBISHMENT (VRFB)</div>
      ${sl('stack_reinvest','Stack-Reinvestition',0,0.5,0.05,p.stack_reinvest,(p.stack_reinvest*100).toFixed(0)+' % CAPEX',tl.stack_reinvest)}
      ${sl('stack_year','Refurbishment-Jahr',8,20,1,p.stack_year,'Jahr '+p.stack_year,tl.stack_year)}
      ${sl('salvage','Salvage Value (Vanadium)',0,0.5,0.05,p.salvage,(p.salvage*100).toFixed(0)+' % CAPEX',tl.salvage)}
      ` : `
      <div class="rf-section-label" style="color:var(--li-b)">RECYCLING / RESTWERT (LFP)</div>
      ${sl('salvage','Recycling-Erlös (Li-Ion)',0,0.10,0.01,p.salvage,(p.salvage*100).toFixed(0)+' % CAPEX','Lit: 0 % (NREL ATB 2024) — LFP: kein Kobalt/Nickel, Netto-Restwert kontrovers')}
      `}
      <div class="section-divider">BEDIENUNG</div>
      <p class="sidebar-hint">Pfeiltasten ← → für präzise Einstellung. ↺ Reset stellt Literaturwerte wieder her.</p>
    </div>`;
}

function renderPanels() {
  document.getElementById('tab-panels').innerHTML =
    ['Li-Ion','Redox-Flow'].map(buildPanel).join('');

  document.querySelectorAll('#tab-panels input[type=range]').forEach(el => {
    el.addEventListener('input', function() {
      const tech = this.dataset.tech, key = this.dataset.key, val = parseFloat(this.value);
      const pid  = `${tech.replace('-','')}_${key}`;
      const b    = document.getElementById(`${pid}_val`);
      if (b) {
        if      (key==='wacc')          b.textContent = (val*100).toFixed(1)+' %';
        else if (key==='tax')           b.textContent = (val*100).toFixed(1)+' %';
        else if (key==='eff')           b.textContent = val.toFixed(2);
        else if (key==='net')           b.textContent = val.toFixed(1);
        else if (key==='lifetime')      b.textContent = val+' Jahre';
        else if (key==='cyc')           b.textContent = val+' /a';
        else if (key==='stack_reinvest')b.textContent = (val*100).toFixed(0)+' % CAPEX';
        else if (key==='stack_year')    b.textContent = 'Jahr '+val;
        else if (key==='salvage')       b.textContent = (val*100).toFixed(0)+' % CAPEX';
        else                            b.textContent = val+' €/MWh';
      }
      const sc = tabSc[tech];
      state[tech][sc] = readParams(tech);
      updateDirty();
      scheduleUpdate();
    });
  });

  document.querySelectorAll('.reset-tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tech = this.dataset.tech, sc = tabSc[tech];
      state[tech][sc] = defParams(sc, tech);
      renderPanels(); switchTab(activeTech); updateDirty(); runUpdate();
    });
  });

  document.querySelectorAll('.sc-btn-inline').forEach(btn => {
    btn.addEventListener('click', function() {
      const tech = this.dataset.tech, sc = this.dataset.sc;
      tabSc[tech] = sc;
      if (!state[tech][sc]) state[tech][sc] = defParams(sc, tech);
      renderPanels(); switchTab(activeTech); runUpdate();
    });
  });
}

function readParams(tech) {
  const pid  = key => `${tech.replace('-','')}_${key}`;
  const g    = key => parseFloat(document.getElementById(pid(key)).value);
  const gi   = key => parseInt(document.getElementById(pid(key)).value);
  const isRF = tech === 'Redox-Flow';
  const sr   = isRF && document.getElementById(pid('stack_reinvest')) ? g('stack_reinvest') : 0;
  const sy   = isRF && document.getElementById(pid('stack_year'))     ? gi('stack_year')    : 15;
  const sal  = document.getElementById(pid('salvage')) ? g('salvage') : 0;
  return {tech, spread:g('spread'), cyc:g('cyc'), eff:g('eff'), net:g('net'),
          grid_fee:g('grid_fee'), sub:g('sub'), wacc:g('wacc'), lifetime:gi('lifetime'),
          tax:g('tax'), stack_reinvest:sr, stack_year:sy, salvage:sal};
}

function updateDirty() {
  ['Li-Ion','Redox-Flow'].forEach(tech => {
    const sc  = tabSc[tech];
    const p   = state[tech][sc];
    const def = defParams(sc, tech);
    const keys = ['spread','cyc','eff','net','grid_fee','sub','wacc','lifetime','tax','stack_reinvest','stack_year','salvage'];
    const dirty = p && keys.some(k => Math.abs((p[k]||0)-(def[k]||0)) > 0.0001);
    document.getElementById(`tab-dirty-${tech}`).classList.toggle('hidden', !dirty);
  });
}

function switchTab(tech) {
  activeTech = tech;
  ['Li-Ion','Redox-Flow'].forEach(t => {
    document.getElementById(`tab-btn-${t}`).classList.toggle('active', t===tech);
    const panel = document.getElementById(`panel_${t.replace('-','')}`);
    if (panel) panel.style.display = t===tech ? 'block' : 'none';
  });
  renderKPI(tech, tabSc[tech]);
  runUpdate();
}

/* ── KPI + Table ── */
function renderKPI(tech, sc) {
  sc = tabSc[tech]; // immer den aktuell aktiven Stand nehmen
  const p = state[tech][sc] || defParams(sc, tech);
  const r = calc(sc, p);
  const td    = TECH_PRESETS[sc][tech];  
  const colKey = `${sc}-${tech}`;
  const color  = CURVE_COLORS[colKey]?.line || '#2563eb';
  const npvM   = r.npv / 1e6;
  const npvCls = npvM > 0 ? 'kpi-green' : npvM > -50 ? 'kpi-orange' : 'kpi-red';

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

  const ib = (formula) => `<span class="info-badge" data-formula="${formula.replace(/\n/g,'&#10;').replace(/"/g,'&quot;')}">i</span>`;

  document.getElementById('results-card').innerHTML = `
    <div class="kpi-row">
      <div class="kpi-card"><div class="kpi-label">CAPEX</div><div class="kpi-value" style="color:${color}">${f1(r.cap/1e6)}</div><div class="kpi-sub">Mio€</div></div>
      <div class="kpi-card"><div class="kpi-label">NPV (Jahr ${p.lifetime})</div><div class="kpi-value ${npvCls}">${sgn(npvM)}${f1(npvM)}</div><div class="kpi-sub">Mio€</div></div>
      <div class="kpi-card"><div class="kpi-label">Amortisation</div><div class="kpi-value" style="font-size:.9rem">${r.paybackStr}</div><div class="kpi-sub">diskontiert</div></div>
      <div class="kpi-card"><div class="kpi-label">LCOS</div><div class="kpi-value" style="color:${color}">${f1(r.lcos)}</div><div class="kpi-sub">€/MWh</div></div>
      <div class="kpi-card"><div class="kpi-label">Break-even Spread</div><div class="kpi-value" style="color:${color}">${r.be}</div><div class="kpi-sub">€/MWh mind.</div></div>
    </div>
    <div class="results-card-inner">
      <div class="results-card-header" style="background:${color}18;border-bottom:1px solid ${color}33">
        <span style="width:9px;height:9px;border-radius:50%;background:${color};display:inline-block"></span>
        ${tech} — ${SCENARIO_LABELS[sc]}
      </div>
      <table class="results-table">
        <thead><tr><th>Kennzahl</th><th>Wert</th><th>Erläuterung</th></tr></thead>
        <tbody>
          ${[
            ['CAPEX', fM1(r.cap), 'Gesamtinvestition inkl. Soft Costs',
             `Investitionskosten für 100 MW / 1.000 MWh System\nFormel: CAPEX = P_MW × c_power + E_MWh × c_energy\nEingesetzt: CAPEX = 100 MW × ${(TECH_PRESETS[sc][tech].capex_power/1000).toFixed(0)} k€/MW + 1.000 MWh × ${(TECH_PRESETS[sc][tech].capex_energy/1000).toFixed(0)} k€/MWh = ${fM1(r.cap)}\nInkl. Soft Costs (EPC, Netzanschluss, BImSchG ~18%)\nQuelle: NREL ATB 2024, Viswanathan/PNNL-33283`],
            ['Degradation/a', (r.deg*100).toFixed(2)+' %', tech==='Li-Ion' ? 'irreversibler Kapazitätsverlust/Jahr' : 'reversibler Kapazitätsverlust/Jahr',
             `Jährlicher Kapazitätsverlust des Speichers\nFormel: E_t = E_0 × (1 − δ)^(t−1)\n${tech==='Li-Ion' ? 'Li-Ion: 1.5%/a (SEI-Schichtbildung, irreversibel)\nQuelle: Aurora Energy Research 2025' : 'VRFB: 0.2%/a (reversibel durch Rebalancing)\nQuelle: Sudiarto 2026, Blume 2023, Guarnieri 2023'}`],
            ...(r.stack_cost > 0 ? [[`Mid-life Refurbishment (Jahr ${r.stack_year})`, '−'+fM1(r.stack_cost), 'Einmalige Reinvestition Stacks & Pumpen',
             `Einmalige Reinvestition in Stacks & Pumpen\nFormel: Reinvestition = CAPEX × Stack-Anteil\nEingesetzt: Reinvestition = ${fM1(r.cap)} × ${(p.stack_reinvest*100).toFixed(0)}% = ${fM1(r.stack_cost)}\nElektrolyt & Tanks bleiben erhalten (Wert ~40% CAPEX)\nQuelle: Viswanathan/PNNL-33283`]] : []),
            ...(r.salvage_val > 0 ? [[`Salvage Value ${tech==='Li-Ion'?'Li-Ion (LFP)':'Vanadium'} (Jahr ${p.lifetime})`, '+'+fM1(r.salvage_val),
             tech==='Li-Ion' ? 'Recycling-Restwert LFP (Sensitivität)' : 'Restwert Vanadium-Elektrolyt am Ende',
             `Restwert des Vanadium-Elektrolyts am Laufzeitende\nFormel: RV = V_total × P_V × (1 − L_rec)\nNäherung: RV = CAPEX × Salvage-Rate\nEingesetzt: RV = ${fM1(r.cap)} × ${(p.salvage*100).toFixed(0)}% = ${fM1(r.salvage_val)}\nVerlustrate Recycling: ~2–5% (L_rec)\nQuelle: PNNL 2022, Blume 2023`]] : []),
            ['Arbitrage-Erlös', fM(r.arb_at)+'/a', 'Spotmarkt-Erlös nach Steuer',
             `Erlös aus Preisarbitrage im Spotmarkt\nFormel: Arb = Zyklen × E_MWh × Spread × η × (1 − τ)\nEingesetzt: Arb = ${p.cyc} × 1.000 × ${p.spread} € × ${p.eff} × (1 − ${p.tax}) = ${fM(r.arb_at)}/a\nQuelle: SMARD 2023–25, Aurora/Agora 2025`],
            ['Netzentgelt-Ersparnis', fM(r.grid_at)+'/a', '§118 EnWG Befreiung nach Steuer',
             `Ersparnis durch §118 EnWG Netzentgeltbefreiung\nFormel: NE = §118-Faktor × Entgelt × E_MWh × Zyklen × (1 − τ)\nEingesetzt: NE = ${p.net} × ${p.grid_fee} € × 1.000 × ${p.cyc} × (1 − ${p.tax}) = ${fM(r.grid_at)}/a\nQuelle: BNetzA 2024, §118 EnWG`],
            ['Kapazitätsprämie', fM(p.sub > 0 ? p.sub * td.power_mw * 1000 * (1-p.tax) : 0)+'/a', 'Politische Förderung nach Steuer',
             `Jährliche Kapazitätsprämie (politische Förderung)\nFormel: Prämie = sub × E_MWh × (1 − τ)\nEingesetzt: Prämie = ${p.sub} €/MWh × 1.000 MWh × (1 − ${p.tax}) = ${fM(p.sub * 1000 * (1-p.tax))}/a\nOrientierung: UK Capacity Market, Agora 2025`],
            ['OPEX (fix)', '−'+fM(r.opex_at)+'/a', 'Betriebs- & Wartungskosten nach Steuer',
             `Jährliche Betriebs- & Wartungskosten (fix)\nFormel: OPEX_netto = OPEX × (1 − τ)\nEingesetzt: OPEX_netto = ${fM(r.opex)} × (1 − ${p.tax}) = ${fM(r.opex_at)}/a\nSteuerlich als Betriebsausgabe absetzbar\nQuelle: NREL ATB 2024, PNNL-33283`],
            ['Jährl. Cashflow', fM(r.annual_cf)+'/a', 'Netto-Erlös Jahr 1 nach Steuer & OPEX',
             `Netto-Cashflow im ersten Betriebsjahr\nFormel: CF = (Arb + NE + Sub − OPEX) × (1 − τ)\nEingesetzt: CF = (${fM(r.arb_at)} + ${fM(r.grid_at)} − ${fM(r.opex_at)}) = ${fM(r.annual_cf)}/a\nArb & NE sinken jährlich durch Degradation (δ = ${(r.deg*100).toFixed(2)}%); OPEX & Prämie sind kapazitätsbezogen und bleiben konstant\nWACC = ${(p.wacc*100).toFixed(1)}% (Kost et al. 2024, Fraunhofer ISE)`],
            ['LCOS', f1(r.lcos)+' €/MWh', 'Kosten je gespeicherter MWh (diskontiert)',
             `Durchschnittliche Kosten je gespeicherter MWh\nFormel: LCOS = (CAPEX + Σ OPEX_t/(1+r)^t) / Σ E_t/(1+r)^t\nWACC = ${(p.wacc*100).toFixed(1)}%, Lebensdauer = ${p.lifetime}a\nMethodik: NREL, Lazard LCOS v16\nEingesetzt: LCOS = (CAPEX + Σ OPEX_t) / Σ E_t = ${f1(r.lcos)} €/MWh`],
            ['Break-even Spread', r.be+' €/MWh', 'Mindest-Spread für Kostendeckung (NPV = 0)',
             `Mindest-Arbitrage-Spread für NPV = 0\nFormel: s* = (CAPEX − B) / A\nA = Zyklen × MWh × η × (1−τ) × Σ Diskontfaktoren\nB = (NE + Sub − OPEX) × (1−τ) × Σ Diskontfaktoren\nEingesetzt: s* = (CAPEX − B) / A = ${r.be} €/MWh\nAktueller Spread: ${p.spread} €/MWh`],
          ].map(([k,v,n,formula]) => `
            <tr>
              <td class="td-key">${k} ${formula ? ib(formula) : ''}</td>
              <td class="td-val">${v}</td>
              <td class="td-note">${n}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="results-status" style="background:${stColor}15;color:${stColor};border-top:1px solid ${stColor}33">${stText}</div>
    </div>`;
}

/* ── Chart controls (8 checkboxes) ── */
function renderChartControls() {
  const container = document.getElementById('chart-controls');
  const liEntries = [
    ['li-a', 'A-Li-Ion',     'A: Status quo'],
    ['li-b', 'B-Li-Ion',     'B: Reform'],
    ['li-c', 'C-Li-Ion',     'C: 2030'],
    ['li-d', 'D-Li-Ion',     'D: Förderung'],
  ];
  const rfEntries = [
    ['rf-a', 'A-Redox-Flow', 'A: Status quo'],
    ['rf-b', 'B-Redox-Flow', 'B: Reform'],
    ['rf-c', 'C-Redox-Flow', 'C: 2030'],
    ['rf-d', 'D-Redox-Flow', 'D: Förderung'],
  ];

  const makeChips = (entries) => entries.map(([id, key, label]) => {
    const col = CURVE_COLORS[key].line;
    const isLight = key === 'D-Li-Ion' || key === 'D-Redox-Flow';
    const textCol = isLight ? '#1a1d2e' : '#fff';
    return `<label class="chart-check" style="background:${col};border-color:${col};color:${textCol}">
      <input type="checkbox" id="show-${id}" checked style="accent-color:${textCol}">
      <span>${label}</span>
    </label>`;
  }).join('');

  container.innerHTML = `
    <div class="chart-controls-group">
      <span class="chart-controls-label">Li-Ion</span>
      <div class="chart-controls-chips">${makeChips(liEntries)}</div>
    </div>
    <div class="chart-controls-group">
      <span class="chart-controls-label">VRFB</span>
      <div class="chart-controls-chips">${makeChips(rfEntries)}</div>
    </div>`;

  [...liEntries, ...rfEntries].forEach(([id]) => {
    document.getElementById(`show-${id}`).addEventListener('change', renderChart);
  });
}

/* ── Chart ── */
function renderChart() {
  const datasets = [];
  const lifetimeLines = [];
  let xMax = 25;

  const entries = [
    ['li-a', 'A', 'Li-Ion'],
    ['li-b', 'B', 'Li-Ion'],
    ['li-c', 'C', 'Li-Ion'],
    ['li-d', 'D', 'Li-Ion'],
    ['rf-a', 'A', 'Redox-Flow'],
    ['rf-b', 'B', 'Redox-Flow'],
    ['rf-c', 'C', 'Redox-Flow'],
    ['rf-d', 'D', 'Redox-Flow'],
  ];

  entries.forEach(([cbId, sc, tech]) => {
    const cb = document.getElementById(`show-${cbId}`);
    if (!cb || !cb.checked) return;
    const p   = state[tech][sc] || defParams(sc, tech);
    const r   = calc(sc, p);
    const col = CURVE_COLORS[`${sc}-${tech}`];
    const mainPts = r.years.map((y,i) => ({x:y, y:r.cum[i]/1e6}));

    datasets.push({
      label:            `Sz. ${sc}: ${tech === 'Li-Ion' ? 'Li-Ion' : 'VRFB'}`,
      data:             mainPts,
      borderColor:      col.line,
      backgroundColor:  col.fill,
      borderWidth:      2.75,
      pointRadius:      0,
      pointHoverRadius: 5,
      fill:             false,
      tension:          0.3,
    });

    xMax = Math.max(xMax, p.lifetime + 4);
    // Store tech and sc alongside line info for correct labeling
    lifetimeLines.push({x: p.lifetime, npv: r.npv/1e6, color: col.line, tech, sc});
  });

  if (myChart) { myChart.destroy(); myChart = null; }
  if (datasets.length === 0) return;

  const whiteBgPlugin = {
    id: 'whiteBg',
    beforeDraw(chart) {
      const ctx = chart.ctx;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    }
  };

  const lifetimePlugin = {
    id: 'lifetimeLines',
    afterDraw(chart) {
      const ctx = chart.ctx, xA = chart.scales.x, yA = chart.scales.y;

      const rendered = lifetimeLines.map(({x, npv, color, tech, sc}) => ({
        x, npv, color, tech, sc,
        xPx: xA.getPixelForValue(x),
        yPx: yA.getPixelForValue(npv),
      }));

      // Spread overlapping labels vertically
      const labelOffsets = rendered.map(() => 0);
      for (let i = 0; i < rendered.length; i++) {
        for (let j = i + 1; j < rendered.length; j++) {
          const dx = Math.abs(rendered[i].xPx - rendered[j].xPx);
          const dy = Math.abs(rendered[i].yPx - rendered[j].yPx);
          if (dx < 40 && dy < 28) {
            labelOffsets[i] = -14;
            labelOffsets[j] = +14;
          }
        }
      }

      // Draw lifetime end markers
      rendered.forEach((item, idx) => {
        const {xPx, yPx, npv, color, tech} = item;
        const yBot = yA.bottom;
        const labelY = yPx + labelOffsets[idx];
        const techShort = tech === 'Li-Ion' ? 'Li-Ion' : 'VRFB';

        // Dashed vertical line
        ctx.save();
        ctx.beginPath(); ctx.setLineDash([5,4]);
        ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.6;
        ctx.moveTo(xPx, yBot); ctx.lineTo(xPx, yPx); ctx.stroke();

        // Dot at end of curve
        ctx.beginPath(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        ctx.fillStyle = color; ctx.arc(xPx, yPx, 4, 0, Math.PI*2); ctx.fill();

        // NPV label in black
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 13px Segoe UI,sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${npv.toFixed(1)} Mio€`, xPx+6, labelY+4);

        // "Ende LZ" label just above x axis in black
        // If two labels share the same x pixel, offset one up and one down
        const sameXItems = rendered.filter(r2 => Math.abs(r2.xPx - xPx) < 5);
        const myRank = sameXItems.indexOf(item);
        const stackOffset = sameXItems.length > 1 ? (myRank === 0 ? -16 : 0) : 0;
        ctx.fillStyle = '#333333';
        ctx.font = '12px Segoe UI,sans-serif';
        ctx.globalAlpha = 1;
        ctx.textAlign = 'center';
        ctx.fillText(`Ende LZ ${techShort}`, xPx, yBot - 6 + stackOffset);
        ctx.restore();
      });

      // Draw Stack-Reinvestition and Salvage Value annotations for VRFB curves only
      // Use a Set to avoid drawing duplicate annotations when multiple VRFB scenarios share stack_year
      const drawnStackYears = new Set();
      entries.forEach(([cbId, sc, tech]) => {
        const cb = document.getElementById(`show-${cbId}`);
        if (!cb || !cb.checked) return;
        if (tech !== 'Redox-Flow') return;

        const p   = state[tech][sc] || defParams(sc, tech);
        const col = CURVE_COLORS[`${sc}-${tech}`].line;
        const r   = calc(sc, p);

        // Stack-Reinvestition: draw label with leader line, clamped above x-axis
        if (p.stack_reinvest > 0 && !drawnStackYears.has(`${sc}-${p.stack_year}`)) {
          drawnStackYears.add(`${sc}-${p.stack_year}`);
          const stackX    = xA.getPixelForValue(p.stack_year);
          const stackNPV  = r.cum[p.stack_year] / 1e6;
          const stackY    = yA.getPixelForValue(stackNPV);
          const labelEndX = stackX - 40;
          // Clamp label so it stays at least 30px above x-axis
          const rawStackLabelY = stackY + 30;
          const labelEndY = Math.min(rawStackLabelY, yA.bottom - 30);
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = col;
          ctx.lineWidth   = 1.2;
          ctx.globalAlpha = 0.8;
          ctx.moveTo(stackX, stackY);
          ctx.lineTo(labelEndX, labelEndY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle   = '#333333';
          ctx.font        = 'italic 12px Segoe UI,sans-serif';
          ctx.globalAlpha = 1;
          ctx.textAlign   = 'right';
          ctx.fillText('Stack-Reinvestition', labelEndX - 2, labelEndY + 4);
          ctx.restore();
        }

        // Salvage Value: label with dashed leader line
        // If curve is low (near x-axis), draw label above-right instead of below-right
        if (p.salvage > 0) {
          const salvX   = xA.getPixelForValue(p.lifetime);
          const salvNPV = r.npv / 1e6;
          const salvY   = yA.getPixelForValue(salvNPV);
          const spaceBelow = yA.bottom - salvY;
          const goAbove = spaceBelow < 80;
          const labelX  = salvX + 20;
          const labelY  = goAbove ? salvY - 30 : Math.min(salvY + 35, yA.bottom - 30);
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = col;
          ctx.lineWidth   = 1.2;
          ctx.globalAlpha = 0.8;
          ctx.moveTo(salvX, salvY);
          ctx.lineTo(labelX, labelY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle   = '#333333';
          ctx.font        = 'italic 12px Segoe UI,sans-serif';
          ctx.globalAlpha = 1;
          ctx.textAlign   = 'left';
          ctx.fillText('Salvage Value', labelX + 2, labelY + 4);
          ctx.restore();
        }
      });
    }
  };
  

  myChart = new Chart(document.getElementById('chart'), {
    type: 'line',
    data: {datasets},
    plugins: [whiteBgPlugin, lifetimePlugin],
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: {mode:'index', intersect:false},
      scales: {
        x: {type:'linear', min:0, max:30,
            title:{display:true, text:'Jahr', color:'#6b7280', font:{size:14}},
            grid:{color:'#e5e7eb'}, ticks:{color:'#6b7280', stepSize:5, font:{size:13}}},
        y: {min:-450, max:100,
            title:{display:true, text:'Kumulierter Kapitalwert [Mio€]', color:'#6b7280', font:{size:14}},
            grid:{color:'#e5e7eb'}, ticks:{color:'#6b7280', stepSize:50, font:{size:13}, callback:v=>v+' Mio€'}},
      },
      plugins: {
        legend: {display: true, labels: {color:'#1a1d2e', font:{size:14}, boxWidth:24, padding:10, usePointStyle: false,
          generateLabels(chart) {
            return chart.data.datasets.map((ds, i) => ({
              text: ds.label,
              fillStyle: ds.borderColor,
              strokeStyle: ds.borderColor,
              lineWidth: 0,
              hidden: !chart.isDatasetVisible(i),
              datasetIndex: i,
            }));
          }
        }},
        tooltip: {
          backgroundColor:'#ffffffee', borderColor:'#dde1ea', borderWidth:1,
          titleColor:'#1a1d2e', bodyColor:'#6b7280',
          callbacks: {
            title: items => `Jahr ${items[0].parsed.x}`,
            label: item  => ` ${item.dataset.label}: ${item.parsed.y.toFixed(1)} Mio€`,
          },
        },
      },
    },
  });
}

/* ── Update ── */
let timer = null;
function scheduleUpdate() { clearTimeout(timer); timer = setTimeout(runUpdate, 80); }
function runUpdate() {
  const tech = activeTech;
  const sc   = tabSc[tech]; // aktuellen Szenario-Stand holen
  const pid  = key => `${tech.replace('-','')}_${key}`;
  if (document.getElementById(pid('spread'))) state[tech][sc] = readParams(tech);
  renderKPI(tech, sc);
  renderChart();
  updateDirty();
}

/* ── Export CSV ── */
function exportCSV() {
  const rows = [['Technologie','Szenario','Kennzahl','Wert','Einheit'].join(';')];
  ['Li-Ion','Redox-Flow'].forEach(tech => {
    ['A','B','C','D'].forEach(sc => {
      const p = state[tech][sc] || defParams(sc, tech);
      const r = calc(sc, p);
      [['CAPEX',(r.cap/1e6).toFixed(2),'Mio€'],['NPV',(r.npv/1e6).toFixed(2),'Mio€'],
       ['LCOS',r.lcos.toFixed(1),'€/MWh'],['BE-Spread',r.be,'€/MWh'],
       ['Amortisation',r.paybackStr,'']
      ].forEach(([k,v,u]) => rows.push([tech,`Sz.${sc}`,k,v,u].join(';')));
    });
  });
  Object.assign(document.createElement('a'),{
    href: URL.createObjectURL(new Blob(['\uFEFF'+rows.join('\n')],{type:'text/csv;charset=utf-8;'})),
    download:'ldes_alle_szenarien.csv'
  }).click();
}

/* ── Init ── */
['Li-Ion','Redox-Flow'].forEach(tech => {
  ['A','B','C','D'].forEach(sc => { state[tech][sc] = defParams(sc, tech); });
});
renderPanels();
renderChartControls();
['Li-Ion','Redox-Flow'].forEach(tech => {
  document.getElementById(`tab-btn-${tech}`).addEventListener('click', () => {
    switchTab(tech); renderChart();
  });
});
document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
document.getElementById('btn-export-png').addEventListener('click', () => {
  if (!myChart) return;
  Object.assign(document.createElement('a'),{
    href: myChart.toBase64Image('image/png',1.0), download:'ldes_chart.png'
  }).click();
});
switchTab('Li-Ion');
setTimeout(runUpdate, 100);

/* ── Tutorial ── */
function initTutorial() {
  const backdrop = document.getElementById('tutorial-backdrop');
  const steps    = document.querySelectorAll('.tutorial-step');

  function showStep(n) {
    steps.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`tut-step-${n}`);
    if (target) target.classList.add('active');
  }

  function closeTutorial() {
    backdrop.classList.add('hidden');
    try { localStorage.setItem('ldes_tutorial_done', '1'); } catch(e) {}
  }

  function openTutorial() {
    backdrop.classList.remove('hidden');
    showStep(1);
  }

  document.getElementById('tut-start').addEventListener('click', () => showStep(2));
  document.getElementById('tut-skip').addEventListener('click', closeTutorial);
  document.getElementById('tut-finish').addEventListener('click', closeTutorial);

  document.querySelectorAll('.tut-btn-next[data-step]').forEach(btn => {
    btn.addEventListener('click', () => showStep(parseInt(btn.dataset.step)));
  });

  document.querySelectorAll('.tut-btn-back[data-step]').forEach(btn => {
    btn.addEventListener('click', () => showStep(parseInt(btn.dataset.step)));
  });

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closeTutorial();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !backdrop.classList.contains('hidden')) closeTutorial();
  });

  document.getElementById('btn-tutorial').addEventListener('click', openTutorial);

  let seen = false;
  try { seen = localStorage.getItem('ldes_tutorial_done') === '1'; } catch(e) {}
  if (!seen) openTutorial();
}

setTimeout(initTutorial, 150);