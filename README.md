# Ganaka

Free calculators for everyone, by [EknathaLabs](https://eknathalabs.com). *Ganaka* is Sanskrit for "calculator".

119 calculators in 9 categories: Finance, Tax & Business, Health & Fitness, Education, Math, Date & Time, Converters, Travel, and Tech & DevOps.

- No sign-up, no ads, no tracking. Every calculation runs in your browser and nothing you type is sent anywhere.
- Works offline after the first visit (service worker).
- Light, Dark and New themes. Interface in English, Hindi, Telugu, Kannada, Tamil and Malayalam.
- Indian (lakh/crore) or international number grouping, and a currency symbol of your choice.
- Every calculator has its own URL (`/emi/`, `/sip/` ...) and its inputs are kept in the query string, so results can be shared as links.

## Deploy (GitHub Pages)

1. Push this folder as the root of a new repository.
2. Settings, Pages: deploy from the `main` branch, root folder.
3. Add a custom domain `ganaka.eknathalabs.com` and a DNS `CNAME` record pointing to your Pages host. GitHub creates the `CNAME` file for you.

The site is plain static files. The generated pages are already committed, so no build is needed to deploy.

## Rebuild after changing a calculator

```
cd _build
node build.js          # regenerates every page, sitemap and the service worker in the repo root
```

Requires Node 18 or newer. There are no npm dependencies. Set `GANAKA_BASE` if the site lives on another domain, for example `GANAKA_BASE=https://example.com node build.js`.

### Where things are

| Path | What |
|---|---|
| `_build/src/core.js` | Calculator registry, field builders, helpers and the safe expression parser (no `eval`) |
| `_build/src/c-*.js` | The calculators, one file per category |
| `_build/src/i18n.js` | Interface strings in six languages |
| `_build/src/app.js`, `app.css` | The interface |
| `_build/build.js` | Generates one stub page per calculator (title, description, formula, structured data) so each is crawlable, then the sitemap, manifest and service worker |

### Adding a calculator

Add a `def({...})` block to the matching `c-*.js` file. Fields are `N` (number), `S` (select), `TX` (text), `TA` (text area), `DA` (date), `DT` (date and time), `CB` (checkbox) and `ROWS` (editable table). `calc(v)` returns `{res:[R(label, value, kind, {hero:1})], table, chart, note}` and calls `fail('message')` for bad input. Then run `node build.js`.

## Tests

Tests live in `_build/tests`. They need Playwright (`npm i -g playwright`, then `npx playwright install chromium`) and Python 3 with `numpy` and `python-dateutil` for the reference check.

```
python3 -m http.server 8765          # in the repo root, in a second terminal
cd _build
node tests/test-ui.js                # every calculator renders with defaults, search, themes, language, URL state
node tests/test-audit.js             # overflow at 5 widths x 3 themes x 3 languages, contrast, keyboard, fonts, offline
node tests/test-interact.js          # comma input, errors, rows editor, no code execution, routing, copy link
node tests/fuzz.js                   # 17,850 random and extreme inputs: no crashes, no hangs, no NaN shown
node tests/dump.js > tests/dump.json && python3 tests/ref.py   # 414 checks against independent Python implementations
```

## Accuracy and limits

- Results are checked against independent implementations (Python standard library, numpy, dateutil, ipaddress) for about 100 representative cases. They are still estimates for planning, not professional advice.
- Indian income tax slabs live in the `G.TAX` object in `c-fin.js`, labelled with the financial year. Rates change. Check them against the Income Tax Department before relying on the result, and update `G.TAX` each Budget.
- Health calculators are general information only.
- Currency conversion uses a rate you type in, so the site never needs the network.
- Calculator names and field labels are in English. Only the interface (menus, buttons, messages) is translated, and those translations are first drafts that need review by native speakers.

## Licence

Add the licence you prefer. The code has no third-party runtime dependencies. Fonts (Poppins, JetBrains Mono, Noto Sans) are under the SIL Open Font License.
