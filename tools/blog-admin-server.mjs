import http from 'node:http';
import { URL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PAGES_DIR = path.join(ROOT, 'pages');
const BLOG_INDEX_FILE = path.join(PAGES_DIR, 'blog.html');
const HOST = '127.0.0.1';
const PORT = 4111;

const json = (res, code, payload) => {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
};

const decode = (v) => (v || '')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&amp;', '&')
  .trim();

const escapeHtml = (v) => (v || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const stripTags = (v) => decode((v || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

const translitMap = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh', з: 'z', и: 'y', і: 'i',
  ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya'
};

const slugify = (value) => {
  const txt = (value || '').toLowerCase().split('').map((ch) => translitMap[ch] ?? ch).join('');
  return txt.replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-') || 'blog-article';
};

const getMatch = (src, pattern, idx = 1) => {
  const m = src.match(pattern);
  return m ? m[idx] : '';
};

const parseCardsFromBlog = (blogHtml) => {
  const block = getMatch(blogHtml, /<!-- BLOG_GRID_START -->([\s\S]*?)<!-- BLOG_GRID_END -->/i);
  if (!block) return [];
  const articles = block.match(/<article class="blog-post[\s\S]*?<\/article>/g) || [];

  return articles.map((article) => {
    const href = getMatch(article, /class="blog-post-media"\s+href="([^"]+)"/i);
    const slug = href.replace(/\.html$/i, '');
    return {
      slug,
      href,
      image: getMatch(article, /<img[^>]+src="([^"]+)"/i),
      alt: decode(getMatch(article, /<img[^>]+alt="([^"]*)"/i)),
      title: stripTags(getMatch(article, /<h2 class="blog-post-title">([\s\S]*?)<\/h2>/i)),
      excerpt: stripTags(getMatch(article, /<p class="blog-post-excerpt">([\s\S]*?)<\/p>/i)),
      tag: stripTags(getMatch(article, /<div class="blog-post-meta">[\s\S]*?<span>([^<]+)<\/span>/i)),
      time: stripTags(getMatch(article, /<div class="blog-post-meta">[\s\S]*?<span class="dot"><\/span>[\s\S]*?<span>([^<]+)<\/span>/i))
    };
  });
};

const renderCard = (post) => {
  const title = escapeHtml(post.title || 'Нова стаття');
  const excerpt = escapeHtml(post.excerpt || 'Опис статті.');
  const tag = escapeHtml(post.tag || 'AI ДЛЯ БІЗНЕСУ');
  const time = escapeHtml(post.time || '8 ХВ');
  const href = `${post.slug}.html`;
  const image = post.image?.startsWith('../images/') ? post.image : `../images/${post.image || 'stanislav-portrait.jpg'}`;
  const alt = escapeHtml(post.alt || title);

  return `      <article class="blog-post scroll-reveal">\n        <a class="blog-post-media" href="${href}">\n          <img src="${image}" alt="${alt}" />\n        </a>\n        <div class="blog-post-body">\n          <h2 class="blog-post-title"><a href="${href}">${title}</a></h2>\n          <p class="blog-post-excerpt">${excerpt}</p>\n          <div class="blog-post-meta">\n            <span>${tag}</span>\n            <span class="dot"></span>\n            <span>${time}</span>\n          </div>\n        </div>\n      </article>`;
};

const renderRelatedCards = (currentSlug, cards) => {
  const related = (cards || [])
    .filter((item) => item?.slug && item.slug !== currentSlug && item.slug !== 'test')
    .slice(0, 2);

  if (!related.length) return '';

  const items = related.map((item) => {
    const href = `${escapeHtml(item.slug)}.html`;
    const image = item.image?.startsWith('../images/') ? item.image : `../images/${item.image || 'stanislav-portrait.jpg'}`;
    const alt = escapeHtml(item.alt || item.title || 'Пов’язана стаття');
    const title = escapeHtml(item.title || 'Пов’язана стаття');
    const excerpt = escapeHtml(item.excerpt || 'Детальніше у блозі Latwo.');
    const tag = escapeHtml(item.tag || 'AI ДЛЯ БІЗНЕСУ');
    const time = escapeHtml(item.time || '8 ХВ');
    return `        <article class="blog-article-related-card">\n          <a class="blog-article-related-media" href="${href}">\n            <img src="${image}" alt="${alt}" />\n          </a>\n          <div class="blog-article-related-body">\n            <h2 class="blog-article-related-title"><a href="${href}">${title}</a></h2>\n            <p class="blog-article-related-excerpt">${excerpt}</p>\n            <div class="blog-article-related-meta"><span>${tag}</span><span class="dot"></span><span>${time}</span></div>\n          </div>\n        </article>`;
  }).join('\n\n');

  return `\n    <section class="blog-article-related scroll-reveal" aria-label="Related articles">\n      <div class="blog-article-related-grid">\n${items}\n      </div>\n    </section>`;
};

const replaceBlogCards = async (cards) => {
  const blogHtml = await fs.readFile(BLOG_INDEX_FILE, 'utf8');
  const rendered = cards.map(renderCard).join('\n\n');
  const next = blogHtml.replace(/<!-- BLOG_GRID_START -->[\s\S]*?<!-- BLOG_GRID_END -->/i, `<!-- BLOG_GRID_START -->\n${rendered}\n      <!-- BLOG_GRID_END -->`);
  await fs.writeFile(BLOG_INDEX_FILE, next, 'utf8');
};

const parsePostPage = async (slug) => {
  const filePath = path.join(PAGES_DIR, `${slug}.html`);
  const html = await fs.readFile(filePath, 'utf8');

  const contentFull = getMatch(html, /<article class="blog-article-content[^>]*>([\s\S]*?)<\/article>/i);
  const ctaBlock = getMatch(contentFull, /<div class="blog-article-cta">([\s\S]*?)<\/div>\s*<div class="blog-article-cta-action">([\s\S]*?)<\/div>/i, 0);
  const contentHtml = ctaBlock ? contentFull.replace(ctaBlock, '').trim() : contentFull.trim();

  const ctaParagraphs = [...ctaBlock.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((m) => stripTags(m[1]));
  const ctaText = ctaParagraphs[0] || '';
  const rawAuthorStrong = stripTags(getMatch(ctaBlock, /<strong>([\s\S]*?)<\/strong>/i));
  const authorLine = (ctaParagraphs[1] || '').replace(/\.$/, '').trim();

  let authorNameParsed = rawAuthorStrong;
  let authorRoleParsed = '';

  if (authorNameParsed && /\s+[—-]\s+/.test(authorNameParsed)) {
    const parts = authorNameParsed.split(/\s+[—-]\s+/);
    authorNameParsed = parts[0].trim();
    if (!authorRoleParsed) authorRoleParsed = parts.slice(1).join(' — ').trim();
  }

  if (!authorNameParsed && authorLine) {
    const parts = authorLine.split(/\s+[—-]\s+/);
    authorNameParsed = parts[0]?.trim() || '';
    authorRoleParsed = parts.slice(1).join(' — ').trim();
  }

  if (authorLine) {
    const roleFromLine = authorLine
      .replace(authorNameParsed, '')
      .replace(/^\s*[—-]\s*/, '')
      .trim();
    authorRoleParsed = roleFromLine || authorRoleParsed;
  }

  const headBlock = getMatch(html, /<header class="blog-article-head[^"]*"[^>]*>([\s\S]*?)<\/header>/i)
    || getMatch(html, /<div class="blog-article-head[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const titleParsed = stripTags(getMatch(headBlock, /<h1[^>]*>([\s\S]*?)<\/h1>/i));
  const subtitleParsed = stripTags(getMatch(headBlock, /<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/i));

  const spans = [...(getMatch(html, /<div class="blog-article-meta">([\s\S]*?)<\/div>/i).matchAll(/<span(?: class="dot")?>([^<]*)<\/span>/g))]
    .map((m) => stripTags(m[1]))
    .filter((v) => v && v !== '.');

  return {
    slug,
    seoTitle: decode(getMatch(html, /<title>([\s\S]*?)<\/title>/i)),
    seoDescription: decode(getMatch(html, /<meta name="description" content="([^"]*)"\s*\/>/i)),
    publishDate: getMatch(html, /"datePublished"\s*:\s*"([^"]+)"/i).slice(0, 10),
    readTime: spans[1] || '8 ХВ',
    coverImage: path.basename(getMatch(html, /<div class="blog-article-media[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i)),
    articleTitle: titleParsed,
    articleSubtitle: subtitleParsed,
    category: spans[0] || 'AI ДЛЯ БІЗНЕСУ',
    authorName: authorNameParsed || 'Станіслав Бучацький',
    authorRole: authorRoleParsed || 'засновник Latwo',
    ctaText,
    ctaBtnText: stripTags(getMatch(ctaBlock, /<span class="btn-text default">([\s\S]*?)<\/span>/i)) || 'Забронювати безкоштовну консультацію',
    ctaBtnUrl: getMatch(ctaBlock, /<a[^>]+href="([^"]+)"/i) || '../index.html#contact',
    contentHtml
  };
};

const renderPostHtml = (post, cards = []) => {
  const slug = slugify(post.slug || post.articleTitle);
  const title = escapeHtml(post.seoTitle || post.articleTitle);
  const description = escapeHtml(post.seoDescription || post.articleSubtitle || '');
  const articleTitle = escapeHtml(post.articleTitle || 'Нова стаття');
  const articleSubtitle = escapeHtml(post.articleSubtitle || 'Підзаголовок статті');
  const publishDate = (post.publishDate || new Date().toISOString().slice(0, 10)).slice(0, 10);
  const readTime = escapeHtml(post.readTime || '8 ХВ');
  const coverImage = escapeHtml(post.coverImage || 'stanislav-portrait.jpg');
  const category = escapeHtml(post.category || 'AI ДЛЯ БІЗНЕСУ');
  const authorName = escapeHtml(post.authorName || 'Станіслав Бучацький');
  const authorRole = escapeHtml(post.authorRole || 'засновник Latwo');
  const ctaText = escapeHtml(typeof post.ctaText === 'string' ? post.ctaText : '');
  const ctaBtnText = escapeHtml(post.ctaBtnText || 'Забронювати безкоштовну консультацію');
  const ctaBtnUrl = escapeHtml(post.ctaBtnUrl || '../index.html#contact');
  const contentHtml = (post.contentHtml || '<p>Додайте текст статті.</p>').trim();
  const relatedSection = renderRelatedCards(slug, cards);

  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="https://latwo.eu/pages/${slug}.html" />

  <meta property="og:type" content="article" />
  <meta property="og:locale" content="uk_UA" />
  <meta property="og:site_name" content="Latwo AI Consulting" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="https://latwo.eu/pages/${slug}.html" />
  <meta property="og:image" content="https://latwo.eu/images/${coverImage}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="https://latwo.eu/images/${coverImage}" />

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${articleTitle}",
    "description": "${description}",
    "inLanguage": "uk-UA",
    "mainEntityOfPage": {"@type": "WebPage", "@id": "https://latwo.eu/pages/${slug}.html"},
    "datePublished": "${publishDate}",
    "dateModified": "${publishDate}",
    "author": {"@type": "Person", "name": "${authorName}", "url": "https://latwo.eu/pages/about.html"},
    "publisher": {"@type": "Organization", "name": "Latwo AI Consulting", "logo": {"@type": "ImageObject", "url": "https://latwo.eu/images/logo1.png"}},
    "image": ["https://latwo.eu/images/${coverImage}"]
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "Latwo", "item": "https://latwo.eu/"},
      {"@type": "ListItem", "position": 2, "name": "Блог", "item": "https://latwo.eu/pages/blog.html"},
      {"@type": "ListItem", "position": 3, "name": "${articleTitle}", "item": "https://latwo.eu/pages/${slug}.html"}
    ]
  }
  </script>

  <link rel="stylesheet" href="../css/main.css?v=20260515c" />
  <style>
    :root { --blog-article-top-gap: 5rem; }
    .blog-article-page { background: var(--bg-page); padding: var(--blog-article-top-gap) 0 4.6rem; }
    .blog-article-shell { width: 100%; max-width: 1280px; margin: 0 auto; padding: 0 2rem; }
    .blog-back-link { display: inline-flex; align-items: center; gap: 0.6rem; color: var(--brand-orange); font-family: var(--font-subheading); font-size: 16px; line-height: 1.4; letter-spacing: -0.02em; font-weight: 500; text-decoration: none; margin-bottom: 2.2rem; opacity: 0.85; transition: opacity var(--transition); }
    .blog-back-link:hover, .blog-back-link:focus-visible { opacity: 1; }
    .blog-back-link svg { width: 16px; height: 16px; min-width: 16px; flex: 0 0 16px; flex-shrink: 0; display: inline-block; visibility: visible; opacity: 1; stroke: currentColor; }
    .blog-back-link .back-label-wrap { display: inline-grid; align-items: center; justify-items: start; min-height: 1.4em; min-width: 5ch; width: max-content; overflow: hidden; line-height: 1.4; }
    .blog-back-link  .back-label { grid-area: 1 / 1; display: block; width: max-content; white-space: nowrap; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.28s ease; }
    .blog-back-link  .back-label.default { transform: translateY(0); opacity: 1; }
    .blog-back-link  .back-label.hover { transform: translateY(135%); opacity: 0; }
    .blog-back-link:hover  .back-label.default, .blog-back-link:focus-visible  .back-label.default { transform: translateY(-135%); opacity: 0; }
    .blog-back-link:hover  .back-label.hover, .blog-back-link:focus-visible  .back-label.hover { transform: translateY(0); opacity: 1; }
    .blog-article-head { text-align: center; margin-bottom: 2.6rem; }
    .blog-article-meta { display: inline-flex; align-items:center; gap:.75rem; font-size:12px; text-transform:uppercase; color: var(--brand-orange); font-weight:600; margin-bottom: 1.2rem; }
    .blog-article-meta .dot { width:4px; height:4px; border-radius:50%; background: var(--brand-orange); }
    .blog-article-head h1 { font-family: var(--font-heading); font-size: 80px; font-weight: 400; line-height: 1.1; letter-spacing: -0.04em; color: var(--black-primary); max-width: 980px; margin: 0 auto 1rem; }
    .blog-article-head p { font-size: 20px; line-height: 1.4; letter-spacing: -0.02em; color: var(--black-secondary); max-width: 760px; margin: 0 auto; }
    .blog-article-media { border: 4px solid rgba(255, 255, 255, 0.88); border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(6, 16, 28, 0.15); margin-bottom: 2.6rem; background: #d9dde2; }
    .blog-article-media img { width: 100%; display: block; aspect-ratio: 16 / 9; object-fit: cover; }
    .blog-article-content { max-width: 920px; margin: 0 auto; }
    .blog-article-content h2, .blog-article-content h3, .blog-article-content h4 { font-family: var(--font-heading); line-height: 1.2; letter-spacing: -0.03em; font-weight: 400; color: var(--black-primary); margin: 2rem 0 1rem; }
    .blog-article-content h2 { font-size: 40px; }
    .blog-article-content h3 { font-size: 30px; }
    .blog-article-content h4 { font-size: 24px; }
    .blog-article-content h3.faq-question-title { font-size: 24px; }
    .blog-article-content p { font-size: 16px; line-height: 1.6; letter-spacing: -0.02em; color: var(--black-secondary); margin: 0 0 1rem; }
    .blog-article-content a:not(.btn), .blog-article-content a:not(.btn) * { color: var(--brand-orange) !important; text-decoration: underline !important; text-underline-offset: 2px; text-decoration-thickness: 1.5px; }
    .blog-article-content .btn, .blog-article-content .btn * { text-decoration: none !important; }
    .blog-article-content ul, .blog-article-content ol { margin: 0 0 1rem 1.4rem; color: var(--black-secondary); }
    .blog-article-content li { font-size: 16px; line-height: 1.6; letter-spacing: -0.02em; margin-bottom: 0.2rem; }
    .blog-article-cta { margin-top: 1.6rem; padding: 1.2rem 1.4rem; border: 1px solid rgba(41,41,41,.15); border-radius: 14px; background: rgba(255,255,255,.45); }
    .blog-article-cta p { font-style: italic; }
    .blog-article-cta-action { margin-top: 1rem; display: flex; justify-content: center; }
    .blog-article-related { margin-top: 3.4rem; padding-top: 2.1rem; border-top: 1px solid rgba(41,41,41,.15); }
    .blog-article-related-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.6rem; }
    .blog-article-related-card { display: flex; flex-direction: column; gap: 0.75rem; }
    .blog-article-related-media { border: 4px solid rgba(255, 255, 255, 0.88); border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(6,16,28,.15); background: #d9dde2; aspect-ratio: 16 / 10; }
    .blog-article-related-media img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .7s ease; }
    .blog-article-related-media:hover img { transform: scale(1.06); }
    .blog-article-related-body { border: 4px solid rgba(255,255,255,.55); border-radius: 16px; background: rgba(255,255,255,.24); box-shadow: 0 12px 28px rgba(6,16,28,.1); padding: 1.7rem 1.8rem; min-height: 238px; display: flex; flex-direction: column; }
    .blog-article-related-title { font-family: var(--font-heading); font-size: 24px; font-weight: 400; line-height: 1.2; letter-spacing: -0.04em; color: var(--black-primary); margin-bottom: .8rem; }
    .blog-article-related-title a { color: inherit; text-decoration: none; }
    .blog-article-related-title a:hover { color: var(--brand-orange); }
    .blog-article-related-excerpt { font-size: 16px; line-height: 1.6; letter-spacing: -0.02em; color: var(--black-secondary); margin-bottom: 1.4rem; }
    .blog-article-related-meta { margin-top: auto; display: flex; align-items: center; gap: .7rem; font-size: 12px; text-transform: uppercase; letter-spacing: -0.02em; color: var(--brand-orange); font-weight: 600; }
    .blog-article-related-meta .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--brand-orange); opacity: .75; }
    @media (max-width: 1024px) {
      :root { --blog-article-top-gap: 6.4rem; }
      .blog-article-head h1 { font-size: 64px; }
    }
    @media (max-width: 768px) {
      :root { --blog-article-top-gap: 3.4rem; }
      .blog-article-shell { padding: 0 var(--mobile-gutter, 14px); }
      .blog-back-link { font-size: 16px; margin-bottom: 1.5rem; }
      .blog-article-head { margin-bottom: 1.6rem; }
      .blog-article-head h1 { font-size: 56px; margin-bottom: 0.75rem; }
      .blog-article-head p { font-size: 20px; }
      .blog-article-meta { flex-wrap: wrap; justify-content: center; }
      .blog-article-media { margin-bottom: 1.8rem; }
      .blog-article-content h2 { font-size: 36px; }
      .blog-article-content h3 { font-size: 30px; }
      .blog-article-content h4 { font-size: 24px; }
      .blog-article-cta { padding: 1rem 1rem 1.1rem; }
      .blog-article-cta-action .btn { width: min(100%, 520px); }
      .blog-article-related { margin-top: 2.6rem; padding-top: 1.7rem; }
      .blog-article-related-grid { grid-template-columns: 1fr; gap: 1.25rem; }
      .blog-article-related-body { padding: 1.25rem; min-height: auto; }
    }
    @media (max-width: 540px) {
      .blog-article-head h1 { font-size: 44px; }
      .blog-article-head p { font-size: 18px; }
      .blog-article-content h2 { font-size: 32px; }
      .blog-article-content h3 { font-size: 26px; }
      .blog-article-content h4 { font-size: 22px; }
      .blog-article-content p,
      .blog-article-content li { font-size: 15.5px; }
      .blog-article-cta-action .btn { width: 100%; }
    }
    @media (max-width: 420px) {
      :root { --blog-article-top-gap: 3.2rem; }
      .blog-back-link { font-size: 15px; }
      .blog-article-head h1 { font-size: 36px; }
      .blog-article-head p { font-size: 17px; }
      .blog-article-content h2 { font-size: 28px; }
      .blog-article-content h3 { font-size: 24px; }
      .blog-article-content h4 { font-size: 20px; }
      .blog-article-cta-action .btn { font-size: 18px; padding: 0.95rem 1.15rem; }
    }
  </style>
</head>
<body>
<header id="site-header">
  <div class="header-inner">
    <a href="../index.html" class="header-logo">Latwo</a>
    <nav class="header-nav">
      <a href="cases.html" data-i18n="nav_cases">Кейси</a>
      <a href="../index.html#services" data-i18n="nav_services">Послуги</a>
      <a href="about.html" data-i18n="nav_about">Про нас</a>
      <a href="../index.html#pricing" data-i18n="nav_pricing">Ціни</a>
      <a href="../index.html#faq" data-i18n="nav_faq">FAQs</a>
    </nav>
    <div class="header-right">
      <a href="blog.html" class="active" data-i18n="nav_blog">Блог</a>
      <a href="../index.html#contact" data-i18n="nav_contact">Контакти</a>
      <a href="https://www.instagram.com/latwo.aiconsulting?igsh=OTBqMGtrdnpoMXRp" target="_blank" rel="noopener">Instagram</a>
      <a href="https://www.linkedin.com/company/latwo-ai-consulting/" target="_blank" rel="noopener">LinkedIn</a>
      <div class="lang-switcher" id="lang-switcher">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span id="current-lang">Ukrainian</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        <div class="lang-dropdown" id="lang-dropdown">
          <button class="lang-option" data-lang="uk">🇺🇦 Українська</button>
          <button class="lang-option" data-lang="en">🇬🇧 English</button>
        </div>
      </div>
    </div>
    <div class="hamburger" id="hamburger"><span></span><span></span><span></span></div>
  </div>
</header>

<nav class="mobile-nav" id="mobile-nav">
  <a href="cases.html" data-i18n="nav_cases">Кейси</a>
  <a href="../index.html#services" class="mobile-nav-close" data-i18n="nav_services">Послуги</a>
  <a href="about.html" data-i18n="nav_about">Про нас</a>
  <a href="../index.html#pricing" class="mobile-nav-close" data-i18n="nav_pricing">Ціни</a>
  <a href="../index.html#faq" class="mobile-nav-close" data-i18n="nav_faq">FAQs</a>
  <a href="blog.html" class="mobile-nav-close" data-i18n="nav_blog">Блог</a>
  <a href="../index.html#contact" class="mobile-nav-close" data-i18n="nav_contact">Контакти</a>
  <a href="https://www.instagram.com/latwo.aiconsulting?igsh=OTBqMGtrdnpoMXRp" target="_blank" data-i18n="nav_instagram">Instagram</a>
  <a href="https://www.linkedin.com/company/latwo-ai-consulting/" target="_blank" data-i18n="nav_linkedin">LinkedIn</a>
  <div class="mobile-nav-lang lang-switcher">
    <button class="mobile-lang-trigger" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      <span class="current-lang-label">Ukrainian</span>
      <svg class="mobile-lang-caret" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="lang-dropdown mobile-lang-dropdown">
      <button class="mobile-lang-option lang-option" type="button" data-lang="uk">🇺🇦 Українська</button>
      <button class="mobile-lang-option lang-option" type="button" data-lang="en">🇬🇧 English</button>
    </div>
  </div>
</nav>

<section class="blog-article-page" data-header-theme="light">
  <div class="blog-article-shell">
    <a href="blog.html" class="blog-back-link" aria-label="Go back to blog">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      <span class="back-label-wrap"><span class="back-label default">Назад</span><span class="back-label hover">Назад</span></span>
    </a>
    <header class="blog-article-head scroll-reveal">
      <div class="blog-article-meta"><span>${category}</span><span class="dot"></span><span>${readTime}</span></div>
      <h1>${articleTitle}</h1>
      <p>${articleSubtitle}</p>
    </header>

    <div class="blog-article-media scroll-reveal">
      <img src="../images/${coverImage}" alt="${articleTitle}" />
    </div>

    <article class="blog-article-content">
${contentHtml}

      <div class="blog-article-cta">
        <p>${ctaText}</p>
        <p><strong>${authorName}</strong> — ${authorRole}.</p>
      </div>
      <div class="blog-article-cta-action">
        <a href="${ctaBtnUrl}" class="btn btn-orange">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16z"/></svg>
          <span class="btn-text-stack"><span class="btn-text default">${ctaBtnText}</span><span class="btn-text hover">${ctaBtnText}</span></span>
        </a>
      </div>
    </article>
${relatedSection}
  </div>
</section>

<footer id="footer" data-header-theme="dark">
  <div class="footer-top">
    <div class="footer-brand">
      <h2><a href="../index.html" style="color:inherit;text-decoration:none;">Latwo</a></h2>
      <p data-i18n="footer_desc">AI-консалтингова агенція нового покоління. Перетворіть хаос на систему та почніть зростати вже сьогодні.</p>
    </div>

    <div class="footer-nav-columns">
      <div class="footer-nav-col">
        <h4 data-i18n="footer_nav_title">НАВІГАЦІЯ</h4>
        <ul>
          <li><a href="cases.html" data-i18n="footer_cases">Кейси</a></li>
          <li><a href="../index.html#services" data-i18n="footer_services">Послуги</a></li>
          <li><a href="about.html" data-i18n="footer_about">Про нас</a></li>
          <li><a href="../index.html#pricing" data-i18n="footer_pricing">Ціни</a></li>
        </ul>
      </div>
      <div class="footer-nav-col">
        <h4 data-i18n="footer_contact_title">ЗВ'ЯЗОК</h4>
        <ul>
          <li><a href="../index.html#contact" data-i18n="footer_contact_link">Контакти</a></li>
          <li><a href="https://www.instagram.com/latwo.aiconsulting?igsh=OTBqMGtrdnpoMXRp" target="_blank" rel="noopener" data-i18n="footer_instagram">Instagram</a></li>
          <li><a href="https://www.linkedin.com/company/latwo-ai-consulting/" target="_blank" rel="noopener" data-i18n="footer_linkedin">LinkedIn</a></li>
          <li><a href="blog.html" data-i18n="footer_blog">Блог</a></li>
        </ul>
      </div>
      <div class="footer-nav-col">
        <h4 data-i18n="footer_legal_title">LEGAL</h4>
        <ul>
          <li><a href="../index.html#faq" data-i18n="footer_faq">FAQs</a></li>
          <li><a href="privacy.html" data-i18n="footer_privacy">Політика конфіденційності</a></li>
          <li><a href="cookies.html" data-i18n="footer_cookies">Політика cookies</a></li>
        </ul>
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    <span data-i18n="footer_copy">© 2026 Latwo. All rights reserved.</span>
    <span><span data-i18n="footer_created">Created by</span> <a href="https://latwo.eu" style="text-decoration:underline;">Latwo</a></span>
  </div>
</footer>

<script src="../js/i18n.js?v=20260512a"></script>
<script src="../js/main.js?v=20260512a"></script>
</body>
</html>`;
};

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
};

const server = http.createServer(async (req, res) => {
  if (!req.url) return json(res, 400, { ok: false, error: 'bad-url' });
  const url = new URL(req.url, `http://${HOST}:${PORT}`);

  if (req.method === 'OPTIONS') {
    return json(res, 200, { ok: true });
  }

  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return json(res, 200, { ok: true, root: ROOT });
    }

    if (req.method === 'GET' && url.pathname === '/api/posts') {
      const blogHtml = await fs.readFile(BLOG_INDEX_FILE, 'utf8');
      const cards = parseCardsFromBlog(blogHtml);
      return json(res, 200, { ok: true, posts: cards });
    }

    if (req.method === 'GET' && url.pathname === '/api/post') {
      const slug = slugify(url.searchParams.get('slug') || '');
      if (!slug) return json(res, 400, { ok: false, error: 'missing-slug' });
      const post = await parsePostPage(slug);
      return json(res, 200, { ok: true, post });
    }

    if (req.method === 'POST' && url.pathname === '/api/post') {
      const payload = await readJsonBody(req);
      const slug = slugify(payload.slug || payload.articleTitle || payload.seoTitle);
      if (!slug) return json(res, 400, { ok: false, error: 'bad-slug' });

      const blogHtml = await fs.readFile(BLOG_INDEX_FILE, 'utf8');
      const cards = parseCardsFromBlog(blogHtml);
      const html = renderPostHtml({ ...payload, slug }, cards);
      await fs.writeFile(path.join(PAGES_DIR, `${slug}.html`), html, 'utf8');
      const card = {
        slug,
        title: payload.seoTitle || payload.articleTitle || 'Нова стаття',
        excerpt: payload.seoDescription || payload.articleSubtitle || 'Опис статті.',
        tag: payload.category || 'AI ДЛЯ БІЗНЕСУ',
        time: payload.readTime || '8 ХВ',
        image: payload.coverImage || 'stanislav-portrait.jpg',
        alt: payload.articleTitle || payload.seoTitle || 'Нова стаття'
      };

      const idx = cards.findIndex((c) => c.slug === slug);
      if (idx >= 0) {
        cards[idx] = { ...cards[idx], ...card };
      } else {
        cards.unshift(card);
      }

      await replaceBlogCards(cards);
      return json(res, 200, { ok: true, slug, file: `${slug}.html` });
    }

    if (req.method === 'DELETE' && url.pathname === '/api/post') {
      const slug = slugify(url.searchParams.get('slug') || '');
      if (!slug) return json(res, 400, { ok: false, error: 'missing-slug' });

      const filePath = path.join(PAGES_DIR, `${slug}.html`);
      let fileDeleted = false;
      try {
        await fs.unlink(filePath);
        fileDeleted = true;
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }

      const blogHtml = await fs.readFile(BLOG_INDEX_FILE, 'utf8');
      const cards = parseCardsFromBlog(blogHtml);
      const nextCards = cards.filter((item) => item.slug !== slug);
      const removedFromList = nextCards.length !== cards.length;
      if (removedFromList) {
        await replaceBlogCards(nextCards);
      }

      return json(res, 200, {
        ok: true,
        slug,
        fileDeleted,
        removedFromList
      });
    }

    json(res, 404, { ok: false, error: 'not-found' });
  } catch (error) {
    json(res, 500, { ok: false, error: error.message || 'server-error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Blog admin API listening on http://${HOST}:${PORT}`);
});
