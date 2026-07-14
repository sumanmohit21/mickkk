// MICKKK.com — Journal Logic
// All functions: loadTrades, renderTable, openModal, 
// renderDashboard, renderAnalytics, tools, watchlist
// Depends on: tickers.js, journal-config.js

async function loadTrades(){
  try{
    const d=await(await fetch(`${API_URL}?action=getTrades`)).json();
    trades=d.trades||[];
    if(trades.length===0){
      toast('Pehli baar — saare trades import ho rahe hain…',false,8000);
      for(const t of INITIAL_TRADES) await(await fetch(API_URL,{method:'POST',body:JSON.stringify({action:'addTrade',trade:t})})).json();
      const d2=await(await fetch(`${API_URL}?action=getTrades`)).json();
      trades=d2.trades||[];
      toast('✓ Saare '+trades.length+' trades import ho gaye!');
    }
  }catch(e){console.error('loadTrades error:',e);toast('Google Sheet connect nahi hua — '+e.message,true,6000);}
  renderStats(); renderTable();
}

function renderStats(){
  const closed=trades.filter(t=>outcome(t)!=='OPEN');
  const open=trades.filter(t=>outcome(t)==='OPEN');
  const wins=closed.filter(t=>outcome(t)==='WIN');
  const losses=closed.filter(t=>outcome(t)==='LOSS');
  const netPnL=closed.reduce((s,t)=>s+calcPnL(t),0);
  const wr=closed.length?(wins.length/closed.length*100):0;
  const el=(id,v,cls)=>{const e=document.getElementById(id);e.textContent=v;if(cls)e.className='ms-val '+cls;};
  el('ms-pnl',(netPnL>=0?'+₹':'-₹')+Math.abs(netPnL).toFixed(0),netPnL>=0?'g':'r');
  el('ms-total',trades.length,'b');
  el('ms-wr',wr.toFixed(1)+'%','a');
  el('ms-open',open.length,'a');
  el('ms-wins',wins.length,'g');
  el('ms-losses',losses.length,'r');
}

function renderTable(){
  const q=document.getElementById('search').value.toLowerCase();
  let filtered=trades.filter(t=>{
    if(q&&!t.symbol.toLowerCase().includes(q)&&!(t.notes||'').toLowerCase().includes(q))return false;
    const o=outcome(t);
    if(activeFilter==='open'&&o!=='OPEN')return false;
    if(activeFilter==='win'&&o!=='WIN')return false;
    if(activeFilter==='loss'&&o!=='LOSS')return false;
    return true;
  });
  if(sortField!=='none'){
    filtered=[...filtered].sort((a,b)=>{
      const av=a[sortField]||'', bv=b[sortField]||'';
      if(!av&&!bv)return 0;
      if(!av)return 1; // blank dates go to bottom
      if(!bv)return -1;
      return sortDir==='asc'?av.localeCompare(bv):bv.localeCompare(av);
    });
  }
  const tbody=document.getElementById('tbody');
  if(!filtered.length){tbody.innerHTML=`<tr><td colspan="20"><div class="empty">Koi trade nahi mila</div></td></tr>`;return;}
  tbody.innerHTML=filtered.map((t,i)=>{
    const p=calcPnL(t),o=outcome(t),pc=retPct(t);
    const pc2=p===null?'neu':p>0?'pos':'neg';
    const bc=o==='WIN'?'win':o==='LOSS'?'loss':o==='OPEN'?'open':'be';
    const bt=o==='WIN'?'✅ WIN':o==='LOSS'?'❌ LOSS':o==='OPEN'?'⏳ OPEN':'➖ BE';
    const {setup,rest}=parseSetup(t.notes);
    const setupBadge=setup?`<span style="display:inline-block;font-size:9.5px;font-weight:600;padding:1px 7px;border-radius:20px;background:rgba(0,212,255,0.1);color:var(--accent);margin-right:5px">${setup}</span>`:'';
    const ltpVal=ltpCache[t.symbol];
    let ltpCell='<span style="color:var(--muted)">—</span>';
    if(o==='OPEN'&&ltpVal){
      const unreal=(t.dir==='B'?(ltpVal-t.entry):(t.entry-ltpVal))*t.qty;
      ltpCell=`₹${ltpVal.toFixed(2)}<br><span style="font-size:10px;color:${unreal>=0?'var(--green)':'var(--red)'}">${unreal>=0?'+':''}₹${unreal.toFixed(0)}</span>`;
    }
    // R:R Ratio
    const rrVal=(t.sl&&t.target&&t.entry)?Math.abs((+t.target-+t.entry)/((+t.entry-+t.sl)||1)):null;
    const rrColor=rrVal===null?'var(--muted)':rrVal>=2?'var(--green)':rrVal>=1?'var(--amber)':'var(--red)';
    const rrCell=rrVal!==null?`<span style="color:${rrColor};font-weight:600">${rrVal.toFixed(2)}R</span>`:'<span style="color:var(--muted)">—</span>';
    // Portfolio Risk %
    const riskAmt=t.sl&&t.entry&&t.qty?Math.abs((+t.entry-+t.sl)*(+t.qty)):null;
    const portRisk=riskAmt?(riskAmt/PORTFOLIO_CAPITAL*100):null;
    const riskColor=portRisk===null?'var(--muted)':portRisk<=1?'var(--green)':portRisk<=2?'var(--amber)':'var(--red)';
    const riskCell=portRisk!==null?`<span style="color:${riskColor};font-weight:600">${portRisk.toFixed(2)}%</span>`:'<span style="color:var(--muted)">—</span>';

    return`<tr>
      <td style="color:var(--muted);font-size:11px">${i+1}</td>
      <td><span class="sym">${t.symbol}</span></td>
      <td style="color:var(--muted);font-size:12px">${t.type||'Swing'}</td>
      <td><span style="color:${t.dir==='B'?'var(--green)':'var(--red)'};font-weight:600;font-size:12px">${t.dir==='B'?'LONG':'SHORT'}</span></td>
      <td class="r">₹${(+t.entry).toFixed(2)}</td>
      <td class="r">${t.exit?'₹'+(+t.exit).toFixed(2):'<span style="color:var(--muted)">—</span>'}</td>
      <td class="r">${(+t.qty).toLocaleString()}</td>
      <td class="r" style="color:var(--muted)">${t.edate||'—'}</td>
      <td class="r" style="color:var(--muted)">${t.xdate||'—'}</td>
      <td class="r pnl ${pc2}" style="font-weight:600">${fmtPnL(p)}</td>
      <td class="r pnl ${pc2}">${fmtPct(pc)}</td>
      <td class="r">${rrCell}</td>
      <td class="r">${riskCell}</td>
      <td><span class="badge ${bc}">${bt}</span></td>
      <td class="r" style="font-size:11px">${ltpCell}</td>
      <td class="r" style="color:var(--muted)">${t.sl?'₹'+t.sl:'—'}</td>
      <td class="r" style="color:var(--muted)">${t.target?'₹'+t.target:'—'}</td>
      <td style="color:var(--muted);font-size:12px;max-width:180px;overflow:hidden;text-overflow:ellipsis">${setupBadge}${rest||(setup?'':'—')}</td>
      <td>${t.chartLink?`<a href="${t.chartLink}" target="_blank" style="color:var(--accent);text-decoration:none">📈</a>`:'<span style="color:var(--muted)">—</span>'}</td>
      <td>
        <button class="abtn" onclick="editTrade('${t.id}')" title="Edit">✏️</button>
        <button class="abtn del" onclick="delTrade('${t.id}')" title="Delete">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

function setSort(field,btn){
  if(sortField===field){
    sortDir=sortDir==='asc'?'desc':'asc';
  } else {
    sortField=field; sortDir='desc';
  }
  document.querySelectorAll('[data-sort]').forEach(b=>b.classList.remove('active'));
  const activeBtn=document.querySelector(`[data-sort="${field}"]`);
  if(activeBtn)activeBtn.classList.add('active');
  if(field==='none'){sortField='none';}
  renderTable();
}

function setFilter(f,btn){
  activeFilter=f;
  document.querySelectorAll('#view-journal .controls:first-of-type .fbtn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderTable();
}

function openModal(id){
  document.getElementById('mtitle').textContent=id?'Trade Edit Karo':'Naya Trade Add Karo';
  document.getElementById('eid').value=id||'';
  if(id){
    const t=trades.find(x=>String(x.id)===String(id));
    if(!t)return;
    document.getElementById('f-sym').value=t.symbol;
    document.getElementById('f-type').value=t.type||'Swing';
    document.getElementById('f-dir').value=t.dir||'B';
    document.getElementById('f-qty').value=t.qty;
    document.getElementById('f-entry').value=t.entry;
    document.getElementById('f-exit').value=t.exit||'';
    document.getElementById('f-sl').value=t.sl||'';
    document.getElementById('f-target').value=t.target||'';
    document.getElementById('f-edate').value=t.edate||'';
    document.getElementById('f-xdate').value=t.xdate||'';
    const parsed=parseSetup(t.notes);
    document.getElementById('f-setup').value=parsed.setup;
    document.getElementById('f-notes').value=parsed.rest;
    document.getElementById('f-chartlink').value=t.chartLink||'';
  } else {
    ['f-sym','f-qty','f-entry','f-exit','f-sl','f-target','f-edate','f-xdate','f-notes','f-chartlink'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('f-type').value='Swing';
    document.getElementById('f-dir').value='B';
    document.getElementById('f-setup').value='';
  }
  document.getElementById('overlay').classList.add('open');
}
function closeModal(){document.getElementById('overlay').classList.remove('open');}

async function saveTrade(){
  const sym=document.getElementById('f-sym').value.trim().toUpperCase();
  const qty=parseFloat(document.getElementById('f-qty').value);
  const entry=parseFloat(document.getElementById('f-entry').value);
  if(!sym||!qty||!entry){toast('Symbol, Qty aur Entry zaroori hai!',true);return;}
  const t={symbol:sym,type:document.getElementById('f-type').value,dir:document.getElementById('f-dir').value,qty,entry,
    exit:parseFloat(document.getElementById('f-exit').value)||null,
    sl:parseFloat(document.getElementById('f-sl').value)||null,
    target:parseFloat(document.getElementById('f-target').value)||null,
    edate:document.getElementById('f-edate').value,xdate:document.getElementById('f-xdate').value,
    notes:packNotes(document.getElementById('f-setup').value,document.getElementById('f-notes').value),
    chartLink:document.getElementById('f-chartlink').value.trim()};
  const eid=document.getElementById('eid').value;
  const btn=document.getElementById('bsave');
  btn.disabled=true; btn.textContent='Saving…'; closeModal();
  try{
    let res;
    if(eid){
      t.id=eid;
      res=await(await fetch(API_URL,{method:'POST',body:JSON.stringify({action:'updateTrade',trade:t})})).json();
      if(res&&res.error) throw new Error(res.error);
      toast('✓ Trade update ho gaya — Sheet mein save!');
    } else {
      res=await(await fetch(API_URL,{method:'POST',body:JSON.stringify({action:'addTrade',trade:t})})).json();
      if(res&&res.error) throw new Error(res.error);
      toast('✓ Trade add ho gaya — Sheet mein save!');
    }
    await loadTrades();
  }catch(e){console.error('saveTrade error:',e);toast('Error: '+e.message,true,6000);}
  btn.disabled=false; btn.textContent='Save Trade';
}

function editTrade(id){openModal(id);}
async function delTrade(id){
  if(!confirm('Ye trade delete karna chahte ho?'))return;
  try{
    await(await fetch(API_URL,{method:'POST',body:JSON.stringify({action:'deleteTrade',id})})).json();
    toast('Trade delete ho gaya');
    await loadTrades();
  }catch(e){console.error('delTrade error:',e);toast('Delete nahi hua — '+e.message,true,6000);}
}

let watchlist=[];

async function loadWatchlist(){
  try{
    const d=await(await fetch(`${API_URL}?action=getWatchlist`)).json();
    watchlist=d.watchlist||[];
    renderWatchlist();
  }catch(e){console.error('loadWatchlist error:',e);}
}

function renderWatchlist(){
  const countEl=document.getElementById('watch-count');
  if(countEl)countEl.textContent=`(${watchlist.length})`;
  const list=document.getElementById('watch-list');
  if(!list)return;
  if(!watchlist.length){list.innerHTML='<div style="color:var(--muted);font-size:12px;padding:8px 0">Koi stock watch pe nahi hai — upar se add karo</div>';return;}
  list.innerHTML=watchlist.map(w=>{
    const entry=+w.entry||0, sl=+w.sl||0, target=+w.target||0;
    const riskPerShare=(entry&&sl)?Math.abs(entry-sl):0;
    const hypQty=riskPerShare?Math.floor((PORTFOLIO_CAPITAL*(MAX_RISK_PCT/100))/riskPerShare):0;
    const ltp=ltpCache[w.ticker];
    const pnlAtTarget=(entry&&target&&hypQty)?((target-entry)*hypQty):null;
    const pnlAtSL=(entry&&sl&&hypQty)?(-(riskPerShare*hypQty)):null;
    const pnlAtLTP=(entry&&ltp&&hypQty)?((ltp-entry)*hypQty):null;
    const rr=(riskPerShare&&target)?(Math.abs(target-entry)/riskPerShare):null;
    return `<div class="watch-item">
    <div>
      <span class="wsym">${w.ticker}</span> ${w.name?'· '+w.name:''}
      ${w.setup?`<span style="font-size:9.5px;font-weight:600;padding:1px 7px;border-radius:20px;background:rgba(0,212,255,0.1);color:var(--accent);margin-left:6px">${w.setup}</span>`:''}
      <div class="wmeta">${w.date||''} ${w.entry?'· Entry ₹'+w.entry:''} ${w.sl?'· SL ₹'+w.sl:''} ${w.target?'· Target ₹'+w.target:''} ${rr?'· R:R '+rr.toFixed(2)+'x':''} ${w.notes?'· '+w.notes:''}</div>
      <div class="wmeta" style="margin-top:4px">
        ${hypQty?`<b style="color:var(--text)">What-if (2% risk, qty ${hypQty}):</b> `:''}
        ${pnlAtTarget!==null?`<span style="color:var(--green)">Target: +₹${pnlAtTarget.toFixed(0)}</span> `:''}
        ${pnlAtSL!==null?`<span style="color:var(--red)">SL: -₹${Math.abs(pnlAtSL).toFixed(0)}</span> `:''}
        ${pnlAtLTP!==null?`<span style="color:${pnlAtLTP>=0?'var(--green)':'var(--red)'}">At LTP (₹${ltp.toFixed(2)}): ${pnlAtLTP>=0?'+':''}₹${pnlAtLTP.toFixed(0)}</span>`:''}
      </div>
    </div>
    <div class="wactions">
      <button class="fbtn" style="padding:5px 10px;font-size:11px" onclick="convertWatchToTrade('${w.id}')">→ Trade</button>
      <button class="abtn del" onclick="deleteWatchItem('${w.id}')">🗑</button>
    </div>
  </div>`;
  }).join('');
}

async function addWatchItem(){
  const ticker=document.getElementById('w-ticker').value.trim().toUpperCase();
  if(!ticker){toast('Ticker zaroori hai',true);return;}
  const item={
    ticker, date:document.getElementById('w-date').value, name:document.getElementById('w-name').value,
    setup:document.getElementById('w-setup').value, entry:document.getElementById('w-entry').value,
    sl:document.getElementById('w-sl').value, target:document.getElementById('w-target').value,
    notes:document.getElementById('w-notes').value
  };
  try{
    await(await fetch(API_URL,{method:'POST',body:JSON.stringify({action:'addWatch',item})})).json();
    ['w-ticker','w-date','w-name','w-entry','w-sl','w-target','w-notes'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('w-setup').value='';
    toast('✓ Watchlist mein add ho gaya');
    await loadWatchlist();
  }catch(e){console.error('addWatchItem error:',e);toast('Error — '+e.message,true,6000);}
}

async function deleteWatchItem(id){
  try{
    await(await fetch(API_URL,{method:'POST',body:JSON.stringify({action:'deleteWatch',id})})).json();
    toast('Watchlist se remove ho gaya');
    await loadWatchlist();
  }catch(e){console.error('deleteWatchItem error:',e);toast('Error — '+e.message,true,6000);}
}

function convertWatchToTrade(id){
  const w=watchlist.find(x=>String(x.id)===String(id));
  if(!w)return;
  switchView('journal');
  openModal();
  document.getElementById('f-sym').value=w.ticker;
  document.getElementById('f-entry').value=w.entry||'';
  document.getElementById('f-sl').value=w.sl||'';
  document.getElementById('f-target').value=w.target||'';
  document.getElementById('f-setup').value=w.setup||'';
  document.getElementById('f-notes').value=w.notes||'';
  document.getElementById('f-edate').value=w.date||'';
  toast('Watchlist se details fill ho gayi — Qty/Exit bharke save karo');
}

/* =========================================================
   DASHBOARD
   ========================================================= */
function grossPnL(t){if(!t.exit)return null;return t.dir==='B'?(+t.exit-+t.entry)*+t.qty:(+t.entry-+t.exit)*+t.qty;}
function riskPct(t){
  if(!t.sl || !t.entry || !t.qty) return null;
  const riskAmt = Math.abs((+t.entry-+t.sl))*+t.qty;
  return (riskAmt/PORTFOLIO_CAPITAL)*100;
}
function rrRatio(t){
  if(!t.sl || !t.target || !t.entry) return null;
  const risk = Math.abs(+t.entry-+t.sl);
  const reward = Math.abs(+t.target-+t.entry);
  if(risk===0) return null;
  return reward/risk;
}
function fmtK(n){const a=Math.abs(n);const s=a>=1000?(a/1000).toFixed(1)+'K':a.toFixed(0);return(n>=0?'+₹':'-₹')+s;}
function fmtRupee(n){return '₹'+Math.abs(n).toLocaleString('en-IN',{maximumFractionDigits:2});}
function fmtSigned(n,dp=2){const s=Math.abs(n).toLocaleString('en-IN',{maximumFractionDigits:dp,minimumFractionDigits:dp});return n>=0?'₹'+s:'(₹'+s+')';}

function getMonthlyBreakdown(trades){
  const map={};
  trades.filter(t=>outcome(t)!=='OPEN').forEach(t=>{
    const p=calcPnL(t);
    const key=t.edate?t.edate.slice(0,7):(t.xdate?t.xdate.slice(0,7):'Unknown');
    if(!map[key])map[key]={month:key,trades:0,wins:0,pnl:0};
    map[key].trades++;
    if(p>0)map[key].wins++;
    map[key].pnl+=p;
  });
  return Object.values(map).sort((a,b)=>a.month.localeCompare(b.month));
}

function renderPositions(){
  const open=trades.filter(t=>outcome(t)==='OPEN');
  const closed=trades.filter(t=>outcome(t)!=='OPEN');
  const risks=open.map(riskPct).filter(r=>r!==null);
  const riskFreeCount=open.filter(t=>{
    if(!t.sl)return false;
    return t.dir==='B'?(+t.sl>=+t.entry):(+t.sl<=+t.entry);
  }).length;
  const totalOpenRiskPct=risks.length?risks.reduce((a,b)=>a+b,0):0;
  const investedValue=open.reduce((s,t)=>s+(+t.entry*+t.qty),0);
  const pctCapInvested=(investedValue/PORTFOLIO_CAPITAL)*100;
  const unrealGain=open.reduce((s,t)=>{
    const ltp=ltpCache[t.symbol];
    if(!ltp)return s;
    return s+((t.dir==='B'?(ltp-t.entry):(t.entry-ltp))*t.qty);
  },0);
  const realGain=closed.reduce((s,t)=>s+calcPnL(t),0);

  const root=document.getElementById('positions-content');
  root.innerHTML=`
  <div class="page-header">
    <div>
      <div class="page-title">📊 Dashboard</div>
      <div class="page-sub">Open positions ka live snapshot — kitna risk pe hai, kitna gain/loss</div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="fbtn" onclick="refreshLTP()">🔄 Refresh LTP</button>
    </div>
  </div>
  <div class="kpi-strip">
    <div class="kpi-cell"><div class="lbl">Open Positions</div><div class="val">${open.length}</div><div class="sub">${open.length} active trades</div></div>
    <div class="kpi-cell"><div class="lbl">Risk-Free Positions</div><div class="val">${riskFreeCount}</div><div class="sub">SL at/above entry</div></div>
    <div class="kpi-cell"><div class="lbl">% Total Open Risk</div><div class="val ${totalOpenRiskPct>MAX_RISK_PCT*open.length?'r-clr':''}">${totalOpenRiskPct.toFixed(2)}%</div><div class="sub">of capital at risk</div></div>
    <div class="kpi-cell"><div class="lbl">% Capital Invested</div><div class="val">${pctCapInvested.toFixed(1)}%</div><div class="sub">₹${investedValue.toLocaleString('en-IN',{maximumFractionDigits:0})} deployed</div></div>
    <div class="kpi-cell"><div class="lbl">Unrealised Gain</div><div class="val ${unrealGain>=0?'g':'r-clr'}">${fmtK(unrealGain)}</div><div class="sub">MTM (refresh LTP)</div></div>
    <div class="kpi-cell"><div class="lbl">Realised Gain</div><div class="val ${realGain>=0?'g':'r-clr'}">${fmtK(realGain)}</div><div class="sub">all closed trades</div></div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Stock</th><th>Opened</th><th class="r">Position Size</th><th class="r">Avg Buy</th><th class="r">LTP</th><th class="r">SL/TSL</th><th class="r">Invested</th><th class="r">Open Risk</th><th class="r">R-Multiple</th><th class="r">Unrealised P&L</th></tr></thead>
      <tbody>
        ${!open.length?'<tr><td colspan="10" class="empty">No open positions — Click "＋ Add Trade" in Trades to start</td></tr>':open.map(t=>{
          const ltp=ltpCache[t.symbol];
          const invested=+t.entry*+t.qty;
          const risk=riskPct(t);
          const rr=(ltp&&t.sl)?((t.dir==='B'?(ltp-t.entry):(t.entry-ltp))/Math.abs(t.entry-t.sl)):null;
          const unreal=ltp?((t.dir==='B'?(ltp-t.entry):(t.entry-ltp))*t.qty):null;
          return `<tr>
            <td><span class="sym">${t.symbol}</span></td>
            <td style="color:var(--muted)">${t.edate||'—'}</td>
            <td class="r">${(+t.qty).toLocaleString()}</td>
            <td class="r">₹${(+t.entry).toFixed(2)}</td>
            <td class="r">${ltp?'₹'+ltp.toFixed(2):'<span style="color:var(--muted)">—</span>'}</td>
            <td class="r">${t.sl?'₹'+t.sl:'—'}</td>
            <td class="r">₹${invested.toLocaleString('en-IN',{maximumFractionDigits:0})}</td>
            <td class="r ${risk&&risk>MAX_RISK_PCT?'r-clr':''}">${risk?risk.toFixed(2)+'%':'—'}</td>
            <td class="r">${rr!==null?rr.toFixed(2)+'R':'—'}</td>
            <td class="r ${unreal!==null?(unreal>=0?'g':'r-clr'):''}" style="font-weight:600">${unreal!==null?fmtPnL(unreal):'—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}

function dayName(dstr){
  if(!dstr)return null;
  const d=new Date(dstr);
  if(isNaN(d))return null;
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
}
function exitRuleOf(t){
  if(outcome(t)==='OPEN')return null;
  const ex=+t.exit;
  if(t.sl && ((t.dir==='B'&&ex<=+t.sl)||(t.dir==='S'&&ex>=+t.sl))) return 'Stop Loss Hit';
  if(t.target && ((t.dir==='B'&&ex>=+t.target)||(t.dir==='S'&&ex<=+t.target))) return 'Target Hit';
  return 'Manual / Trail Exit';
}

function renderAnalytics(){
  charts.forEach(c=>c.destroy()); charts=[];
  const closed=trades.filter(t=>outcome(t)!=='OPEN').sort((a,b)=>(a.xdate||a.edate||'').localeCompare(b.xdate||b.edate||''));
  const root=document.getElementById('analytics-content');

  if(!closed.length){
    root.innerHTML='<div class="page-header"><div><div class="page-title">🧮 Analytics</div><div class="page-sub">Deeper patterns — kab aur kaise trade karte ho</div></div></div><div class="panel"><div class="empty">Abhi koi closed trade nahi hai — analytics tabhi dikhega jab kuch trades close honge.</div></div>';
    return;
  }

  root.innerHTML=`
  <div class="page-header"><div><div class="page-title">🧮 Analytics</div><div class="page-sub">Deeper patterns — kab aur kaise trade karte ho, uska breakdown</div></div></div>
  <div class="grid2">
    <div class="panel"><div class="tool-head" style="margin-bottom:14px">Equity Curve — Cumulative Realised P/L</div><div class="chart-wrap"><canvas id="a-equity"></canvas></div></div>
    <div class="panel"><div class="tool-head" style="margin-bottom:14px">Capital Growth — Capital + Cumulative P/L</div><div class="chart-wrap"><canvas id="a-capgrowth"></canvas></div></div>
  </div>
  <div class="grid2">
    <div class="panel"><div class="tool-head" style="margin-bottom:14px">Drawdown — Peak-to-Trough %</div><div class="chart-wrap"><canvas id="a-drawdown"></canvas></div></div>
    <div class="panel"><div class="tool-head" style="margin-bottom:14px">P&L by Month</div><div class="chart-wrap"><canvas id="a-monthly"></canvas></div></div>
  </div>
  <div class="grid2">
    <div class="panel"><div class="tool-head" style="margin-bottom:14px">Average P&L by Day of Week</div><div class="chart-wrap"><canvas id="a-dowpnl"></canvas></div></div>
    <div class="panel"><div class="tool-head" style="margin-bottom:14px">Trades by Day of Week</div><div class="chart-wrap"><canvas id="a-dowcount"></canvas></div></div>
  </div>
  <div class="grid2">
    <div class="panel"><div class="tool-head" style="margin-bottom:14px">Pattern Impact on Portfolio</div><div class="chart-wrap"><canvas id="a-pattern-pnl"></canvas></div></div>
    <div class="panel"><div class="tool-head" style="margin-bottom:14px">Trades per Pattern</div><div class="chart-wrap"><canvas id="a-pattern-count"></canvas></div></div>
  </div>
  <div class="grid2">
    <div class="panel"><div class="tool-head" style="margin-bottom:14px">Trades per Exit Rule</div><div class="chart-wrap"><canvas id="a-exitrule"></canvas></div></div>
    <div class="panel">
      <div class="tool-head" style="margin-bottom:10px">Notes</div>
      <div class="t-hint">
        · Exit Rule ("Stop Loss Hit" / "Target Hit" / "Manual-Trail Exit") entry ke SL &amp; Target se automatically derive hota hai.<br>
        · Pattern charts sirf un trades ko count karte hain jinme Setup/Pattern tag Add Trade form mein select kiya gaya ho.<br>
        · Drawdown, Capital Growth aur Equity Curve sirf closed trades pe based hain, entry-date order mein.
      </div>
    </div>
  </div>`;

  let cum=0; const equityData=closed.map(t=>{cum+=calcPnL(t);return+cum.toFixed(0);});
  charts.push(new Chart(document.getElementById('a-equity'),{type:'line',data:{labels:closed.map(t=>t.symbol),datasets:[{data:equityData,borderColor:'#00d4ff',backgroundColor:'#00d4ff15',fill:true,tension:0.35,pointRadius:0,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{ticks:{color:'#5a7a94',font:{size:10}},grid:{color:'#1e2d3d'}}}}}));

  const capData=equityData.map(v=>PORTFOLIO_CAPITAL+v);
  charts.push(new Chart(document.getElementById('a-capgrowth'),{type:'line',data:{labels:closed.map(t=>t.symbol),datasets:[{data:capData,borderColor:'#00e676',backgroundColor:'#00e67615',fill:true,tension:0.35,pointRadius:0,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{ticks:{color:'#5a7a94',font:{size:10},callback:v=>'₹'+(v/1000).toFixed(0)+'K'},grid:{color:'#1e2d3d'}}}}}));

  let peak=-Infinity;
  const ddData=capData.map(v=>{peak=Math.max(peak,v);return+(((v-peak)/peak)*100).toFixed(2);});
  charts.push(new Chart(document.getElementById('a-drawdown'),{type:'line',data:{labels:closed.map(t=>t.symbol),datasets:[{data:ddData,borderColor:'#ff3d5a',backgroundColor:'#ff3d5a15',fill:true,tension:0.3,pointRadius:0,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{max:0,ticks:{color:'#5a7a94',font:{size:10},callback:v=>v+'%'},grid:{color:'#1e2d3d'}}}}}));

  const monthly=getMonthlyBreakdown(trades);
  charts.push(new Chart(document.getElementById('a-monthly'),{type:'bar',data:{labels:monthly.map(m=>m.month),datasets:[{data:monthly.map(m=>+m.pnl.toFixed(0)),backgroundColor:monthly.map(m=>m.pnl>=0?'rgba(0,230,118,0.6)':'rgba(255,61,90,0.6)'),borderColor:monthly.map(m=>m.pnl>=0?'#00e676':'#ff3d5a'),borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#5a7a94',font:{size:10}},grid:{color:'#1e2d3d'}},y:{ticks:{color:'#5a7a94',font:{size:10}},grid:{color:'#1e2d3d'}}}}}));

  const dows=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dowMap={}; dows.forEach(d=>dowMap[d]={sum:0,count:0});
  closed.forEach(t=>{const dn=dayName(t.edate||t.xdate); if(dn&&dowMap[dn]!==undefined){dowMap[dn].sum+=calcPnL(t);dowMap[dn].count++;}});
  const dowAvg=dows.map(d=>dowMap[d].count?+(dowMap[d].sum/dowMap[d].count).toFixed(0):0);
  const dowCount=dows.map(d=>dowMap[d].count);
  charts.push(new Chart(document.getElementById('a-dowpnl'),{type:'bar',data:{labels:dows,datasets:[{data:dowAvg,backgroundColor:dowAvg.map(v=>v>=0?'rgba(0,230,118,0.6)':'rgba(255,61,90,0.6)'),borderColor:dowAvg.map(v=>v>=0?'#00e676':'#ff3d5a'),borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#5a7a94'},grid:{color:'#1e2d3d'}},y:{ticks:{color:'#5a7a94',font:{size:10}},grid:{color:'#1e2d3d'}}}}}));
  charts.push(new Chart(document.getElementById('a-dowcount'),{type:'bar',data:{labels:dows,datasets:[{data:dowCount,backgroundColor:'rgba(0,212,255,0.5)',borderColor:'#00d4ff',borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#5a7a94'},grid:{color:'#1e2d3d'}},y:{ticks:{color:'#5a7a94',font:{size:10}},grid:{color:'#1e2d3d'}}}}}));

  const patMap={};
  closed.forEach(t=>{const {setup}=parseSetup(t.notes);const key=setup||'No Tag';if(!patMap[key])patMap[key]={pnl:0,count:0};patMap[key].pnl+=calcPnL(t);patMap[key].count++;});
  const patKeys=Object.keys(patMap);
  charts.push(new Chart(document.getElementById('a-pattern-pnl'),{type:'bar',data:{labels:patKeys,datasets:[{data:patKeys.map(k=>+patMap[k].pnl.toFixed(0)),backgroundColor:patKeys.map(k=>patMap[k].pnl>=0?'rgba(0,230,118,0.6)':'rgba(255,61,90,0.6)'),borderColor:patKeys.map(k=>patMap[k].pnl>=0?'#00e676':'#ff3d5a'),borderWidth:1,borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#5a7a94'},grid:{color:'#1e2d3d'}},y:{ticks:{color:'#5a7a94',font:{size:11}},grid:{display:false}}}}}));
  charts.push(new Chart(document.getElementById('a-pattern-count'),{type:'doughnut',data:{labels:patKeys,datasets:[{data:patKeys.map(k=>patMap[k].count),backgroundColor:['#00d4ff','#00e676','#ffab00','#ff3d5a','#a78bfa','#5a7a94','#33ddff'],borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{labels:{color:'#5a7a94',font:{size:10},boxWidth:9}}}}}));

  const exitMap={};
  closed.forEach(t=>{const r=exitRuleOf(t); if(r){exitMap[r]=(exitMap[r]||0)+1;}});
  const exitKeys=Object.keys(exitMap);
  charts.push(new Chart(document.getElementById('a-exitrule'),{type:'bar',data:{labels:exitKeys,datasets:[{data:exitKeys.map(k=>exitMap[k]),backgroundColor:['#ff3d5a','#00e676','#ffab00'],borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#5a7a94'},grid:{color:'#1e2d3d'}},y:{ticks:{color:'#5a7a94',font:{size:10}},grid:{color:'#1e2d3d'}}}}}));
}

function renderDashboard(trades){
  charts.forEach(c=>c.destroy()); charts=[];
  const closed=trades.filter(t=>outcome(t)!=='OPEN');
  const open=trades.filter(t=>outcome(t)==='OPEN');
  const wins=closed.filter(t=>outcome(t)==='WIN');
  const losses=closed.filter(t=>outcome(t)==='LOSS');
  const be=closed.filter(t=>outcome(t)==='BE');

  const grossTotal=closed.reduce((s,t)=>s+grossPnL(t),0);
  const totalFees=closed.length*BROKERAGE;
  const netPnL=closed.reduce((s,t)=>s+calcPnL(t),0);
  const wr=closed.length?(wins.length/closed.length*100):0;
  const avgPnL=closed.length?netPnL/closed.length:0;
  const avgWin=wins.length?wins.reduce((s,t)=>s+calcPnL(t),0)/wins.length:0;
  const avgLoss=losses.length?Math.abs(losses.reduce((s,t)=>s+calcPnL(t),0)/losses.length):0;
  const pf=avgLoss>0&&losses.length?(avgWin*wins.length)/(avgLoss*losses.length):0;
  const largestWin=wins.length?Math.max(...wins.map(t=>calcPnL(t))):0;
  const largestLoss=losses.length?Math.min(...losses.map(t=>calcPnL(t))):0;
  const swingPnL=closed.filter(t=>t.type==='Swing').reduce((s,t)=>s+calcPnL(t),0);
  const positionalPnL=closed.filter(t=>t.type==='Positional').reduce((s,t)=>s+calcPnL(t),0);
  const portfolioReturn=(netPnL/PORTFOLIO_CAPITAL)*100;
  const swingClosed=closed.filter(t=>t.type==='Swing');
  const positionalClosed=closed.filter(t=>t.type==='Positional');
  const wrSwing=swingClosed.length?(swingClosed.filter(t=>outcome(t)==='WIN').length/swingClosed.length*100):0;
  const wrPositional=positionalClosed.length?(positionalClosed.filter(t=>outcome(t)==='WIN').length/positionalClosed.length*100):0;

  const risks=trades.map(riskPct).filter(r=>r!==null);
  const avgRisk=risks.length?risks.reduce((a,b)=>a+b,0)/risks.length:0;
  const highestRisk=risks.length?Math.max(...risks):0;
  const lowestRisk=risks.length?Math.min(...risks):0;
  const overRisk=risks.filter(r=>r>MAX_RISK_PCT).length;
  const rrs=trades.map(rrRatio).filter(r=>r!==null);
  const avgRR=rrs.length?rrs.reduce((a,b)=>a+b,0)/rrs.length:0;

  const monthly=getMonthlyBreakdown(trades);
  const sortedClosed=[...closed].sort((a,b)=>calcPnL(b)-calcPnL(a));
  const best=sortedClosed.slice(0,10);
  const worst=sortedClosed.slice(-10).reverse();

  const main=document.getElementById('dash-content');
  main.innerHTML=`
  <div class="page-header">
    <div>
      <div class="page-title">📊 Trading Performance Dashboard</div>
      <div class="page-sub">Auto-calculated from Trade Log · ₹${PORTFOLIO_CAPITAL.toLocaleString('en-IN')} portfolio · ₹${BROKERAGE}/trade brokerage</div>
    </div>
  </div>

  <div class="kpi-strip">
    <div class="kpi-cell cap"><div class="lbl">💼 Portfolio Capital</div><div class="val">₹${PORTFOLIO_CAPITAL.toLocaleString('en-IN')}</div></div>
    <div class="kpi-cell pnl"><div class="lbl">💰 Total Net P&L</div><div class="val ${netPnL>=0?'g':'r'}">${fmtK(netPnL)}</div></div>
    <div class="kpi-cell tot"><div class="lbl">📋 Total Trades</div><div class="val">${trades.length}</div></div>
    <div class="kpi-cell wr"><div class="lbl">🎯 Win Rate</div><div class="val">${wr.toFixed(1)}%</div></div>
    <div class="kpi-cell rr"><div class="lbl">⚖️ Avg R:R</div><div class="val">${avgRR>0?avgRR.toFixed(2)+'x':'—'}</div></div>
    <div class="kpi-cell open"><div class="lbl">🔓 Open Trades</div><div class="val">${open.length}</div></div>
    <div class="kpi-cell closed"><div class="lbl">✓ Closed Trades</div><div class="val">${closed.length}</div></div>
  </div>

  <div class="kpi-strip2">
    <div class="kpi2 win"><div class="lbl">✅ Winners</div><div class="val">${wins.length}</div></div>
    <div class="kpi2 loss"><div class="lbl">❌ Losers</div><div class="val">${losses.length}</div></div>
    <div class="kpi2 pf"><div class="lbl">📈 Profit Factor</div><div class="val">${pf.toFixed(2)}</div></div>
    <div class="kpi2 risk"><div class="lbl">🛡️ Avg Risk/Trade</div><div class="val">${avgRisk?avgRisk.toFixed(2)+'%':'—'}</div></div>
    <div class="kpi2 biggest"><div class="lbl">📉 Biggest Loss</div><div class="val">${largestLoss?'-'+fmtRupee(largestLoss):'—'}</div></div>
  </div>

  <div class="grid-side">
    <div class="panel-flush">
      <div class="section-hdr blue">📋 P&L Statistics</div>
      <table class="dtable">
        <tr><td class="lab">Gross P&L (₹)</td><td class="r g">${fmtSigned(grossTotal,2)}</td></tr>
        <tr><td class="lab">Total Fees (₹)</td><td class="r">₹${totalFees.toLocaleString('en-IN')}</td></tr>
        <tr><td class="lab">Net P&L (₹)</td><td class="r ${netPnL>=0?'g':'r-clr'}">${fmtSigned(netPnL,2)}</td></tr>
        <tr><td class="lab">Avg P&L/Trade (₹)</td><td class="r ${avgPnL>=0?'g':'r-clr'}">${fmtSigned(avgPnL,2)}</td></tr>
        <tr><td class="lab">Largest Win (₹)</td><td class="r g">₹${largestWin.toLocaleString('en-IN',{maximumFractionDigits:2})}</td></tr>
        <tr><td class="lab">Largest Loss (₹)</td><td class="r r-clr">(₹${Math.abs(largestLoss).toLocaleString('en-IN',{maximumFractionDigits:2})})</td></tr>
        <tr><td class="lab">Avg Win (₹)</td><td class="r g">₹${avgWin.toLocaleString('en-IN',{maximumFractionDigits:2})}</td></tr>
        <tr><td class="lab">Avg Loss (₹)</td><td class="r r-clr">(₹${avgLoss.toLocaleString('en-IN',{maximumFractionDigits:2})})</td></tr>
        <tr><td class="lab">Swing P&L (₹)</td><td class="r ${swingPnL>=0?'g':'r-clr'}">${fmtSigned(swingPnL,2)}</td></tr>
        <tr><td class="lab">Positional P&L (₹)</td><td class="r ${positionalPnL>=0?'g':'r-clr'}">${fmtSigned(positionalPnL,2)}</td></tr>
        <tr><td class="lab">Portfolio Return %</td><td class="r ${portfolioReturn>=0?'g':'r-clr'}">${portfolioReturn.toFixed(2)}%</td></tr>
      </table>
    </div>
    <div>
      <div class="panel-flush" style="margin-bottom:14px">
        <div class="section-hdr green">Outcome</div>
        <table class="dtable">
          <tr><td class="lab">Wins</td><td class="r g">${wins.length}</td></tr>
          <tr><td class="lab">Losses</td><td class="r r-clr">${losses.length}</td></tr>
          <tr><td class="lab">Breakeven</td><td class="r">${be.length}</td></tr>
        </table>
      </div>
      <div class="panel-flush">
        <div class="section-hdr green">Type · Avg (₹) · Count</div>
        <table class="dtable">
          <tr><td class="lab">Win</td><td class="r g">₹${avgWin.toFixed(0)}</td><td class="r">${wins.length}</td></tr>
          <tr><td class="lab">Loss</td><td class="r r-clr">(₹${avgLoss.toFixed(0)})</td><td class="r">${losses.length}</td></tr>
        </table>
      </div>
    </div>
  </div>

  <div class="grid-side">
    <div class="panel-flush">
      <div class="section-hdr green">🛡️ Risk Analysis</div>
      <table class="dtable">
        <tr><td class="lab">Portfolio Capital (₹)</td><td class="r">₹${PORTFOLIO_CAPITAL.toLocaleString('en-IN')}.00</td></tr>
        <tr><td class="lab">Max Risk/Trade Setting</td><td class="r">${MAX_RISK_PCT.toFixed(1)}%</td></tr>
        <tr><td class="lab">Avg Risk Per Trade</td><td class="r">${avgRisk?avgRisk.toFixed(2)+'%':'0.00%'}</td></tr>
        <tr><td class="lab">Highest Risk Taken</td><td class="r">${highestRisk?highestRisk.toFixed(2)+'%':'0.00%'}</td></tr>
        <tr><td class="lab">Lowest Risk Taken</td><td class="r">${lowestRisk?lowestRisk.toFixed(2)+'%':'0.00%'}</td></tr>
        <tr><td class="lab">Trades Over ${MAX_RISK_PCT}% Risk</td><td class="r">${overRisk}</td></tr>
        <tr><td class="lab">Win Rate — Swing</td><td class="r g">${wrSwing.toFixed(1)}%</td></tr>
        <tr><td class="lab">Win Rate — Positional</td><td class="r g">${wrPositional.toFixed(1)}%</td></tr>
        <tr><td class="lab">Profit Factor</td><td class="r">${pf.toFixed(2)}</td></tr>
        <tr><td class="lab">Breakeven Trades</td><td class="r">${be.length}</td></tr>
        <tr><td class="lab">Realized P&L</td><td class="r g">₹${grossTotal.toLocaleString('en-IN',{maximumFractionDigits:2})}</td></tr>
      </table>
    </div>
    <div class="panel">
      <div class="ptitle">Performance Metrics — Where to Improve</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="tr-row"><span style="color:var(--muted);font-size:12px">Avg P&L / Trade</span><span class="tr-pnl ${avgPnL>=0?'g':'r-clr'}" style="font-size:14px">${fmtSigned(avgPnL,2)}</span></div>
        <div class="tr-row"><span style="color:var(--muted);font-size:12px">Avg Win</span><span class="tr-pnl g" style="font-size:14px">₹${avgWin.toFixed(2)}</span></div>
        <div class="tr-row"><span style="color:var(--muted);font-size:12px">Avg Loss</span><span class="tr-pnl r-clr" style="font-size:14px">(₹${avgLoss.toFixed(2)})</span></div>
        <div class="tr-row"><span style="color:var(--muted);font-size:12px">Portfolio Return %</span><span class="tr-pnl" style="font-size:14px">${portfolioReturn.toFixed(2)}%</span></div>
        <div class="tr-row"><span style="color:var(--muted);font-size:12px">Avg Risk / Trade</span><span class="tr-pnl" style="font-size:14px">${avgRisk?avgRisk.toFixed(2)+'%':'—'}</span></div>
      </div>
    </div>
  </div>

  <div class="grid2">
    <div class="panel">
      <div class="ptitle">Equity Curve — Cumulative Net P&L</div>
      <div class="chart-wrap"><canvas id="c-pnl"></canvas></div>
    </div>
    <div class="panel">
      <div class="ptitle">Avg P&L / Trade (Running)</div>
      <div class="chart-wrap"><canvas id="c-runavg"></canvas></div>
    </div>
  </div>

  <div class="grid2">
    <div class="panel">
      <div class="ptitle">Win Rate (Running %)</div>
      <div class="chart-wrap"><canvas id="c-runwr"></canvas></div>
    </div>
    <div class="panel">
      <div class="ptitle">Trade Outcomes Distribution</div>
      <div class="chart-wrap"><canvas id="c-out"></canvas></div>
    </div>
  </div>

  <div class="grid2">
    <div class="panel">
      <div class="ptitle">Monthly P&L Breakdown</div>
      <div class="chart-wrap"><canvas id="c-month"></canvas></div>
    </div>
    <div class="panel">
      <div class="ptitle">Avg Win vs Avg Loss</div>
      <div class="chart-wrap"><canvas id="c-wl"></canvas></div>
    </div>
  </div>

  <div class="grid2">
    <div class="panel">
      <div class="ptitle">Win vs Loss — Count</div>
      <div class="chart-wrap"><canvas id="c-count"></canvas></div>
    </div>
    <div class="panel">
      <div class="ptitle">Avg Risk / Trade (Running %)</div>
      <div class="chart-wrap"><canvas id="c-runrisk"></canvas></div>
      <div id="risk-note" style="color:var(--muted);font-size:11px;margin-top:8px"></div>
    </div>
  </div>

  <div class="grid3">
    <div class="panel">
      <div class="ptitle">🏆 Top 10 Best Trades</div>
      ${best.map((t,i)=>{const p=calcPnL(t);const pc=retPct(t);return`<div class="tr-row" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--muted);font-size:10px;font-family:var(--mono);min-width:20px;flex-shrink:0">#${i+1}</span>
        <span class="tr-sym" style="flex:1;font-size:12px">${t.symbol}</span>
        <span style="color:var(--muted);font-size:10px;font-family:var(--mono)">${pc!==null?'+'+pc.toFixed(1)+'%':''}</span>
        <span style="color:var(--green);font-family:var(--mono);font-weight:600;font-size:12px">+&#x20B9;${p.toFixed(0)}</span>
      </div>`;}).join('')}
    </div>
    <div class="panel">
      <div class="ptitle">💔 Top 10 Worst Trades</div>
      ${worst.map((t,i)=>{const p=calcPnL(t);const pc=retPct(t);return`<div class="tr-row" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--muted);font-size:10px;font-family:var(--mono);min-width:20px;flex-shrink:0">#${i+1}</span>
        <span class="tr-sym" style="flex:1;font-size:12px">${t.symbol}</span>
        <span style="color:var(--muted);font-size:10px;font-family:var(--mono)">${pc!==null?pc.toFixed(1)+'%':''}</span>
        <span style="color:var(--red);font-family:var(--mono);font-weight:600;font-size:12px">-&#x20B9;${Math.abs(p).toFixed(0)}</span>
      </div>`;}).join('')}
    </div>
    <div class="panel">
      <div class="ptitle">Open Positions (${open.length})</div>
      ${open.length?open.map(t=>`<div class="tr-row" style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span class="tr-sym" style="font-size:12px">${t.symbol}</span><span style="color:var(--amber);font-size:11px;font-family:var(--mono)">&#x20B9;${(+t.entry).toFixed(0)} x ${t.qty}</span></div>`).join(''):'<div style="color:var(--muted);padding:12px 0;font-size:13px">No open positions</div>'}
    </div>
  </div>

  <div class="panel">
    <div class="ptitle">Monthly Breakdown</div>
    <table class="dtable">
      <thead><tr><th>Month</th><th class="r">Trades</th><th class="r">Wins</th><th class="r">Win Rate</th><th class="r">Net P&L</th></tr></thead>
      <tbody>
        ${monthly.map(m=>`<tr>
          <td>${m.month||'Unknown'}</td>
          <td class="r">${m.trades}</td>
          <td class="r" style="color:var(--green)">${m.wins}</td>
          <td class="r" style="color:var(--amber)">${m.trades?(m.wins/m.trades*100).toFixed(0)+'%':'—'}</td>
          <td class="r" style="color:${m.pnl>=0?'var(--green)':'var(--red)'};font-weight:600">${m.pnl>=0?'+₹':'-₹'}${Math.abs(m.pnl).toFixed(0)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;

  let cum=0;
  const cumData=closed.map(t=>{cum+=calcPnL(t);return+cum.toFixed(0);});
  const cumColor=cum>=0?'#00e676':'#ff3d5a';
  charts.push(new Chart(document.getElementById('c-pnl'),{type:'line',data:{labels:closed.map(t=>t.symbol),datasets:[{data:cumData,borderColor:cumColor,backgroundColor:cumColor+'15',fill:true,tension:0.4,pointRadius:0,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{ticks:{color:'#5a7a94',font:{size:10}},grid:{color:'#1e2d3d'}}}}}));

  let runSum=0;
  const runAvgData=closed.map((t,i)=>{runSum+=calcPnL(t);return+(runSum/(i+1)).toFixed(0);});
  charts.push(new Chart(document.getElementById('c-runavg'),{type:'line',data:{labels:closed.map(t=>t.symbol),datasets:[{data:runAvgData,borderColor:'#00d4ff',backgroundColor:'#00d4ff15',fill:true,tension:0.3,pointRadius:0,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{ticks:{color:'#5a7a94',font:{size:10}},grid:{color:'#1e2d3d'}}}}}));

  let runWins=0;
  const runWrData=closed.map((t,i)=>{if(outcome(t)==='WIN')runWins++;return+((runWins/(i+1))*100).toFixed(1);});
  charts.push(new Chart(document.getElementById('c-runwr'),{type:'line',data:{labels:closed.map(t=>t.symbol),datasets:[{data:runWrData,borderColor:'#ffab00',backgroundColor:'#ffab0015',fill:true,tension:0.3,pointRadius:0,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{min:0,max:100,ticks:{color:'#5a7a94',font:{size:10},callback:v=>v+'%'},grid:{color:'#1e2d3d'}}}}}));

  charts.push(new Chart(document.getElementById('c-out'),{type:'doughnut',data:{labels:['Wins','Losses','Open','BE'],datasets:[{data:[wins.length,losses.length,open.length,be.length],backgroundColor:['#00e676','#ff3d5a','#ffab00','#5a7a94'],borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{labels:{color:'#5a7a94',font:{size:11},boxWidth:10}}}}}));

  if(monthly.length){
    charts.push(new Chart(document.getElementById('c-month'),{type:'bar',data:{labels:monthly.map(m=>m.month||'—'),datasets:[{label:'Monthly P&L',data:monthly.map(m=>+m.pnl.toFixed(0)),backgroundColor:monthly.map(m=>m.pnl>=0?'rgba(0,230,118,0.6)':'rgba(255,61,90,0.6)'),borderColor:monthly.map(m=>m.pnl>=0?'#00e676':'#ff3d5a'),borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#5a7a94',font:{size:10}},grid:{color:'#1e2d3d'}},y:{ticks:{color:'#5a7a94',font:{size:10}},grid:{color:'#1e2d3d'}}}}}));
  }

  charts.push(new Chart(document.getElementById('c-wl'),{type:'bar',data:{labels:['Avg Win','Avg Loss'],datasets:[{data:[+avgWin.toFixed(0),+avgLoss.toFixed(0)],backgroundColor:['rgba(0,230,118,0.6)','rgba(255,61,90,0.6)'],borderColor:['#00e676','#ff3d5a'],borderWidth:1,borderRadius:6}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#5a7a94'},grid:{color:'#1e2d3d'}},y:{ticks:{color:'#5a7a94',font:{size:11}},grid:{display:false}}}}}));

  charts.push(new Chart(document.getElementById('c-count'),{type:'bar',data:{labels:['Wins','Losses'],datasets:[{data:[wins.length,losses.length],backgroundColor:['rgba(0,230,118,0.6)','rgba(255,61,90,0.6)'],borderColor:['#00e676','#ff3d5a'],borderWidth:1,borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#5a7a94'},grid:{color:'#1e2d3d'}},y:{ticks:{color:'#5a7a94',font:{size:10},stepSize:5},grid:{color:'#1e2d3d'}}}}}));

  let runRiskSum=0, runRiskCount=0;
  const runRiskData=trades.map(t=>{const r=riskPct(t);if(r!==null){runRiskSum+=r;runRiskCount++;}return runRiskCount?+((runRiskSum/runRiskCount).toFixed(2)):0;});
  charts.push(new Chart(document.getElementById('c-runrisk'),{type:'line',data:{labels:trades.map(t=>t.symbol),datasets:[{data:runRiskData,borderColor:'#a78bfa',backgroundColor:'#a78bfa15',fill:true,tension:0.3,pointRadius:0,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{ticks:{color:'#5a7a94',font:{size:10},callback:v=>v+'%'},grid:{color:'#1e2d3d'}}}}}));

  if(!risks.length){
    document.getElementById('risk-note').textContent='⚠️ Stop Loss abhi kisi trade mein log nahi hua — SL add karte hi ye chart aur R:R / Risk% metrics live ho jayenge.';
  }
}

async function loadDashboard(){
  const el=document.getElementById('dash-content');
  el.innerHTML='<div class="loading"><div class="spinner"></div>Google Sheet se data load ho raha hai…</div>';
  try{
    const d=await(await fetch(`${API_URL}?action=getTrades`)).json();
    renderDashboard(d.trades||[]);
  }catch(e){
    el.innerHTML='<div class="loading" style="color:var(--red)">Google Sheet se connect nahi hua — '+e.message+'</div>';
  }
}

/* =========================================================
   TOOLS
   ========================================================= */
function fmtNum(n){return n.toLocaleString('en-IN',{maximumFractionDigits:2});}

function calcPositionSizing(){
  const cap=parseFloat(document.getElementById('ps-cap').value)||0;
  const riskPctVal=parseFloat(document.getElementById('ps-risk').value)||0;
  const entry=parseFloat(document.getElementById('ps-entry').value);
  const sl=parseFloat(document.getElementById('ps-sl').value);
  const rows=document.querySelectorAll('#ps-results .t-rrow .v');

  if(!entry||!sl||entry===sl){rows.forEach(r=>r.textContent='—');return;}

  const riskAmt=cap*(riskPctVal/100);
  const riskPerShare=Math.abs(entry-sl);
  const qty=Math.floor(riskAmt/riskPerShare);
  const posValue=qty*entry;
  const pctCap=cap?(posValue/cap*100):0;
  const dir=entry>sl?1:-1; // long if entry above SL
  const r2=entry+dir*riskPerShare*2;
  const r3=entry+dir*riskPerShare*3;

  rows[0].textContent='₹'+fmtNum(riskAmt); rows[0].className='v a';
  rows[1].textContent='₹'+fmtNum(riskPerShare);
  rows[2].textContent=qty.toLocaleString('en-IN'); rows[2].className='v g';
  rows[3].textContent='₹'+fmtNum(posValue);
  rows[4].textContent=pctCap.toFixed(1)+'%'; rows[4].className=pctCap>25?'v a':'v b';
  rows[5].textContent='₹'+fmtNum(r2);
  rows[6].textContent='₹'+fmtNum(r3);
}

function calcRMultiple(){
  const entry=parseFloat(document.getElementById('rm-entry').value);
  const sl=parseFloat(document.getElementById('rm-sl').value);
  const cur=parseFloat(document.getElementById('rm-cur').value);
  const tbody=document.querySelector('#rm-table tbody');

  if(!entry||!sl||entry===sl){tbody.innerHTML='<tr><td colspan="4" style="color:var(--muted);text-align:center">Entry aur SL bharo to R-levels dikhenge</td></tr>';return;}

  const risk=Math.abs(entry-sl);
  const dir=entry>sl?1:-1;
  const levels=[-1,0,0.5,1,1.5,2,3,4,5];
  tbody.innerHTML=levels.map(r=>{
    const price=entry+dir*risk*r;
    const gain=((price-entry)/entry*100);
    let status='<span class="status-pend">Pending</span>';
    if(cur){
      const hit=dir===1?cur>=price:cur<=price;
      status=hit?'<span class="status-hit">✓ Hit</span>':'<span class="status-pend">Pending</span>';
    }
    const isCur=r===0;
    return `<tr class="${isCur?'cur':''}"><td>${r===0?'Entry':r+'R'}</td><td>₹${fmtNum(price)}</td><td style="color:${gain>=0?'var(--green)':'var(--red)'}">${gain>=0?'+':''}${gain.toFixed(2)}%</td><td>${r===-1?'SL':status}</td></tr>`;
  }).join('');
}

['ps-cap','ps-risk','ps-entry','ps-sl'].forEach(id=>document.getElementById(id).addEventListener('input',calcPositionSizing));
['rm-entry','rm-sl','rm-cur'].forEach(id=>document.getElementById(id).addEventListener('input',calcRMultiple));

/* ============ INIT ============ */
document.getElementById('overlay').addEventListener('click',function(e){if(e.target===this)closeModal();});

(function init(){
  const initial=(location.hash||'#journal').replace('#','');
  switchView(['positions','journal','dashboard','analytics','watchlist','tools'].includes(initial)?initial:'positions');
  loadTrades();
  loadWatchlist();
  calcPositionSizing();
})();
