# Finance Tracker — Expense & Budget Visualizer

A mobile-friendly web app to track daily spending with visual charts and budget management.

---

## ✅ Required Features (MVP)

### 1. Input Form
- ✅ **Item Name** field
- ✅ **Amount** field (number input)
- ✅ **Category** dropdown (Food, Transport, Fun + custom categories)
- ✅ **Type** selector (Income / Expense)
- ✅ **Date** picker
- ✅ Transaction added to list on submit
- ✅ **Validation**: All fields required before submit
- ✅ **Inline error messages** per field

### 2. Transaction List
- ✅ Scrollable list showing all transactions
- ✅ Each item shows: **name, amount, category**
- ✅ **Delete button** per transaction
- ✅ Empty state message when no transactions

### 3. Total Balance
- ✅ Displayed at the top in banner cards
- ✅ Shows: Total Balance, Total Income, Total Expenses
- ✅ **Updates automatically** when items added/deleted

### 4. Visual Chart
- ✅ **Pie chart** showing spending distribution by category
- ✅ Built with **Chart.js** (loaded via CDN)
- ✅ **Updates automatically** when transactions change
- ✅ Expenses-only chart (grouped by category)
- ✅ Empty state when no expense data

---

## ✅ Technical Constraints

### TC-1: Technology Stack
- ✅ **HTML** for structure (`index.html`)
- ✅ **CSS** for styling (`css/styles.css`)
- ✅ **Vanilla JavaScript** — no React, Vue, Angular, etc.
- ✅ No backend server required (pure client-side)

### TC-2: Data Storage
- ✅ **Browser localStorage API**
- ✅ All data stored client-side only
- ✅ Keys: `ft_transactions`, `ft_categories`, `ft_theme`, `ft_spending_limit`

### TC-3: Browser Compatibility
- ✅ Works in modern browsers (Chrome, Firefox, Edge, Safari)
- ✅ Can be used as standalone web app
- ✅ No polyfills or transpilation needed

---

## ✅ Non-Functional Requirements

### NFR-1: Simplicity
- ✅ Clean, minimal interface
- ✅ Easy to understand and use
- ✅ No complex setup required
- ✅ No test setup required

### NFR-2: Performance
- ✅ Fast load time (no build step, no npm packages)
- ✅ Responsive UI interactions
- ✅ No lag when updating data (local state + localStorage)

### NFR-3: Visual Design
- ✅ User-friendly aesthetic with CSS custom properties
- ✅ Clear visual hierarchy (cards, panels, modals)
- ✅ Readable typography (system fonts)
- ✅ Smooth animations (fade-in, slide-in)

---

## ✅ Folder Rules

```
finance-tracker/
├── index.html           ← 1 HTML file
├── css/
│   └── styles.css       ← only 1 CSS file ✅
├── js/
│   └── app.js           ← only 1 JS file ✅
└── .kiro/
    └── steering/
        └── project.md
```

- ✅ **Only 1 CSS file** inside `css/`
- ✅ **Only 1 JavaScript file** inside `js/`
- ✅ Code is clean and readable with comments

---

## ✅ Optional Challenges (3 out of 5)

### Implemented:

1. ✅ **Custom categories** — ⚙️ button opens modal to add/remove categories (Food, Transport, Fun are protected)
2. ✅ **Monthly summary view** — Cards showing income/expenses/balance per calendar month
3. ✅ **Dark/light mode toggle** — 🌙/☀️ button in header; preference saved to localStorage

### Bonus (also implemented):
4. ✅ **Sort transactions** — by date (newest/oldest), amount (↑↓), or category (A–Z)
5. ✅ **Highlight spending over limit** — Set monthly expense cap; exceeded items are highlighted + alert banner

---

## 🚀 Deployment Checklist

### GitHub
- ✅ `.kiro/` folder present in repo (required for AWS Builder ID)
- ⏳ Push code to GitHub
- ⏳ Publish site on **GitHub Pages**

### How to Deploy:
1. Open **GitHub Desktop**
2. Commit all files (including `.kiro/`)
3. Publish repository to GitHub
4. Go to **Settings → Pages**
5. Set source to **Deploy from branch `main` / root**
6. Site will be live at `https://<username>.github.io/finance-tracker/`

---

## 📦 Submission Requirements

- ✅ **AWS Builder ID** — `.kiro` folder is present in repo
- ⏳ **GitHub Repo URL**
- ⏳ **Published website URL** (GitHub Pages)

Submit all 3 via Paperform on Thursday.

---

## 🛠️ Tech Stack Summary

| Component | Technology |
|-----------|-----------|
| Structure | HTML5 |
| Styling | CSS3 (custom properties, dark mode) |
| Logic | Vanilla JavaScript (ES6+) |
| Chart | Chart.js 4.4.4 (CDN) |
| Storage | localStorage API |
| Deployment | GitHub Pages |

---

## 📱 Features at a Glance

- 💰 Track income & expenses
- 🍔🚗🎉 Built-in + custom categories
- 📊 Live pie chart of spending by category
- 🌙 Dark mode support
- 📅 Monthly breakdown cards
- 🔍 Sort & filter transactions
- ⚡ Set spending limits with alerts
- 📱 Mobile-friendly responsive design
- 💾 All data stored locally (no server needed)

---

**Made with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools!**
