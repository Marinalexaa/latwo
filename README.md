# Latwo — AI Consulting Agency Website

A pixel-perfect static website clone of [latwo.eu](https://latwo.eu) — an AI consulting agency of the new generation.

## 🚀 Features

- **Bilingual** — Ukrainian 🇺🇦 and English 🇬🇧 (toggle in header)
- **Fixed header** with transparent scroll effect
- **13 sections** on the main page + 4 sub-pages
- **Animated reviews wall** (3 rows scrolling left/right/left)
- **FAQ accordion** with smooth open/close
- **Contact form** via backend API (Vercel + Resend)
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

## ✉️ Contact Form Setup (Vercel + Resend)

The contact form sends data to `/api/contact` and then to your inbox via Resend.

### 1) Add environment variables in Vercel

Project → **Settings → Environment Variables**

- `RESEND_API_KEY`
- `CONTACT_FORM_TO_EMAIL` (e.g. `latwo.eu@gmail.com`)
- `CONTACT_FORM_FROM_EMAIL` (e.g. `Latwo Website <noreply@latwo.eu>`)
- `CONTACT_FORM_SUBJECT_PREFIX` (optional, e.g. `Latwo.eu`)
- `CONTACT_FORM_RATE_LIMIT_MAX_REQUESTS` (optional, default `5`)
- `CONTACT_FORM_RATE_LIMIT_WINDOW_MS` (optional, default `900000` = 15 min)

Use `.env.example` as a reference for local development.

### 2) Verify sender domain in Resend

To send from `@latwo.eu`, verify your domain in Resend and add required DNS records.

### 3) Deploy

After setting env variables, redeploy the project in Vercel.

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
