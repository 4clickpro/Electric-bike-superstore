// Sitemap generation for SEO — with image sitemap extensions
import productsData from '@data/products.json';

export async function GET() {
  const siteUrl = 'https://theelectricbikesuperstore.com';

  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: '/blog', priority: '0.9', changefreq: 'daily' },
    { path: '/products', priority: '0.8', changefreq: 'weekly' },
    { path: '/about', priority: '0.6', changefreq: 'monthly' },
    { path: '/contact', priority: '0.5', changefreq: 'monthly' },
    { path: '/faq', priority: '0.6', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { path: '/shipping', priority: '0.5', changefreq: 'monthly' },
    { path: '/returns', priority: '0.5', changefreq: 'monthly' },
  ];

  // Blog posts with REAL dates (not fake future dates)
  const blogPosts = [
    { slug: 'how-to-choose-your-first-electric-bike', date: '2025-04-15', image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&q=80' },
    { slug: 'ebike-commuting-save-time-money', date: '2025-03-22', image: 'https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=1200&q=80' },
    { slug: 'ebike-maintenance-checklist', date: '2025-02-10', image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=1200&q=80' },
  ];

  // Product pages
  const productPages = (productsData as Array<{ slug: string; image?: string }>).map(p => ({
    slug: p.slug,
    image: p.image || null,
  }));

  // Build URLs for static pages
  const urls = staticPages.map(page => ({
    url: `${siteUrl}${page.path}`,
    lastmod: today,
    changefreq: page.changefreq,
    priority: page.priority,
    image: null as string | null,
  }));

  // Add blog post URLs with images
  for (const post of blogPosts) {
    urls.push({
      url: `${siteUrl}/blog/${post.slug}`,
      lastmod: post.date,
      changefreq: 'monthly',
      priority: '0.9',
      image: post.image,
    });
  }

  // Add product pages with images
  for (const prod of productPages) {
    urls.push({
      url: `${siteUrl}/products/${prod.slug}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.8',
      image: prod.image,
    });
  }

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
    <priority>${u.priority}</priority>${u.image ? `
    <image:image>
      <image:loc>${u.image}</image:loc>
    </image:image>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600',
    },
  });
}
