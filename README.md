# Homeopathic Educational Services — redesigned site (static)

Plain HTML/CSS/JS — no build step.

## Deploy to Vercel
1. Go to vercel.com → Add New → Project → drag this folder in (or `npx vercel --prod` from inside it).
2. Framework preset: **Other**. Build command: *(none)*. Output directory: `./`.
3. Done — `index.html` is the homepage, `404.html` is the not-found page.

## Structure
- `index.html` — homepage (approved design, all links now local)
- `shop.html`, `shop/*.html` — store hub + 60 category pages
- `product/*.html` — 342 product pages (working cart via localStorage)
- `cart.html`, `checkout.html` — demo cart & checkout (no payment taken)
- `articles.html`, `articles/*.html`, `article/*.html`, `blog.html` — article library
- Info: professional-homeopathic-treatment, about, contact, videos, links, health-concerns, faq,
  shipping, privacy-policy, return-policy, wholesale-bulk-orders, accessibility, my-account, search, sitemap
- `assets/style.css` (theme) + `assets/site.css` (inner pages), `assets/script.js` + `assets/site.js`, `assets/data.js` (search index)
