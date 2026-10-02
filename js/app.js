/**
 * Finance Tracker — app.js
 *
 * Core features:
 *  - Add & delete transactions
 *  - Categories (built-in + custom)
 *  - LocalStorage persistence
 *  - Filter (all / income / expense)
 *  - Live balance / income / expense totals
 *
 * Optional Challenges implemented (3/5):
 *  1. Custom categories       — add & remove via modal
 *  2. Monthly summary view    — breakdown cards per calendar month
 *  3. Dark / light mode toggle — persisted in localStorage
 *
 * Bonus:
 *  - Sort by date / amount / category
 *  - Filter by month
 *  - Highlight spending over a set limit (4th challenge)
 */

'use strict';

/* ============================================================
   CONSTANTS & STORAGE KEYS
   ============================================================ */
const STORAGE_KEYS = {
  TRANSACTIONS: 'ft_transactions',
  CATEGORIES:   'ft_categories',
  THEME:        'ft_theme',
  LIMIT:        'ft_spending_limit',
};

const DEFAULT_CATEGORIES = [
  'Food & Drink',
  'Transport',
  'Housing',
  'Healthcare',
  'Shopping',
  'Entertainment',
  'Education',
  'Utilities',
  'Salary',
  'Freelance',
  'Investment',
  'Other',
];

// Emoji map for category icons (fallback: 💵)
const CATEGORY_ICONS = {
  'Food & Drink':  '🍔',
  'Transport':     '🚗',
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

/* ============================================================
   STATE
   ============================================================ */
let state = {
  transactions:  [],   // { id, description, amount, type, category, date }
  categories:    [],   // string[]
  theme:         'light',
  spendingLimit: null, // number | null  (monthly expense limit in $)
  filter:        'all',        // 'all' | 'income' | 'expense'
  sort:          'date-desc',  // sort key
  monthFilter:   '',           // 'YYYY-MM' | ''
};

/* ============================================================
   PERSISTENCE HELPERS
   ============================================================ */
function loadState() {
  const raw = {
    transactions: localStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
    categories:   localStorage.getItem(STORAGE_KEYS.CATEGORIES),
    theme:        localStorage.getItem(STORAGE_KEYS.THEME),
    limit:        localStorage.getItem(STORAGE_KEYS.LIMIT),
  };

  state.transactions = raw.transactions ? JSON.parse(raw.transactions) : [];
  state.categories   = raw.categories   ? JSON.parse(raw.categories)   : [...DEFAULT_CATEGORIES];
  state.theme        = raw.theme || 'light';
  state.spendingLimit = raw.limit ? parseFloat(raw.limit) : null;
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
}

function saveCategories() {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
}

function saveTheme() {
  localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
}

function saveLimit() {
  if (state.spendingLimit !== null) {
    localStorage.setItem(STORAGE_KEYS.LIMIT, String(state.spendingLimit));
  } else {
    localStorage.removeItem(STORAGE_KEYS.LIMIT);
  }
}

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const dom = {
  // Totals
  totalBalance: document.getElementById('totalBalance'),
  totalIncome:  document.getElementById('totalIncome'),
  totalExpense: document.getElementById('totalExpense'),

  // Form
  form:        document.getElementById('transactionForm'),
  description: document.getElementById('description'),
  amount:      document.getElementById('amount'),
  type:        document.getElementById('type'),
  category:    document.getElementById('category'),
  date:        document.getElementById('date'),
  formError:   document.getElementById('formError'),

  // List
  list:        document.getElementById('transactionList'),
  emptyState:  document.getElementById('emptyState'),
  sortSelect:  document.getElementById('sortSelect'),
  clearAllBtn: document.getElementById('clearAllBtn'),
  filterBtns:  document.querySelectorAll('.filter-btn'),

  // Month filter
  monthSelect:   document.getElementById('monthSelect'),
  clearMonth:    document.getElementById('clearMonth'),

  // Summary cards
  limitAlert:       document.getElementById('limitAlert'),
  limitAlertAmount: document.getElementById('limitAlertAmount'),

  // Monthly summary
  monthlyBreakdown: document.getElementById('monthlyBreakdown'),

  // Theme
  themeToggle: document.getElementById('themeToggle'),
  themeIcon:   document.querySelector('.theme-toggle__icon'),

  // Category modal
  manageCategoriesBtn: document.getElementById('manageCategoriesBtn'),
  categoryModal:       document.getElementById('categoryModal'),
  closeModal:          document.getElementById('closeModal'),
  categoryModalBd:     document.querySelector('#categoryModal .modal__backdrop'),
  newCategoryInput:    document.getElementById('newCategoryInput'),
  addCategoryBtn:      document.getElementById('addCategoryBtn'),
  categoryList:        document.getElementById('categoryList'),
  categoryError:       document.getElementById('categoryError'),

  // Spending limit modal
  setLimitBtn:      document.getElementById('setLimitBtn'),
  limitModal:       document.getElementById('limitModal'),
  closeLimitModal:  document.getElementById('closeLimitModal'),
  limitModalBd:     document.querySelector('#limitModal .modal__backdrop'),
  limitInput:       document.getElementById('limitInput'),
  saveLimitBtn:     document.getElementById('saveLimitBtn'),
  removeLimitBtn:   document.getElementById('removeLimitBtn'),
};

/* ============================================================
   HELPERS
   ============================================================ */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr) {
  // dateStr is 'YYYY-MM-DD'
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMonth(ym) {
  // 'YYYY-MM' → 'October 2025'
  const [y, m] = ym.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || '💵';
}

function getCurrentYearMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/* ============================================================
   THEME  (Optional Challenge #3)
   ============================================================ */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  dom.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(state.theme);
  saveTheme();
}

/* ============================================================
   CATEGORIES  (Optional Challenge #1)
   ============================================================ */
function populateCategorySelect() {
  const current = dom.category.value;
  dom.category.innerHTML = '';
  state.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = `${getCategoryIcon(cat)}  ${cat}`;
    dom.category.appendChild(opt);
  });
  // Restore selection if still valid
  if (state.categories.includes(current)) {
    dom.category.value = current;
  }
}

function renderCategoryList() {
  dom.categoryList.innerHTML = '';
  state.categories.forEach(cat => {
    const li = document.createElement('li');
    const isDefault = DEFAULT_CATEGORIES.includes(cat);
    if (isDefault) li.classList.add('is-default');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${getCategoryIcon(cat)}  ${cat}`;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'tx-delete';
    deleteBtn.title = isDefault ? 'Default category (cannot delete)' : 'Delete category';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => deleteCategory(cat));

    li.appendChild(nameSpan);
    li.appendChild(deleteBtn);
    dom.categoryList.appendChild(li);
  });
}

function addCategory() {
  const name = dom.newCategoryInput.value.trim();
  if (!name) {
    showCategoryError('Please enter a category name.');
    return;
  }
  if (state.categories.map(c => c.toLowerCase()).includes(name.toLowerCase())) {
    showCategoryError('Category already exists.');
    return;
  }
  state.categories.push(name);
  saveCategories();
  dom.newCategoryInput.value = '';
  hideCategoryError();
  renderCategoryList();
  populateCategorySelect();
}

function deleteCategory(cat) {
  if (DEFAULT_CATEGORIES.includes(cat)) return; // guard
  state.categories = state.categories.filter(c => c !== cat);
  // Re-assign transactions that used this category to 'Other'
  state.transactions = state.transactions.map(tx =>
    tx.category === cat ? { ...tx, category: 'Other' } : tx
  );
  saveCategories();
  saveTransactions();
  renderCategoryList();
  populateCategorySelect();
  renderAll();
}

function showCategoryError(msg) {
  dom.categoryError.textContent = msg;
  dom.categoryError.classList.remove('hidden');
}
function hideCategoryError() {
  dom.categoryError.classList.add('hidden');
}

/* ============================================================
   TRANSACTIONS — CRUD
   ============================================================ */
function addTransaction(e) {
  e.preventDefault();

  const description = dom.description.value.trim();
  const amount      = parseFloat(dom.amount.value);
  const type        = dom.type.value;
  const category    = dom.category.value;
  const date        = dom.date.value;

  // Validation
  if (!description) { showFormError('Please enter a description.'); return; }
  if (isNaN(amount) || amount <= 0) { showFormError('Please enter a valid amount.'); return; }
  if (!date) { showFormError('Please select a date.'); return; }

  const transaction = {
    id: generateId(),
    description,
    amount,
    type,
    category,
    date,
  };

  state.transactions.unshift(transaction);
  saveTransactions();
  hideFormError();
  dom.form.reset();
  setDefaultDate();
  populateCategorySelect(); // re-populate after reset
  renderAll();
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter(tx => tx.id !== id);
  saveTransactions();
  renderAll();
}

function clearAllTransactions() {
  if (!state.transactions.length) return;
  if (!confirm('Delete ALL transactions? This cannot be undone.')) return;
  state.transactions = [];
  saveTransactions();
  renderAll();
}

/* ============================================================
   FILTERS & SORT
   ============================================================ */
function getFilteredTransactions() {
  let txs = [...state.transactions];

  // Month filter
  if (state.monthFilter) {
    txs = txs.filter(tx => tx.date.startsWith(state.monthFilter));
  }

  // Type filter
  if (state.filter !== 'all') {
    txs = txs.filter(tx => tx.type === state.filter);
  }

  // Sort
  switch (state.sort) {
    case 'date-asc':
      txs.sort((a, b) => a.date.localeCompare(b.date));
      break;
    case 'date-desc':
      txs.sort((a, b) => b.date.localeCompare(a.date));
      break;
    case 'amount-desc':
      txs.sort((a, b) => b.amount - a.amount);
      break;
    case 'amount-asc':
      txs.sort((a, b) => a.amount - b.amount);
      break;
    case 'category':
      txs.sort((a, b) => a.category.localeCompare(b.category));
      break;
  }

  return txs;
}

/* ============================================================
   TOTALS
   ============================================================ */
function computeTotals(txs) {
  const income  = txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const expense = txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  return { income, expense, balance: income - expense };
}

/* ============================================================
   SPENDING LIMIT  (Bonus challenge)
   ============================================================ */
function getCurrentMonthExpenses() {
  const ym = getCurrentYearMonth();
  return state.transactions
    .filter(tx => tx.type === 'expense' && tx.date.startsWith(ym))
    .reduce((s, tx) => s + tx.amount, 0);
}

function checkSpendingLimit() {
  if (state.spendingLimit === null) {
    dom.limitAlert.classList.add('hidden');
    return;
  }
  const monthlyExpense = getCurrentMonthExpenses();
  if (monthlyExpense > state.spendingLimit) {
    dom.limitAlertAmount.textContent = formatCurrency(state.spendingLimit);
    dom.limitAlert.classList.remove('hidden');
  } else {
    dom.limitAlert.classList.add('hidden');
  }
}

/* ============================================================
   RENDER — Transaction List
   ============================================================ */
function renderTransactionList(txs) {
  dom.list.innerHTML = '';

  if (!txs.length) {
    dom.emptyState.classList.remove('hidden');
    return;
  }
  dom.emptyState.classList.add('hidden');

  // For per-item limit highlighting: track cumulative expense per month
  // We highlight individual expense items only if the running total for that
  // month has exceeded the limit at the time of that transaction.
  // Simpler approach: highlight all expense items in the current month
  // once the monthly limit is exceeded.
  const currentMonthExpense = getCurrentMonthExpenses();
  const limitExceeded = state.spendingLimit !== null && currentMonthExpense > state.spendingLimit;

  txs.forEach(tx => {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.dataset.id = tx.id;

    // Highlight expense items in current month when over limit
    const isCurrentMonth = tx.date.startsWith(getCurrentYearMonth());
    if (limitExceeded && tx.type === 'expense' && isCurrentMonth) {
      li.classList.add('over-limit');
    }

    const sign   = tx.type === 'income' ? '+' : '−';
    const cls    = `tx-amount--${tx.type}`;

    li.innerHTML = `
      <div class="tx-icon">${getCategoryIcon(tx.category)}</div>
      <div class="tx-info">
        <div class="tx-description">${escapeHtml(tx.description)}</div>
        <div class="tx-meta">${escapeHtml(tx.category)} · ${formatDate(tx.date)}</div>
      </div>
      <span class="tx-amount ${cls}">${sign}${formatCurrency(tx.amount)}</span>
      <button class="tx-delete" title="Delete transaction" aria-label="Delete ${escapeHtml(tx.description)}">×</button>
    `;

    li.querySelector('.tx-delete').addEventListener('click', () => deleteTransaction(tx.id));
    dom.list.appendChild(li);
  });
}

/* ============================================================
   RENDER — Summary Cards
   ============================================================ */
function renderSummaryCards(txs) {
  // Totals based on currently visible (filtered) transactions
  const { income, expense, balance } = computeTotals(txs);
  dom.totalBalance.textContent = formatCurrency(balance);
  dom.totalIncome.textContent  = formatCurrency(income);
  dom.totalExpense.textContent = formatCurrency(expense);
}

/* ============================================================
   RENDER — Monthly Summary  (Optional Challenge #2)
   ============================================================ */
function renderMonthlySummary() {
  // Group all transactions by YYYY-MM
  const monthMap = {};

  state.transactions.forEach(tx => {
    const ym = tx.date.slice(0, 7); // 'YYYY-MM'
    if (!monthMap[ym]) monthMap[ym] = { income: 0, expense: 0 };
    if (tx.type === 'income')  monthMap[ym].income  += tx.amount;
    if (tx.type === 'expense') monthMap[ym].expense += tx.amount;
  });

  const months = Object.keys(monthMap).sort((a, b) => b.localeCompare(a)); // newest first

  if (!months.length) {
    dom.monthlyBreakdown.innerHTML = '<p class="empty-state">No data yet.</p>';
    return;
  }

  dom.monthlyBreakdown.innerHTML = '';

  months.forEach(ym => {
    const { income, expense } = monthMap[ym];
    const balance = income - expense;

    const card = document.createElement('div');
    card.className = 'month-card';
    card.innerHTML = `
      <p class="month-card__title">📅 ${formatMonth(ym)}</p>
      <div class="month-card__row">
        <span>Income</span>
        <span class="income">${formatCurrency(income)}</span>
      </div>
      <div class="month-card__row">
        <span>Expenses</span>
        <span class="expense">${formatCurrency(expense)}</span>
      </div>
      <div class="month-card__row">
        <span>Net Balance</span>
        <span class="balance">${formatCurrency(balance)}</span>
      </div>
    `;
    dom.monthlyBreakdown.appendChild(card);
  });
}

/* ============================================================
   RENDER — ALL
   ============================================================ */
function renderAll() {
  const txs = getFilteredTransactions();
  renderSummaryCards(txs);
  renderTransactionList(txs);
  renderMonthlySummary();
  checkSpendingLimit();
}

/* ============================================================
   FORM HELPERS
   ============================================================ */
function showFormError(msg) {
  dom.formError.textContent = msg;
  dom.formError.classList.remove('hidden');
}
function hideFormError() {
  dom.formError.classList.add('hidden');
}

function setDefaultDate() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  dom.date.value = `${y}-${m}-${d}`;
}

/* ============================================================
   SECURITY — HTML ESCAPING
   ============================================================ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(modal) {
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
function bindEvents() {
  // --- Form submit ---
  dom.form.addEventListener('submit', addTransaction);

  // Clear form error on input
  [dom.description, dom.amount, dom.date].forEach(el => {
    el.addEventListener('input', hideFormError);
  });

  // --- Theme toggle ---
  dom.themeToggle.addEventListener('click', toggleTheme);

  // --- Filter buttons ---
  dom.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      renderAll();
    });
  });

  // --- Sort ---
  dom.sortSelect.addEventListener('change', () => {
    state.sort = dom.sortSelect.value;
    renderAll();
  });

  // --- Clear all ---
  dom.clearAllBtn.addEventListener('click', clearAllTransactions);

  // --- Month filter ---
  dom.monthSelect.addEventListener('change', () => {
    state.monthFilter = dom.monthSelect.value;
    renderAll();
  });
  dom.clearMonth.addEventListener('click', () => {
    dom.monthSelect.value = '';
    state.monthFilter = '';
    renderAll();
  });

  // --- Category modal ---
  dom.manageCategoriesBtn.addEventListener('click', () => {
    renderCategoryList();
    hideCategoryError();
    openModal(dom.categoryModal);
  });
  dom.closeModal.addEventListener('click', () => closeModal(dom.categoryModal));
  dom.categoryModalBd.addEventListener('click', () => closeModal(dom.categoryModal));

  dom.addCategoryBtn.addEventListener('click', addCategory);
  dom.newCategoryInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addCategory(); }
  });

  // --- Spending limit modal ---
  dom.setLimitBtn.addEventListener('click', () => {
    dom.limitInput.value = state.spendingLimit !== null ? state.spendingLimit : '';
    openModal(dom.limitModal);
  });
  dom.closeLimitModal.addEventListener('click', () => closeModal(dom.limitModal));
  dom.limitModalBd.addEventListener('click', () => closeModal(dom.limitModal));

  dom.saveLimitBtn.addEventListener('click', () => {
    const val = parseFloat(dom.limitInput.value);
    if (isNaN(val) || val < 0) {
      alert('Please enter a valid spending limit.');
      return;
    }
    state.spendingLimit = val;
    saveLimit();
    closeModal(dom.limitModal);
    renderAll();
  });

  dom.removeLimitBtn.addEventListener('click', () => {
    state.spendingLimit = null;
    saveLimit();
    closeModal(dom.limitModal);
    renderAll();
  });

  // --- Close modals on Escape ---
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal(dom.categoryModal);
      closeModal(dom.limitModal);
    }
  });
}

/* ============================================================
   INITIALISE
   ============================================================ */
function init() {
  loadState();
  applyTheme(state.theme);
  setDefaultDate();
  populateCategorySelect();
  bindEvents();
  renderAll();
}

// Kick everything off once the DOM is ready
document.addEventListener('DOMContentLoaded', init);
