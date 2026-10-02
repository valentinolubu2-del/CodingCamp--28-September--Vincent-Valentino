/**
 * Finance Tracker — app.js
 *
 * Required features:
 *  ✅ Input form: Item Name, Amount, Category (Food / Transport / Fun)
 *  ✅ Validation: all fields must be filled
 *  ✅ Transaction list: scrollable, shows name + amount + category, delete button
 *  ✅ Total balance: displayed at top, auto-updates
 *  ✅ Pie chart: spending distribution by category via Chart.js, auto-updates
 *
 * Optional challenges (3/5):
 *  ✅ Custom categories — add/remove via ⚙️ modal
 *  ✅ Monthly summary view — per-month breakdown cards
 *  ✅ Dark / light mode toggle — persisted in localStorage
 *
 * Bonus:
 *  ✅ Sort by date / amount / category
 *  ✅ Filter by month
 *  ✅ Highlight spending over a monthly limit
 */

'use strict';

/* ============================================================
   CONSTANTS
   ============================================================ */
const STORAGE = {
  TRANSACTIONS: 'ft_transactions',
  CATEGORIES:   'ft_categories',
  THEME:        'ft_theme',
  LIMIT:        'ft_spending_limit',
};

/** The three required built-in categories */
const BUILTIN_CATEGORIES = ['Food', 'Transport', 'Fun'];

/** Emoji icons — built-ins + common extras */
const ICONS = {
  'Food':          '🍔',
  'Transport':     '🚗',
  'Fun':           '🎉',
  'Housing':       '🏠',
  'Healthcare':    '💊',
  'Shopping':      '🛍️',
  'Entertainment': '🎬',
  'Education':     '📚',
  'Utilities':     '💡',
  'Salary':        '💼',
  'Freelance':     '💻',
  'Investment':    '📈',
  'Other':         '📌',
};

/** Colour palette for pie chart slices */
const CHART_COLOURS = [
  '#4f46e5', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
  '#ec4899', '#14b8a6', '#a78bfa', '#fb923c',
];

/* ============================================================
   STATE
   ============================================================ */
let state = {
  transactions:  [],    // { id, name, amount, type, category, date }
  categories:    [],    // string[]
  theme:         'light',
  spendingLimit: null,  // number | null
  filter:        'all', // 'all' | 'income' | 'expense'
  sort:          'date-desc',
  monthFilter:   '',
};

let pieChart = null; // Chart.js instance

/* ============================================================
   PERSISTENCE
   ============================================================ */
function loadState() {
  const tx  = localStorage.getItem(STORAGE.TRANSACTIONS);
  const cat = localStorage.getItem(STORAGE.CATEGORIES);
  const lim = localStorage.getItem(STORAGE.LIMIT);

  state.transactions  = tx  ? JSON.parse(tx)  : [];
  state.categories    = cat ? JSON.parse(cat) : [...BUILTIN_CATEGORIES];
  state.theme         = localStorage.getItem(STORAGE.THEME) || 'light';
  state.spendingLimit = lim ? parseFloat(lim) : null;
}

const save = {
  transactions: () => localStorage.setItem(STORAGE.TRANSACTIONS, JSON.stringify(state.transactions)),
  categories:   () => localStorage.setItem(STORAGE.CATEGORIES,   JSON.stringify(state.categories)),
  theme:        () => localStorage.setItem(STORAGE.THEME, state.theme),
  limit:        () => {
    if (state.spendingLimit !== null) {
      localStorage.setItem(STORAGE.LIMIT, String(state.spendingLimit));
    } else {
      localStorage.removeItem(STORAGE.LIMIT);
    }
  },
};

/* ============================================================
   DOM CACHE
   ============================================================ */
const $id = id => document.getElementById(id);
const $qs = sel => document.querySelector(sel);

const dom = {
  // Balance banner
  totalBalance: $id('totalBalance'),
  totalIncome:  $id('totalIncome'),
  totalExpense: $id('totalExpense'),

  // Form fields
  form:        $id('transactionForm'),
  itemName:    $id('itemName'),
  amount:      $id('amount'),
  type:        $id('type'),
  category:    $id('category'),
  date:        $id('date'),

  // Field-level error spans
  nameError:   $id('nameError'),
  amountError: $id('amountError'),
  dateError:   $id('dateError'),

  // Transaction list
  list:        $id('transactionList'),
  emptyState:  $id('emptyState'),
  sortSelect:  $id('sortSelect'),
  clearAllBtn: $id('clearAllBtn'),
  filterBtns:  document.querySelectorAll('.filter-btn'),

  // Month filter
  monthSelect: $id('monthSelect'),
  clearMonth:  $id('clearMonth'),

  // Limit alert
  limitAlert:       $id('limitAlert'),
  limitAlertAmount: $id('limitAlertAmount'),

  // Chart
  spendingChart: $id('spendingChart'),
  chartEmpty:    $id('chartEmpty'),

  // Monthly summary
  monthlyBreakdown: $id('monthlyBreakdown'),
  monthlyEmpty:     $id('monthlyEmpty'),

  // Theme
  themeToggle: $id('themeToggle'),
  themeIcon:   $qs('.theme-toggle__icon'),

  // Category modal
  manageCategoriesBtn: $id('manageCategoriesBtn'),
  categoryModal:       $id('categoryModal'),
  closeModal:          $id('closeModal'),
  catModalBd:          $qs('#categoryModal .modal__backdrop'),
  newCategoryInput:    $id('newCategoryInput'),
  addCategoryBtn:      $id('addCategoryBtn'),
  categoryList:        $id('categoryList'),
  categoryError:       $id('categoryError'),

  // Limit modal
  setLimitBtn:      $id('setLimitBtn'),
  limitModal:       $id('limitModal'),
  closeLimitModal:  $id('closeLimitModal'),
  limitModalBd:     $qs('#limitModal .modal__backdrop'),
  limitInput:       $id('limitInput'),
  saveLimitBtn:     $id('saveLimitBtn'),
  removeLimitBtn:   $id('removeLimitBtn'),
};

/* ============================================================
   HELPERS
   ============================================================ */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function fmt(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });
}

function icon(category) {
  return ICONS[category] || '💵';
}

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

function currentYM() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#x27;');
}

/* ============================================================
   THEME  (Optional Challenge #3)
   ============================================================ */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  dom.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  // Refresh chart colours when theme switches
  if (pieChart) updateChart();
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(state.theme);
  save.theme();
}

/* ============================================================
   CATEGORIES  (Optional Challenge #1)
   ============================================================ */
function buildCategorySelect() {
  const prev = dom.category.value;
  dom.category.innerHTML = '';
  state.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = `${icon(cat)}  ${cat}`;
    dom.category.appendChild(opt);
  });
  if (state.categories.includes(prev)) dom.category.value = prev;
}

function renderCategoryModal() {
  dom.categoryList.innerHTML = '';
  state.categories.forEach(cat => {
    const isBuiltin = BUILTIN_CATEGORIES.includes(cat);
    const li = document.createElement('li');
    if (isBuiltin) li.classList.add('is-default');

    const span = document.createElement('span');
    span.textContent = `${icon(cat)}  ${cat}`;

    const del = document.createElement('button');
    del.className = 'tx-delete';
    del.title = isBuiltin ? 'Built-in category (cannot delete)' : 'Remove category';
    del.textContent = '×';
    del.addEventListener('click', () => removeCategory(cat));

    li.append(span, del);
    dom.categoryList.appendChild(li);
  });
}

function addCategory() {
  const name = dom.newCategoryInput.value.trim();
  if (!name) { setCatError('Enter a category name.'); return; }
  if (state.categories.map(c => c.toLowerCase()).includes(name.toLowerCase())) {
    setCatError('Category already exists.');
    return;
  }
  state.categories.push(name);
  save.categories();
  dom.newCategoryInput.value = '';
  clearCatError();
  renderCategoryModal();
  buildCategorySelect();
}

function removeCategory(cat) {
  if (BUILTIN_CATEGORIES.includes(cat)) return;
  state.categories = state.categories.filter(c => c !== cat);
  // Reassign orphaned transactions to 'Other' (add Other if missing)
  const fallback = state.categories[0] || 'Other';
  if (!state.categories.includes('Other') && fallback === 'Other') {
    state.categories.push('Other');
  }
  state.transactions = state.transactions.map(tx =>
    tx.category === cat ? { ...tx, category: fallback } : tx
  );
  save.categories();
  save.transactions();
  renderCategoryModal();
  buildCategorySelect();
  renderAll();
}

function setCatError(msg)  { dom.categoryError.textContent = msg; }
function clearCatError()   { dom.categoryError.textContent = ''; }

/* ============================================================
   VALIDATION HELPERS
   ============================================================ */
function setFieldError(input, errorEl, msg) {
  errorEl.textContent = msg;
  input.classList.add('invalid');
}

function clearFieldError(input, errorEl) {
  errorEl.textContent = '';
  input.classList.remove('invalid');
}

/* ============================================================
   TRANSACTIONS — CRUD
   ============================================================ */
function addTransaction(e) {
  e.preventDefault();

  const name     = dom.itemName.value.trim();
  const amount   = parseFloat(dom.amount.value);
  const type     = dom.type.value;
  const category = dom.category.value;
  const date     = dom.date.value;

  // --- Validate all fields ---
  let valid = true;

  if (!name) {
    setFieldError(dom.itemName, dom.nameError, 'Item name is required.');
    valid = false;
  } else {
    clearFieldError(dom.itemName, dom.nameError);
  }

  if (!dom.amount.value || isNaN(amount) || amount <= 0) {
    setFieldError(dom.amount, dom.amountError, 'Enter a valid amount greater than 0.');
    valid = false;
  } else {
    clearFieldError(dom.amount, dom.amountError);
  }

  if (!date) {
    setFieldError(dom.date, dom.dateError, 'Date is required.');
    valid = false;
  } else {
    clearFieldError(dom.date, dom.dateError);
  }

  if (!valid) return;

  // --- Create & store ---
  state.transactions.unshift({ id: uid(), name, amount, type, category, date });
  save.transactions();

  // Reset form
  dom.form.reset();
  dom.date.value = todayStr();
  buildCategorySelect();

  renderAll();
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter(tx => tx.id !== id);
  save.transactions();
  renderAll();
}

function clearAll() {
  if (!state.transactions.length) return;
  if (!confirm('Delete ALL transactions? This cannot be undone.')) return;
  state.transactions = [];
  save.transactions();
  renderAll();
}

/* ============================================================
   FILTERING & SORTING
   ============================================================ */
function getVisible() {
  let txs = [...state.transactions];

  if (state.monthFilter) txs = txs.filter(tx => tx.date.startsWith(state.monthFilter));
  if (state.filter !== 'all') txs = txs.filter(tx => tx.type === state.filter);

  switch (state.sort) {
    case 'date-asc':     txs.sort((a,b) => a.date.localeCompare(b.date));       break;
    case 'date-desc':    txs.sort((a,b) => b.date.localeCompare(a.date));       break;
    case 'amount-desc':  txs.sort((a,b) => b.amount - a.amount);                break;
    case 'amount-asc':   txs.sort((a,b) => a.amount - b.amount);                break;
    case 'category':     txs.sort((a,b) => a.category.localeCompare(b.category)); break;
  }

  return txs;
}

/* ============================================================
   TOTALS
   ============================================================ */
function totals(txs) {
  const income  = txs.filter(t => t.type === 'income').reduce((s,t)  => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

/* ============================================================
   SPENDING LIMIT
   ============================================================ */
function thisMonthExpenses() {
  return state.transactions
    .filter(tx => tx.type === 'expense' && tx.date.startsWith(currentYM()))
    .reduce((s, tx) => s + tx.amount, 0);
}

function checkLimit() {
  if (state.spendingLimit === null) { dom.limitAlert.classList.add('hidden'); return; }
  if (thisMonthExpenses() > state.spendingLimit) {
    dom.limitAlertAmount.textContent = fmt(state.spendingLimit);
    dom.limitAlert.classList.remove('hidden');
  } else {
    dom.limitAlert.classList.add('hidden');
  }
}

/* ============================================================
   RENDER — Balance Banner
   ============================================================ */
function renderBanner(txs) {
  const { income, expense, balance } = totals(txs);
  dom.totalBalance.textContent = fmt(balance);
  dom.totalIncome.textContent  = fmt(income);
  dom.totalExpense.textContent = fmt(expense);
}

/* ============================================================
   RENDER — Transaction List
   ============================================================ */
function renderList(txs) {
  dom.list.innerHTML = '';

  if (!txs.length) {
    dom.emptyState.classList.remove('hidden');
    return;
  }
  dom.emptyState.classList.add('hidden');

  const limitExceeded = state.spendingLimit !== null && thisMonthExpenses() > state.spendingLimit;
  const ym = currentYM();

  txs.forEach(tx => {
    const li = document.createElement('li');
    li.className = 'transaction-item';

    if (limitExceeded && tx.type === 'expense' && tx.date.startsWith(ym)) {
      li.classList.add('over-limit');
    }

    const sign = tx.type === 'income' ? '+' : '−';
    const cls  = `tx-amount--${tx.type}`;

    li.innerHTML = `
      <div class="tx-icon">${icon(tx.category)}</div>
      <div class="tx-info">
        <div class="tx-name">${escHtml(tx.name)}</div>
        <div class="tx-meta">${escHtml(tx.category)} · ${fmtDate(tx.date)}</div>
      </div>
      <span class="tx-amount ${cls}">${sign}${fmt(tx.amount)}</span>
      <button class="tx-delete" title="Delete" aria-label="Delete ${escHtml(tx.name)}">×</button>
    `;

    li.querySelector('.tx-delete').addEventListener('click', () => deleteTransaction(tx.id));
    dom.list.appendChild(li);
  });
}

/* ============================================================
   RENDER — Pie Chart  (Required)
   Chart shows expense distribution by category.
   Automatically updates whenever data changes.
   ============================================================ */
function updateChart() {
  // Only count expenses; filter by active month if set
  let expenses = state.transactions.filter(tx => tx.type === 'expense');
  if (state.monthFilter) expenses = expenses.filter(tx => tx.date.startsWith(state.monthFilter));

  // Group by category
  const catTotals = {};
  expenses.forEach(tx => {
    catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
  });

  const labels = Object.keys(catTotals);
  const data   = labels.map(l => catTotals[l]);

  if (!labels.length) {
    // No expense data — destroy chart and show placeholder
    if (pieChart) { pieChart.destroy(); pieChart = null; }
    dom.spendingChart.classList.add('hidden');
    dom.chartEmpty.classList.remove('hidden');
    return;
  }

  dom.chartEmpty.classList.add('hidden');
  dom.spendingChart.classList.remove('hidden');

  // Detect dark mode for text colour
  const isDark   = document.documentElement.getAttribute('data-theme') === 'dark';
  const textClr  = isDark ? '#e8eaf0' : '#1a1d23';
  const mutedClr = isDark ? '#9ca3af' : '#6b7280';

  const colours = labels.map((_, i) => CHART_COLOURS[i % CHART_COLOURS.length]);

  if (pieChart) {
    // Update existing chart in place (no flicker)
    pieChart.data.labels         = labels;
    pieChart.data.datasets[0].data            = data;
    pieChart.data.datasets[0].backgroundColor = colours;
    pieChart.options.plugins.legend.labels.color = textClr;
    pieChart.update();
    return;
  }

  // Create fresh chart
  pieChart = new Chart(dom.spendingChart, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colours,
        borderWidth: 2,
        borderColor: isDark ? '#1c1f2a' : '#ffffff',
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 400 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textClr,
            font: { family: "'Segoe UI', system-ui, sans-serif", size: 12, weight: '600' },
            padding: 14,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const val = ctx.parsed;
              const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((val / sum) * 100).toFixed(1);
              return `  ${fmt(val)}  (${pct}%)`;
            },
          },
          bodyFont: { family: "'Segoe UI', system-ui, sans-serif", size: 13 },
          titleFont: { family: "'Segoe UI', system-ui, sans-serif", size: 13, weight: '700' },
        },
      },
    },
  });
}

/* ============================================================
   RENDER — Monthly Summary  (Optional Challenge #2)
   ============================================================ */
function renderMonthlySummary() {
  // Group all transactions (unfiltered) by YYYY-MM
  const map = {};
  state.transactions.forEach(tx => {
    const ym = tx.date.slice(0, 7);
    if (!map[ym]) map[ym] = { income: 0, expense: 0 };
    map[ym][tx.type] += tx.amount;
  });

  const months = Object.keys(map).sort((a, b) => b.localeCompare(a));

  if (!months.length) {
    dom.monthlyBreakdown.innerHTML = '';
    dom.monthlyEmpty.classList.remove('hidden');
    dom.monthlyBreakdown.appendChild(dom.monthlyEmpty);
    return;
  }

  dom.monthlyBreakdown.innerHTML = '';
  months.forEach(ym => {
    const { income = 0, expense = 0 } = map[ym];
    const bal = income - expense;

    const card = document.createElement('div');
    card.className = 'month-card';
    card.innerHTML = `
      <p class="month-card__title">📅 ${fmtMonth(ym)}</p>
      <div class="month-card__row"><span>Income</span>  <span class="pos">${fmt(income)}</span></div>
      <div class="month-card__row"><span>Expenses</span><span class="neg">${fmt(expense)}</span></div>
      <div class="month-card__row"><span>Balance</span> <span class="bal">${fmt(bal)}</span></div>
    `;
    dom.monthlyBreakdown.appendChild(card);
  });
}

/* ============================================================
   RENDER ALL
   ============================================================ */
function renderAll() {
  const txs = getVisible();
  renderBanner(txs);
  renderList(txs);
  updateChart();
  renderMonthlySummary();
  checkLimit();
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(el)  { el.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeModal(el) { el.classList.add('hidden');    document.body.style.overflow = ''; }

/* ============================================================
   EVENT WIRING
   ============================================================ */
function bindEvents() {
  // Form submit
  dom.form.addEventListener('submit', addTransaction);

  // Live-clear inline errors on input
  dom.itemName.addEventListener('input', () => clearFieldError(dom.itemName, dom.nameError));
  dom.amount.addEventListener('input',   () => clearFieldError(dom.amount,   dom.amountError));
  dom.date.addEventListener('change',    () => clearFieldError(dom.date,     dom.dateError));

  // Theme
  dom.themeToggle.addEventListener('click', toggleTheme);

  // Type filter
  dom.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      renderAll();
    });
  });

  // Sort
  dom.sortSelect.addEventListener('change', () => { state.sort = dom.sortSelect.value; renderAll(); });

  // Clear all
  dom.clearAllBtn.addEventListener('click', clearAll);

  // Month filter
  dom.monthSelect.addEventListener('change', () => { state.monthFilter = dom.monthSelect.value; renderAll(); });
  dom.clearMonth.addEventListener('click', () => { dom.monthSelect.value = ''; state.monthFilter = ''; renderAll(); });

  // Category modal
  dom.manageCategoriesBtn.addEventListener('click', () => { renderCategoryModal(); clearCatError(); openModal(dom.categoryModal); });
  dom.closeModal.addEventListener('click', () => closeModal(dom.categoryModal));
  dom.catModalBd.addEventListener('click', () => closeModal(dom.categoryModal));
  dom.addCategoryBtn.addEventListener('click', addCategory);
  dom.newCategoryInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } });

  // Spending limit modal
  dom.setLimitBtn.addEventListener('click', () => {
    dom.limitInput.value = state.spendingLimit ?? '';
    openModal(dom.limitModal);
  });
  dom.closeLimitModal.addEventListener('click', () => closeModal(dom.limitModal));
  dom.limitModalBd.addEventListener('click', () => closeModal(dom.limitModal));

  dom.saveLimitBtn.addEventListener('click', () => {
    const v = parseFloat(dom.limitInput.value);
    if (isNaN(v) || v < 0) { alert('Enter a valid spending limit.'); return; }
    state.spendingLimit = v;
    save.limit();
    closeModal(dom.limitModal);
    renderAll();
  });

  dom.removeLimitBtn.addEventListener('click', () => {
    state.spendingLimit = null;
    save.limit();
    closeModal(dom.limitModal);
    renderAll();
  });

  // Escape closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(dom.categoryModal); closeModal(dom.limitModal); }
  });
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  loadState();
  applyTheme(state.theme);
  dom.date.value = todayStr();
  buildCategorySelect();
  bindEvents();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
