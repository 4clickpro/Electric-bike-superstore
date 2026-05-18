// Sitemap generation for SEO
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

  const productPages = [
    'celestial-diffuser',
    'handwoven-throw-blanket',
    'mindfulness-journal',
    'ceramic-tea-set',
    'sustainable-linen-bedding',
    'desk-zen-garden',
    'smart-mood-lamp',
    'organic-skincare-set',
  ];

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
