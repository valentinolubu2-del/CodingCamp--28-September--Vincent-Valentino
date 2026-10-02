---
inclusion: always
---

# Finance Tracker — Project Steering

## Project Overview
A client-side personal finance tracker built with vanilla HTML, CSS, and JavaScript.
No frameworks, no backend, no build tools. Data lives entirely in the browser's `localStorage`.

## Tech Stack Rules
- **HTML** — structure only, in `index.html` at the project root
- **CSS** — one file only: `css/styles.css`
- **JavaScript** — one file only: `js/app.js` — vanilla JS, no frameworks, no imports
- **Chart.js** — loaded via CDN (`<script>` tag in HTML), the only allowed external library
- **No Node.js, no npm, no bundlers, no TypeScript**

## File & Folder Rules
```
finance-tracker/
├── index.html          ← only HTML file
├── css/
│   └── styles.css      ← only CSS file
├── js/
│   └── app.js          ← only JS file
└── .kiro/
    └── steering/
        └── project.md
```
- Never add a second CSS or JS file
- Never add a `src/`, `dist/`, or `build/` folder
- Keep code clean, readable, and well-commented

## Core Features (always maintain these)
1. **Input Form** — fields: Item Name, Amount, Category (Food / Transport / Fun), Type, Date
2. **Validation** — all fields must be filled before a transaction is added; show inline errors per field
3. **Transaction List** — scrollable, shows name + amount + category; each item has a delete button
4. **Total Balance** — displayed at the top; updates automatically when items are added or deleted
5. **Pie Chart** — Chart.js pie chart showing expense distribution by category; updates automatically

## Optional Challenges (already implemented — keep them)
1. **Custom categories** — ⚙️ button opens a modal to add/remove categories; Food, Transport, Fun are protected built-ins
2. **Monthly summary view** — cards showing income / expenses / balance per calendar month
3. **Dark / light mode toggle** — 🌙/☀️ button in header; preference saved to `localStorage`

## Bonus Features (already implemented — keep them)
- Sort transactions by date, amount, or category
- Filter by month (header date picker)
- Spending limit — set a monthly expense cap; exceeded items are highlighted; banner alert shown

## localStorage Keys
| Key                  | Type       | Purpose                        |
|----------------------|------------|--------------------------------|
| `ft_transactions`    | JSON array | All transaction records        |
| `ft_categories`      | JSON array | User's category list           |
| `ft_theme`           | string     | `"light"` or `"dark"`         |
| `ft_spending_limit`  | string     | Monthly spending limit (float) |

## Transaction Shape
```js
{
  id:       string,   // uid()  — Date.now().toString(36) + random
  name:     string,   // item name
  amount:   number,   // positive float
  type:     string,   // "income" | "expense"
  category: string,   // e.g. "Food", "Transport", "Fun"
  date:     string,   // "YYYY-MM-DD"
}
```

## CSS Conventions
- Use CSS custom properties (`--clr-*`, `--radius*`, `--shadow*`) for all colours/radii/shadows
- Light/dark themes controlled via `[data-theme="dark"]` on `<html>`
- Mobile-first responsiveness with breakpoints at `900px` and `600px`
- Animations: `fadeUp` for list items, `slideIn` for alerts, `modalIn` for modals

## JavaScript Conventions
- `'use strict';` at the top
- State lives in a single `state` object; never scatter globals
- All persistence through the `save.*` helper object
- HTML output must always go through `escHtml()` to prevent XSS
- `renderAll()` is the single entry point that refreshes everything
- Chart is updated via `updateChart()` — reuses the existing `Chart.js` instance with `.update()` to avoid flicker
- DOM references cached once in the `dom` object using `$id()` / `$qs()` helpers

## Deployment
- Hosted on **GitHub Pages** (static site, no server needed)
- Source pushed to GitHub via GitHub Desktop
- The `.kiro/` folder must be committed and present in the repository (required for AWS Builder ID submission)

## What NOT to Do
- Do not introduce React, Vue, Angular, or any JS framework
- Do not add a `package.json` or install npm packages
- Do not split JS or CSS into multiple files
- Do not add a backend, API calls, or server-side logic
- Do not remove the `.kiro/steering/` folder — it must stay in the repo
