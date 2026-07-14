// MICKKK.com — Config & Constants
// API URL, Capital, Trade Data, Helper Calculations
// Loaded before journal-logic.js

(function(){
  const dl=document.getElementById('ticker-datalist');
  dl.innerHTML=NSE_TICKERS.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join('');
})();
const API_URL='https://script.google.com/macros/s/AKfycbx01mO_3odTmKfXu2SqoGrpQVftQ8f4jAb6ix6IROX_3qJ3wj4M5ke6tG8SyttSS-amOQ/exec';
const BROKERAGE=40;
const PORTFOLIO_CAPITAL=300000;
const MAX_RISK_PCT=2.0;
let charts=[];
let trades=[], activeFilter='all', ltpCache={}, sortField='none', sortDir='desc';

const INITIAL_TRADES=[
  {symbol:'ACMESOLAR',type:'Swing',dir:'B',entry:269.21,exit:298.27,qty:765,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'AGIIL',type:'Swing',dir:'B',entry:397,exit:386.39,qty:690,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'ARE&M',type:'Swing',dir:'B',entry:869.45,exit:854.14,qty:116,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'ATHERENERG',type:'Swing',dir:'B',entry:961.81,exit:936,qty:100,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'AWHCL',type:'Swing',dir:'B',entry:521,exit:509,qty:195,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'AYE',type:'Swing',dir:'B',entry:142.01,exit:137.07,qty:1705,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'BLISSGVS',type:'Swing',dir:'B',entry:281.3,exit:342.5,qty:700,sl:null,target:null,edate:'2026-05-19',xdate:'',notes:''},
  {symbol:'CANHLIFE',type:'Swing',dir:'B',entry:146.15,exit:145,qty:501,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'CEAT',type:'Swing',dir:'B',entry:3729.5,exit:3705,qty:15,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'CLEANMAX',type:'Swing',dir:'B',entry:1025.41,exit:1316.35,qty:100,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'CONFIPET',type:'Swing',dir:'B',entry:60.88,exit:59.05,qty:1000,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'EIEL',type:'Swing',dir:'B',entry:200.78,exit:210.2,qty:1381,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'FINCABLES',type:'Swing',dir:'B',entry:1165.5,exit:999.23,qty:175,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'FIRSTCRY',type:'Swing',dir:'B',entry:253,exit:247,qty:175,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'FRACTAL',type:'Swing',dir:'B',entry:972.25,exit:963,qty:55,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'GAUDIUMIVF',type:'Swing',dir:'B',entry:97.5,exit:115.7,qty:450,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'GMDCLTD',type:'Swing',dir:'B',entry:604.62,exit:663.7,qty:416,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'GOKULAGRO',type:'Swing',dir:'B',entry:196.16,exit:193.34,qty:754,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'GREAVESCOT',type:'Swing',dir:'B',entry:167,exit:164.68,qty:598,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'GUTTHEM',type:'Swing',dir:'B',entry:365.4,exit:null,qty:445,sl:null,target:null,edate:'2026-05-22',xdate:'',notes:'Open Position'},
  {symbol:'HAPPYFORGE',type:'Swing',dir:'B',entry:1386,exit:1387,qty:72,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'HONASA',type:'Swing',dir:'B',entry:419.65,exit:407.93,qty:250,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'IIFLCAPS',type:'Swing',dir:'B',entry:341.2,exit:340.63,qty:290,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'INA',type:'Swing',dir:'B',entry:99.2,exit:115,qty:500,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'IRMENERGY',type:'Swing',dir:'B',entry:280.92,exit:270.81,qty:1060,sl:null,target:null,edate:'2025-05-19',xdate:'',notes:''},
  {symbol:'ITI',type:'Swing',dir:'B',entry:291,exit:300,qty:345,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'JINDRILL',type:'Swing',dir:'B',entry:548,exit:540.3,qty:125,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'KIRLOSENG',type:'Swing',dir:'B',entry:2526,exit:2509.7,qty:10,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'KMEW',type:'Swing',dir:'B',entry:2043.33,exit:1958.03,qty:149,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'KRN',type:'Swing',dir:'B',entry:951.8,exit:964,qty:51,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'LLOYDSENGG',type:'Swing',dir:'B',entry:70.5,exit:null,qty:2000,sl:null,target:null,edate:'2026-06-15',xdate:'',notes:'Open Position'},
  {symbol:'LUXIND',type:'Swing',dir:'B',entry:1446,exit:1371.69,qty:70,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'LXCHEM',type:'Swing',dir:'B',entry:160.35,exit:154,qty:600,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'MANALIPETC',type:'Swing',dir:'B',entry:64.34,exit:63.81,qty:1500,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'MARSONS',type:'Swing',dir:'B',entry:154.5,exit:161.83,qty:644,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'MEESHO',type:'Swing',dir:'B',entry:184,exit:181,qty:549,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'MOTILALOFS',type:'Swing',dir:'B',entry:858,exit:860,qty:120,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'NELCAST',type:'Swing',dir:'B',entry:120,exit:119,qty:218,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'NETWEB',type:'Swing',dir:'B',entry:4368.3,exit:4333,qty:10,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'NORTHARC',type:'Swing',dir:'B',entry:282,exit:281.64,qty:370,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'OLECTRA',type:'Swing',dir:'B',entry:1130.15,exit:1255.66,qty:177,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'PAISALA',type:'Swing',dir:'B',entry:60.05,exit:59.84,qty:1000,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'PIRAMLAFIN',type:'Swing',dir:'B',entry:1942.23,exit:1890.84,qty:146,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'PREWIRE',type:'Swing',dir:'B',entry:447.25,exit:425.03,qty:225,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'ROSSTECH',type:'Swing',dir:'B',entry:985.02,exit:890.74,qty:102,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'RPSGVENT',type:'Swing',dir:'B',entry:896,exit:865,qty:113,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'SANDHAR',type:'Swing',dir:'B',entry:707.95,exit:688.51,qty:140,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'SANGVIMOV',type:'Swing',dir:'B',entry:382.26,exit:406.92,qty:140,sl:null,target:null,edate:'2026-06-17',xdate:'',notes:''},
  {symbol:'SANSERA',type:'Swing',dir:'B',entry:2929.56,exit:2843.95,qty:51,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'SCI',type:'Swing',dir:'B',entry:314.58,exit:null,qty:249,sl:null,target:null,edate:'2026-06-18',xdate:'',notes:'Open Position'},
  {symbol:'SEDEMAC',type:'Swing',dir:'B',entry:1790.57,exit:1790.1,qty:150,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'SPARC',type:'Swing',dir:'B',entry:141.8,exit:144.97,qty:995,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'SUNFLAG',type:'Swing',dir:'B',entry:379.88,exit:357.35,qty:518,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'SUVEN LIFE SCIENCE',type:'Swing',dir:'B',entry:272.62,exit:257.67,qty:1100,sl:null,target:null,edate:'2026-06-17',xdate:'',notes:''},
  {symbol:'TDPOWERSYS',type:'Swing',dir:'B',entry:1240.61,exit:1299.58,qty:161,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'TEXRAIL',type:'Swing',dir:'B',entry:107.3,exit:107,qty:900,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'THERMAX',type:'Swing',dir:'B',entry:4729.24,exit:4563.21,qty:46,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'TRITURBINE',type:'Swing',dir:'B',entry:578.01,exit:567.04,qty:346,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'VIDHYAWIRES',type:'Swing',dir:'B',entry:95.97,exit:93,qty:1000,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'WELCORP',type:'Swing',dir:'B',entry:1437.7,exit:1399.2,qty:75,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'WELCORP',type:'Swing',dir:'B',entry:1425,exit:null,qty:100,sl:null,target:null,edate:'',xdate:'',notes:'Open Position'},
  {symbol:'WOCKPHARMA',type:'Swing',dir:'B',entry:1942.63,exit:null,qty:76,sl:null,target:null,edate:'2026-06-17',xdate:'',notes:'Open Position'},
  {symbol:'VINDHYATEL',type:'Swing',dir:'B',entry:1667.71,exit:1609,qty:60,sl:null,target:null,edate:'',xdate:'',notes:''},
  {symbol:'ZAGGLE',type:'Swing',dir:'B',entry:265,exit:253.4,qty:350,sl:null,target:null,edate:'',xdate:'',notes:''},
];

/* ============ SHARED ============ */
function calcPnL(t){if(!t.exit)return null;const g=t.dir==='B'?(+t.exit-+t.entry)*+t.qty:(+t.entry-+t.exit)*+t.qty;return g-BROKERAGE;}
function outcome(t){if(!t.exit)return'OPEN';const p=calcPnL(t);return p>0?'WIN':p<0?'LOSS':'BE';}

function toast(msg,err,dur=3000){
  const el=document.getElementById('status');
  el.textContent=msg;el.className='show'+(err?' err':'');
  setTimeout(()=>el.className='',dur);
}

/* ============ SIDEBAR VIEW SWITCHING ============ */
function switchView(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  document.querySelectorAll('.side-link').forEach(b=>b.classList.remove('active'));
  const btn=document.querySelector(`.side-link[data-view="${view}"]`);
  if(btn)btn.classList.add('active');
  if(history.replaceState) history.replaceState(null,'','#'+view);
  if(view==='positions') renderPositions();
  if(view==='dashboard') loadDashboard();
  if(view==='analytics') renderAnalytics();
  if(view==='watchlist') renderWatchlist();
  if(view==='tools'){ calcPositionSizing(); calcRMultiple(); }
}

/* =========================================================
   JOURNAL
   ========================================================= */
async function refreshLTP(){
  const openSyms=[...new Set(trades.filter(t=>outcome(t)==='OPEN').map(t=>t.symbol))];
  if(!openSyms.length){toast('Koi open position nahi hai',true);return;}
  const btn=document.getElementById('ltp-btn');
  if(btn){btn.disabled=true;btn.textContent='⏳ Fetching…';}
  try{
    const d=await(await fetch(`${API_URL}?action=ltp&symbols=${encodeURIComponent(openSyms.join(','))}`)).json();
    ltpCache={...ltpCache,...(d.prices||{})};
    renderTable();
    toast('✓ LTP updated for '+openSyms.length+' symbols');
  }catch(e){console.error('refreshLTP error:',e);toast('LTP fetch fail — '+e.message,true,6000);}
  if(btn){btn.disabled=false;btn.textContent='🔄 Refresh LTP';}
}

function retPct(t){const p=calcPnL(t);return p===null?null:(p/(t.entry*t.qty))*100;}
function fmtPnL(p){if(p===null)return'⏳';return(p>=0?'+₹':'-₹')+Math.abs(p).toFixed(0);}
function fmtPct(p){if(p===null)return'—';return(p>=0?'+':'')+p.toFixed(2)+'%';}

// Setup tag is packed into notes as a leading "#Tag " token so no backend schema change is needed
function parseSetup(notes){
  const m=(notes||'').match(/^#([A-Za-z0-9 ]+?)#\s*/);
  return m?{setup:m[1],rest:(notes||'').slice(m[0].length)}:{setup:'',rest:notes||''};
}
function packNotes(setup,rest){
  return (setup?`#${setup}# `:'')+(rest||'');
}
function exportCSV(){
  const rows=[['Symbol','Type','Direction','Entry','Exit','Qty','SL','Target','Net P&L','Return%','Outcome','Setup','Entry Date','Exit Date','Notes']];
  trades.forEach(t=>{
    const p=calcPnL(t),o=outcome(t),{setup,rest}=parseSetup(t.notes);
    rows.push([t.symbol,t.type,t.dir==='B'?'LONG':'SHORT',t.entry,t.exit||'',t.qty,t.sl||'',t.target||'',p===null?'':p.toFixed(2),retPct(t)===null?'':retPct(t).toFixed(2),o,setup,t.edate||'',t.xdate||'',rest]);
  });
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='mickkk_trades_'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();
}

