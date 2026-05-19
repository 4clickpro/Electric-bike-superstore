// Sitemap generation for SEO
import productsData from '@data/products.json';

export async function GET() {
  const siteUrl = 'https://theelectricbikesuperstore.com';
  
  const staticPages = [
    '',
    '/blog',
    '/products',
    '/about',
    '/contact',
    '/cart',
  ];

  const blogPosts = [
    'shop-ebike-boys-fat-tire-1200w',
    'shop-ebike-boys-20-fat-tire-full-suspension',
    'shop-ebike-boys-750w-48v-20in',
    'shop-terrosor-715w-folding',
    'shop-ebike-boys-715w-folding',
    'shop-ebike-boys-1200w-peak-20in',
    'shop-ebike-boys-20-fat-tire-all-terrain',
    'shop-ebike-boys-750w-48v-13ah',
    'shop-ebike-boys-1200w-peak-fat-tire',
    'shop-ebike-boys-1200w-lithium-48v',
    'shop-deepower-s7pro',
    'shop-hezzo-1200w',
    'shop-high-quality-52v-750w',
    'shop-aniioki-a9-pro-max',
    'shop-eahora-romeo-ii',
    'shop-rawrr-mantix-x-pro',
    'shop-rawrr-mini',
    'shop-eahora-romeo-ultra',
    'shop-ubco-2x2-special-edition',
    'shop-2x2-adventure-bike',
    'shop-eahora-knight-m1ps',
    'shop-quietkat-apex-hd',
    'shop-quietkat-apex-xd',
    'shop-eahora-romeo-ultra-ii',
    'shop-ubco-hunt-2x2',
    'shop-ubco-2x2-se',
    'shop-ubco-work-bike',
    'shop-ebike-boys-coroma-scooter',
    'shop-coroma-scooter-women',
    'shop-ebike-boys-m6max-scooter',
    'how-to-choose-your-first-electric-bike',
    'ebike-commuting-save-time-money',
    'ebike-maintenance-checklist',
    'transform-your-home-with-biophilic-design',
    'morning-rituals-for-a-mindful-day',
    'the-art-of-curated-minimalism',
    'smart-home-tech-that-actually-improves-your-life',
    'seasonal-tablescaping-for-every-occasion',
    'the-science-of-better-sleep',
    'sustainable-fashion-wardrobe-essentials',
    'digital-detox-reclaiming-your-attention',
    'the-perfect-home-office-setup',
  ];

  const productPages = (productsData as Array<{ slug: string }>).map(p => p.slug);

  const urls = [
    ...staticPages.map(page => ({
      url: `${siteUrl}${page}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? '1.0' : '0.8',
    })),
    ...blogPosts.map(slug => ({
      url: `${siteUrl}/blog/${slug}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.9',
    })),
    ...productPages.map(slug => ({
      url: `${siteUrl}/products/${slug}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8',
    })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url>
    <loc>${u.url}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600',
    },
  });
}
