# iCafeMenu – Theme Redesign Guide

This document explains the technology stack used in iCafeMenu and provides a practical guide for redesigning or creating a custom theme.

---

## 1. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Markup | **HTML5** | Static `.htm` files, loaded dynamically via `fetch()` |
| Styling | **CSS3** + **Bootstrap 4.1.3** | Dark theme base (`core/css/dark.css`), theme-specific overrides in `themes/<name>/css/style.css` |
| Interactivity | **Petite Vue** (lightweight reactive framework) + **Vanilla JS** | Reactive state with `PetiteVue.reactive()` |
| DOM utilities | **jQuery 3** | DOM manipulation, AJAX helpers |
| Icons | **Font Awesome Pro** (fal / far prefixes) | Bundled in `core/css/font-awesome.css` + `core/webfonts/` |
| Date / time | **Moment.js** | Relative time, formatting |
| Currency | **Accounting.js** | Number / currency formatting |
| Notifications | **Toastr** + **SweetAlert** | Toast messages and modal dialogs |
| QR codes | **QRCode.js** | In-app QR generation |
| Real-time | **WebSocket** | Live balance, session, and order updates from `iCafeMenu.exe` |
| Desktop host | **CEF (Chromium Embedded Framework)** | The EXE wraps Chromium to render the HTML frontend |

### Library file locations

```
html/
└── core/
    ├── css/
    │   ├── bootstrap.css       ← Bootstrap 4 framework
    │   ├── dark.css            ← Base dark theme (17 000+ lines)
    │   ├── font-awesome.css    ← Icon set
    │   └── responsive.css      ← Breakpoint helpers
    └── lib/
        ├── jquery.js
        ├── petite-vue.iife.js
        ├── bootstrap.js
        ├── moment.js
        ├── accounting.js
        ├── qrcode.js
        ├── md5.js
        ├── clipboard/
        ├── toastr/
        ├── sweetalert/
        └── contextmenu/
```

---

## 2. Theme Architecture

### Theme folder structure

Each theme lives in `html/themes/<theme-name>/` and follows this layout:

```
themes/
└── icafemenu/          ← Default theme
    ├── main.htm        ← Entry point: loads CSS, JS, and page fragments
    ├── css/
    │   ├── style.css           ← Theme-specific overrides
    │   └── theme-variables.css ← (NEW) Central CSS variable definitions
    ├── js/
    │   └── app.js      ← Theme-specific JS (WebSocket event hooks)
    ├── images/         ← Theme images (logo, banners, etc.)
    └── *.htm           ← Page fragment files (login, home, shop, …)
```

> **Active theme selection** is controlled by `iCafeMenu.exe` via the `theSettings` object injected at runtime. The EXE sets `theSettings.client_themes_name` which determines which `themes/<name>/main.htm` is loaded.

### How CSS is layered

1. **Bootstrap 4** – base reset, grid, utilities
2. **`core/css/dark.css`** – dark-mode component styles (cards, buttons, forms, scrollbars, etc.)
3. **`themes/<name>/css/style.css`** – theme-specific layout overrides
4. **`themes/<name>/css/theme-variables.css`** – your color / spacing customizations (NEW file, see §3)

The server also injects two CSS variables at runtime (via `main.js`):

| Variable | Description |
|----------|-------------|
| `--client_themes_front_color` | Primary accent color (menu highlight, buttons, borders) |
| `--client_themes_back_color` | Primary background/card color |

These are automatically set with 90% (`e6`) and 75% (`c0`) opacity variants:
- `--client_themes_front_color_90`
- `--client_themes_front_color_75`
- `--client_themes_back_color_90`
- `--client_themes_back_color_75`

---

## 3. Recommended Tools for Theme Redesign

### Code editors

| Tool | Why use it |
|------|-----------|
| **Visual Studio Code** | Free; excellent CSS/HTML IntelliSense, Live Preview extension, Color Picker built-in |
| **WebStorm** | Full-featured IDE with Bootstrap-aware completion |
| **Sublime Text / Notepad++** | Lightweight option for quick edits |

### Browser-based design tools

| Tool | Use case | URL |
|------|---------|-----|
| **Chrome / Edge DevTools** | Inspect elements, live-edit CSS, pick colors | F12 in browser |
| **Firefox DevTools** | Grid/flexbox overlay visualizer | F12 in browser |
| **CSS Variables inspector** | View & override `--custom-properties` live | DevTools → Styles panel |

### Color & palette generators

| Tool | URL |
|------|-----|
| **Coolors** | https://coolors.co – generate harmonious palettes |
| **Adobe Color** | https://color.adobe.com – color wheel & contrast checker |
| **Paletton** | https://paletton.com – complementary color schemes |
| **Contrast Ratio** | https://contrast-ratio.com – WCAG accessibility checker |

### CSS frameworks & generators

| Tool | Purpose |
|------|---------|
| **Bootstrap Customize** | https://getbootstrap.com/docs/4.6/getting-started/theming/ – Sass variables for Bootstrap 4 |
| **Bootstrap Theme Creator** | https://bootstrap.build – visual Bootstrap 4 theme editor (outputs custom `bootstrap.css`) |
| **CSS Gradient** | https://cssgradient.io – gradient generator for backgrounds |
| **Neumorphism.io** | https://neumorphism.io – soft UI shadow generator |
| **Glassmorphism CSS** | https://css.glass – glassmorphism effect generator |

### Font tools

| Tool | URL |
|------|-----|
| **Google Fonts** | https://fonts.google.com |
| **Font Squirrel** | https://fontsquirrel.com – self-host web fonts |
| **Fontjoy** | https://fontjoy.com – font pairing generator |

---

## 4. Quickstart: Customizing the Default Theme

### Step 1 – Edit the CSS variables file

Open `html/themes/icafemenu/css/theme-variables.css` and change the values to match your desired color scheme. This file is the single source of truth for all design tokens.

```css
:root {
  /* ── Accent / brand colors ─────────────────────────── */
  --theme-accent:        #9B69E8;   /* purple – change to your brand color */
  --theme-accent-hover:  #7b4ec8;

  /* ── Background shades ──────────────────────────────── */
  --theme-bg-primary:    #0d0d0d;   /* deepest background */
  --theme-bg-card:       #1a1a2e;   /* card/panel background */
  --theme-bg-header:     #16213e;   /* top navigation bar */

  /* ── Text colors ────────────────────────────────────── */
  --theme-text-primary:  #ffffff;
  --theme-text-muted:    #a0a0b0;

  /* ── Border & separator ─────────────────────────────── */
  --theme-border:        rgba(255,255,255,0.12);

  /* ── Radius / spacing ───────────────────────────────── */
  --theme-radius-card:   8px;
  --theme-radius-btn:    6px;
}
```

### Step 2 – Override component styles in style.css

Use CSS variable references so your theme respects the tokens defined above:

```css
/* Example: restyle the header bar */
.header-section .header-area {
  background: var(--theme-bg-header);
  border-bottom: 1px solid var(--theme-border);
}

/* Example: change card background */
.bs-c .card {
  background-color: var(--theme-bg-card);
  border-radius: var(--theme-radius-card);
}

/* Example: change active menu icon color */
.header-menu-active {
  color: var(--theme-accent) !important;
}
```

### Step 3 – Test with Chrome DevTools

1. Open `html/themes/icafemenu/main.htm` in Chrome (`chrome.bat` or directly).
2. Press **F12** → **Elements** tab → find `:root` in Styles panel.
3. Click any CSS variable value to live-edit colors and preview instantly.
4. Copy working values back into `theme-variables.css`.

---

## 5. Creating a Brand-New Theme

1. **Copy** the `html/themes/icafemenu/` folder to `html/themes/<your-theme-name>/`.
2. Update the `<base href>` tag in the new `main.htm`:
   ```html
   <base href="themes/<your-theme-name>/">
   ```
3. Edit `css/theme-variables.css` and `css/style.css` with your design.
4. Add or replace images in the `images/` sub-folder.
5. To activate your theme, configure the theme name in the iCafeMenu server settings panel.

---

## 6. Key CSS Classes Reference

| Class / selector | Purpose |
|-----------------|---------|
| `.theme-body` | Root container (full width/height, overflow hidden) |
| `.header-section .header-area` | Top navigation bar |
| `.header-menu-active` | Active menu icon (uses `--client_themes_front_color`) |
| `.game-item` | Individual game card |
| `.game-image .overlay` | Hover overlay on game/shop images |
| `.home-promoted` | Featured/promoted items grid (3-column) |
| `.shop-image` | Shop product thumbnail |
| `.game-heat` | "Hot" badge on top games (purple `#9B69E8` by default) |
| `#page_lock` | Screen lock overlay |
| `.client-btn-success` | Primary action button |
| `.client-form-row` | Form input row styling |

---

## 7. CSS Variable Quick Reference

| Variable | Set by | Usage |
|----------|--------|-------|
| `--client_themes_front_color` | Server settings | Active icons, borders, highlights |
| `--client_themes_front_color_90` | `main.js` (auto) | 90 % opacity variant |
| `--client_themes_front_color_75` | `main.js` (auto) | 75 % opacity variant |
| `--client_themes_back_color` | Server settings | Card / background fill |
| `--client_themes_back_color_90` | `main.js` (auto) | 90 % opacity variant |
| `--client_themes_back_color_75` | `main.js` (auto) | 75 % opacity variant |

> These runtime variables are set in `html/core/js/main.js` inside the `main()` function via `document.documentElement.style.setProperty(...)`.

---

## 8. Tips

- **Keep `dark.css` untouched.** Override styles in the theme's `style.css` instead. This makes updating the core easier.
- **Use CSS specificity** – prefix your overrides with `.theme-body` to ensure they win over base styles without needing `!important`.
- **Test at multiple resolutions** – the app targets widescreen PC monitors. Check `core/css/responsive.css` for breakpoints (1550px – 3550px).
- **Images** – use `.webp` format for best performance; the CEF browser fully supports it.
- **Font Awesome icons** – this project uses **Font Awesome Pro** with `fal` (light) and `far` (regular) prefix classes. Substitute `fas` (free solid) if you switch to the free version.
