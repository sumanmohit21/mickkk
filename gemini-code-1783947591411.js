document.addEventListener("DOMContentLoaded", () => {
    // 1. Initializations
    initTabNavigation();
    initModalEvents();
    initTickerDropdownFix();
    initWatchlistSystem();
    initAnalyticsCharts();
});

// MODULE 1: Sub-Pages Single View Router Navigation
function initTabNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTabId = item.getAttribute('data-tab');

            // Switch layout menu states
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Switch active view block panel
            tabPanes.forEach(pane => {
                if (pane.id === targetTabId) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });
        });
    });
}

// MODULE 2: New Trade Modal Popup Controls
function initModalEvents() {
    const modal = document.getElementById('tradeModal');
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelModalBtn');

    if(openBtn) openBtn.addEventListener('click', () => modal.style.display = 'flex');
    if(closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    if(cancelBtn) cancelBtn.addEventListener('click', () => modal.style.display = 'none');
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

// MODULE 3: FIX - Searchable Ticker Dropdown Controller System
function initTickerDropdownFix() {
    // NSE/Nifty Top Stocks Data Array Mapping List
    const TICKER_DATASET = [
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd' },
        { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd' },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd' },
        { symbol: 'SBIN', name: 'State Bank of India' },
        { symbol: 'TCS', name: 'Tata Consultancy Services Ltd' },
        { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd' },
        { symbol: 'LICI', name: 'Life Insurance Corporation' },
        { symbol: 'LT', name: 'Larsen & Toubro Ltd' },
        { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd' },
        { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical' },
        { symbol: 'MARUTI', name: 'Maruti Suzuki India' },
        { symbol: 'INFY', name: 'Infosys Ltd' },
        { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ' },
        { symbol: 'ADANIPOWER', name: 'Adani Power Ltd' },
        { symbol: 'AXISBANK', name: 'Axis Bank Ltd' },
        { symbol: 'ADANIENT', name: 'Adani Enterprises' },
        { symbol: 'TITAN', name: 'Titan Company Ltd' }
    ];

    const tickerInput = document.getElementById('tradeTickerInput');
    const dropdownUl = document.getElementById('tickerDropdownList');

    if (!tickerInput || !dropdownUl) return;

    // Open list dropdown on input box focus action
    tickerInput.addEventListener('focus', () => {
        renderFilteredStocks(TICKER_DATASET);
        dropdownUl.classList.remove('hidden');
    });

    // Auto filter mapping array list when user types keywords
    tickerInput.addEventListener('input', (e) => {
        const query = e.target.value.toUpperCase();
        const filtered = TICKER_DATASET.filter(item => 
            item.symbol.includes(query) || item.name.toUpperCase().includes(query)
        );
        renderFilteredStocks(filtered);
    });

    // Auto close selection window if clicked outside component zone
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-wrapper')) {
            dropdownUl.classList.add('hidden');
        }
    });

    function renderFilteredStocks(stocksList) {
        dropdownUl.innerHTML = '';
        if (stocksList.length === 0) {
            dropdownUl.innerHTML = `<li style="color:var(--text-muted); cursor:default;">No stocks match</li>`;
            return;
        }

        stocksList.forEach(stock => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${stock.symbol}</strong> <span class="comp-name">${stock.name}</span>`;
            li.addEventListener('click', () => {
                tickerInput.value = stock.symbol;
                dropdownUl.classList.add('hidden');
            });
            dropdownUl.appendChild(li);
        });
    }
}

// MODULE 4: Local Simulated Watchlist Storage Engine
function initWatchlistSystem() {
    const form = document.getElementById('watchlistForm');
    const container = document.getElementById('watchlistContainer');
    const badge = document.getElementById('wlCountBadge');
    
    let watchlistArray = [];

    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newItem = {
                ticker: document.getElementById('wlTicker').value.toUpperCase(),
                date: document.getElementById('wlDate').value || '13-07-2026',
                company: document.getElementById('wlCompany').value || 'Unknown Stock',
                pattern: document.getElementById('wlPattern').value || 'Setup Setup',
                entry: document.getElementById('wlEntry').value || '0',
                sl: document.getElementById('wlSl').value || '0',
                target: document.getElementById('wlTarget').value || '0',
                notes: document.getElementById('wlNotes').value || ''
            };

            watchlistArray.push(newItem);
            form.reset();
            updateWatchlistView();
        });
    }

    function updateWatchlistView() {
        if(watchlistArray.length === 0) {
            badge.innerText = "0";
            return;
        }
        badge.innerText = watchlistArray.length;
        container.innerHTML = ''; // Clear default state views

        // Render mini tables inside view row blocks
        let htmlTable = `
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                <thead>
                    <tr style="border-bottom:1px solid var(--border-color); color:var(--text-muted);">
                        <th style="padding:10px;">STOCK</th>
                        <th style="padding:10px;">SETUP</th>
                        <th style="padding:10px;">ENTRY</th>
                        <th style="padding:10px;">SL</th>
                        <th style="padding:10px;">TARGET</th>
                    </tr>
                </thead>
                <tbody>
        `;

        watchlistArray.forEach(item => {
            htmlTable += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.02);">
                    <td style="padding:12px;"><strong>${item.ticker}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${item.company}</span></td>
                    <td style="padding:12px;"><span class="badge">${item.pattern}</span></td>
                    <td class="mono" style="padding:12px;">₹${item.entry}</td>
                    <td class="mono text-red" style="padding:12px;">₹${item.sl}</td>
                    <td class="mono text-green" style="padding:12px;">₹${item.target}</td>
                </tr>
            `;
        });

        htmlTable += `</tbody></table>`;
        container.innerHTML = htmlTable;
    }
}

// MODULE 5: Complete Research Charts Engine (Chart.js Renderer Core)
function initAnalyticsCharts() {
    const ctxOptions = { responsive: true, plugins: { legend: { display: false } } };

    // Chart 1: Equity Curve
    new Chart(document.getElementById('equityCurveChart'), {
        type: 'line',
        data: { labels: ['T1','T2','T3','T4','T5','T6','T7'], datasets: [{ data: [0, 4000, 2500, 7000, 9500, 8000, 12450], borderColor: '#26a69a', tension: 0.2, fill:false }] },
        options: ctxOptions
    });

    // Chart 2: Capital Growth
    new Chart(document.getElementById('capitalGrowthChart'), {
        type: 'line',
        data: { labels: ['May', 'Jun', 'Jul'], datasets: [{ data: [300000, 308000, 312450], borderColor: '#00ffff', tension: 0.1 }] },
        options: ctxOptions
    });

    // Chart 3: Drawdown
    new Chart(document.getElementById('drawdownChart'), {
        type: 'line',
        data: { labels: ['T1','T2','T3','T4','T5'], datasets: [{ data: [0, -1.2, 0, -0.8, -2.1], borderColor: '#ef5350', fill: true, backgroundColor: 'rgba(239,83,80,0.1)' }] },
        options: ctxOptions
    });

    // Chart 4: Monthly P&L
    new Chart(document.getElementById('monthlyPlChart'), {
        type: 'bar',
        data: { labels: ['Jan','Feb','Mar','Apr','May','Jun'], datasets: [{ data: [3000, -1500, 4200, 8900, -2000, 6100], backgroundColor: '#26a69a' }] },
        options: ctxOptions
    });

    // Chart 5: Day Avg PL
    new Chart(document.getElementById('avgPlDayChart'), {
        type: 'bar',
        data: { labels: ['Mon','Tue','Wed','Thu','Fri'], datasets: [{ data: [1200, 400, -300, 2100, 800], backgroundColor: '#ffb300' }] },
        options: ctxOptions
    });

    // Chart 6: Trades Count By Day
    new Chart(document.getElementById('tradesDayChart'), {
        type: 'bar',
        data: { labels: ['Mon','Tue','Wed','Thu','Fri'], datasets: [{ data: [5, 8, 4, 9, 3], backgroundColor: '#717f94' }] },
        options: ctxOptions
    });

    // Chart 7: Pattern Impact Matrix
    new Chart(document.getElementById('patternImpactChart'), {
        type: 'bar',
        data: { labels: ['VCP','HLR BO','Pullback'], datasets: [{ data: [8500, 4200, -2500], backgroundColor: ['#26a69a','#26a69a','#ef5350'] }] },
        options: ctxOptions
    });

    // Chart 8: Trades Count Per Pattern
    new Chart(document.getElementById('tradesPatternChart'), {
        type: 'doughnut',
        data: { labels: ['VCP','HLR BO','Pullback'], datasets: [{ data: [12, 8, 4], backgroundColor: ['#00ffff','#ffb300','#ef5350'] }] }
    });

    // Chart 9: Exit Rules
    new Chart(document.getElementById('exitRuleChart'), {
        type: 'bar',
        data: { labels: ['Trailing SL','Target Hit','Hard SL','End of Day'], datasets: [{ data: [10, 6, 5, 3], backgroundColor: '#171d26', borderColor:'#1e2632', borderWidth:1 }] },
        options: ctxOptions
    });
}