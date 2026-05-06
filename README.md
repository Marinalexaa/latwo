# Latwo — AI Consulting Agency Website

A pixel-perfect static website clone of [latwo.eu](https://latwo.eu) — an AI consulting agency of the new generation.

## 🚀 Features

- **Bilingual** — Ukrainian 🇺🇦 and English 🇬🇧 (toggle in header)
- **Fixed header** with transparent scroll effect
- **13 sections** on the main page + 4 sub-pages
- **Animated reviews wall** (3 rows scrolling left/right/left)
- **FAQ accordion** with smooth open/close
- **Contact form** with mailto fallback to `latwo.eu@gmail.com`
- **Scroll reveal animations** on cards and sections
- **Fully responsive** (mobile, tablet, desktop)
- **GitHub Pages ready** — pure HTML/CSS/JS, no build step required

## 📁 Project Structure

```
latwo/
├── index.html              # Main page (all 13 sections)
├── css/
│   └── main.css            # All styles, animations, responsive
├── js/
│   ├── i18n.js             # Ukrainian & English translations
│   └── main.js             # Interactions, FAQ, form, animations
├── images/                 # Add your images here (see below)
├── pages/
│   ├── cases.html          # Cases sub-page
│   ├── about.html          # About sub-page
│   ├── privacy.html        # Privacy Policy
│   └── cookies.html        # Cookie Policy
└── README.md
```

## 🖼️ Images to Add

Place the following images in the `/images/` folder:

| File | Description |
|------|-------------|
| `spas-speaking.jpg` | Hero section — speaker at AI event |
| `stanislav-portrait.jpg` | Why Latwo section — founder portrait |
| `case-car-dealer.jpg` | Case 1 — car dealer transformation |
| `case-car-night.jpg` | Case 2 — AI agent implementation |
| `faq-consultant.jpg` | FAQ section — consultant photo |

> **Note:** All images have graceful fallback placeholders if files are missing.

## 🌐 Deploy to GitHub Pages

1. Create a new GitHub repository
2. Upload all project files (or push via git)
3. Go to **Settings → Pages**
4. Set source to **Deploy from a branch** → `main` → `/ (root)`
5. Your site will be live at `https://yourusername.github.io/repo-name/`

### Via Git (recommended):

```bash
git init
git add .
git commit -m "Initial commit — Latwo website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## ✉️ Contact Form Setup

The contact form currently uses a **mailto fallback** that opens the user's email client with pre-filled data to `latwo.eu@gmail.com`.

### For real email sending, integrate EmailJS:

1. Sign up at [emailjs.com](https://www.emailjs.com/)
2. Create a service and email template
3. Add to `index.html` before `</body>`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
   <script>emailjs.init("YOUR_PUBLIC_KEY");</script>
   ```
4. In `js/main.js`, replace `'YOUR_SERVICE_ID'` and `'YOUR_TEMPLATE_ID'` with your actual IDs

## 🎨 Design Tokens

| Token | Value |
|-------|-------|
| Brand Orange | `#E35C36` |
| Blue Light | `#122E47` |
| Blue Dark | `#071624` |
| Black Primary | `#292929` |
| Black Secondary | `#6E6E6E` |
| Background | `#F0F1F2` |
| Heading Font | Moderustic |
| Body Font | Wix Madefor Text |
| Script Font | Kaushan Script |

## 🔧 Customization

- **Translations**: Edit `js/i18n.js` — all text is in `uk` and `en` objects
- **Colors**: Edit CSS variables in `:root` block in `css/main.css`
- **Content**: All sections use `data-i18n` attributes for easy text updates
- **New sections**: Follow the existing pattern with `data-i18n` keys

## 📄 License

© 2026 Latwo. All rights reserved.
