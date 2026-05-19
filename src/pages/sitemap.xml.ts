// Sitemap generation for SEO — with image sitemap extensions
import productsData from '@data/products.json';
import { getCollection } from 'astro:content';

export async function GET() {
  const siteUrl = 'https://theelectricbikesuperstore.com';

  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { path: '', priority: '1.0', changefreq: 'daily', image: null },
    { path: '/blog', priority: '0.9', changefreq: 'daily', image: null },
    { path: '/products', priority: '0.8', changefreq: 'weekly', image: null },
    { path: '/about', priority: '0.6', changefreq: 'monthly', image: null },
    { path: '/contact', priority: '0.5', changefreq: 'monthly', image: null },
    { path: '/faq', priority: '0.6', changefreq: 'monthly', image: null },
    { path: '/privacy', priority: '0.3', changefreq: 'yearly', image: null },
    { path: '/shipping', priority: '0.5', changefreq: 'monthly', image: null },
    { path: '/returns', priority: '0.5', changefreq: 'monthly', image: null },
  ];

  const blogPosts = [
    { slug: 'shop-ebike-boys-fat-tire-1200w', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/Scd3bd33467fa4043becc18698a4f408ff_21bc8384-e2bc-4bc5-9928-07b4419888f5.webp?v=1773797188' },
    { slug: 'shop-ebike-boys-20-fat-tire-full-suspension', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S307ba28ba4bd4c76a63d95c5002c16ad6_e4a4df89-614a-40f7-8834-1800ad4ad75d.webp?v=1773797167' },
    { slug: 'shop-ebike-boys-750w-48v-20in', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S160a8b1f441d484ba123af10f1c343fd2_7b3a2c11-73eb-45ba-8293-a6e94f23d66c.webp?v=1773797167' },
    { slug: 'shop-terrosor-715w-folding', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S4783b0c9be314445952f8bd90d26f625i.webp?v=1773797167' },
    { slug: 'shop-ebike-boys-715w-folding', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S4783b0c9be314445952f8bd90d26f625i_21e9c161-2f22-45e4-b959-6681d3dc9554.webp?v=1773797167' },
    { slug: 'shop-ebike-boys-1200w-peak-20in', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/Sf7dfb97231eb4e168429fb78b77a485bt.webp?v=1773797168' },
    { slug: 'shop-ebike-boys-20-fat-tire-all-terrain', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S307ba28ba4bd4c76a63d95c5002c16ad6.webp?v=1773797166' },
    { slug: 'shop-ebike-boys-750w-48v-13ah', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S160a8b1f441d484ba123af10f1c343fd2.webp?v=1773797166' },
    { slug: 'shop-ebike-boys-1200w-peak-fat-tire', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/Sf7dfb97231eb4e168429fb78b77a485bt_c8dec797-cd51-4e27-bd47-01f67754019c.webp?v=1773797167' },
    { slug: 'shop-ebike-boys-1200w-lithium-48v', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S5aa511eff4f341dca8b56750b8fd28e8R_6c887236-e402-48e3-b76e-cd019ac3fc3e.webp?v=1773797167' },
    { slug: 'shop-deepower-s7pro', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/Sde3fda6fca5f43a382673e802e637d44j_jpg_220x220q75_jpg.jpg?v=1773797166' },
    { slug: 'shop-hezzo-1200w', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S5aa511eff4f341dca8b56750b8fd28e8R.webp?v=1773797168' },
    { slug: 'shop-high-quality-52v-750w', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S39b3003dbc5f4eed9495e500abf0c3f4L.webp?v=1773797167' },
    { slug: 'shop-aniioki-a9-pro-max', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/Aniioki_a9_awd_25_15_Black_d96624aa-3493-43d1-b7bb-c5aaeee27aa9.webp?v=1773797008' },
    { slug: 'shop-eahora-romeo-ii', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/romeoii_upgraded_front_fork_8023c826-83fc-41dc-bede-55ab7712ee23.webp?v=1773797008' },
    { slug: 'shop-rawrr-mantix-x-pro', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/Rawrr_xpro3.webp?v=1773797007' },
    { slug: 'shop-rawrr-mini', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/MiniRDefault.webp?v=1773797007' },
    { slug: 'shop-eahora-romeo-ultra', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/eahora_romeo_Ultra_electric_bike_gray_3_2afd4cea-95f4-4518-8a09-e10c8e923fe8.webp?v=1773797008' },
    { slug: 'shop-ubco-2x2-special-edition', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/UBCO_SE_Front_800x_30897c7f-07a1-4b3b-b64f-e28a3c575a7b.jpg?v=1773797007' },
    { slug: 'shop-2x2-adventure-bike', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/UBCO_ADV_Black-Front3_4_1200x_d0a77142-feab-495b-a436-091510b6d5ff.png?v=1773797007' },
    { slug: 'shop-eahora-knight-m1ps', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/Eahora_M1PS_Basic.webp?v=1773797006' },
    { slug: 'shop-quietkat-apex-hd', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/QuietKat_HD_Grey_098_1024x1024_ed1a10c2-4b32-4b25-b9b6-58c0b3dcb653.webp?v=1773796933' },
    { slug: 'shop-quietkat-apex-xd', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/QuietKat_HD_Grey_098_1024x1024_64a64c05-1e35-4ae5-b2e9-7a48a0c69436.webp?v=1773796934' },
    { slug: 'shop-eahora-romeo-ultra-ii', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/eahora_romeo_Ultra_II_electric_bike_black_2.webp?v=1773796933' },
    { slug: 'shop-ubco-hunt-2x2', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/UBCO_HE_Top34_2000x_2b1d5ff5-157d-47a4-9a9f-18e831aeb9aa.webp?v=1773796934' },
    { slug: 'shop-ubco-2x2-se', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/UBCO_SE_Front3_4_2000x_ff1cb602-95f1-4bf8-b7b3-15169ae5abd7.webp?v=1773796933' },
    { slug: 'shop-ubco-work-bike', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/UBCO_WORK_Black-RHS_98718b74-1d71-4f23-a5b9-2a832ea10a82.webp?v=1773796932' },
    { slug: 'shop-ebike-boys-coroma-scooter', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S9a7b0f3b73cd41fca33fedc0363e8f82s_ddb311e8-bcb9-4831-a135-eaf840363a30.webp?v=1773797167' },
    { slug: 'shop-coroma-scooter-women', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S9a7b0f3b73cd41fca33fedc0363e8f82s.webp?v=1773797167' },
    { slug: 'shop-ebike-boys-m6max-scooter', date: '2027-01-20', image: 'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/Sa9ebd2e972b64eda950c3be81ad13cd0b_88c000ff-eb32-464c-b466-2ece4c99b270.webp?v=1773797168' },
    { slug: 'how-to-choose-your-first-electric-bike', date: '2027-01-12', image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&q=80' },
    { slug: 'ebike-commuting-save-time-money', date: '2027-01-08', image: 'https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=1200&q=80' },
    { slug: 'ebike-maintenance-checklist', date: '2027-01-02', image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=1200&q=80' },
    { slug: 'transform-your-home-with-biophilic-design', date: '2027-01-10', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80' },
    { slug: 'morning-rituals-for-a-mindful-day', date: '2027-01-05', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80' },
    { slug: 'the-art-of-curated-minimalism', date: '2024-12-28', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80' },
    { slug: 'smart-home-tech-that-actually-improves-your-life', date: '2024-12-20', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&q=80' },
    { slug: 'seasonal-tablescaping-for-every-occasion', date: '2024-12-15', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80' },
    { slug: 'the-science-of-better-sleep', date: '2024-12-08', image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=1200&q=80' },
    { slug: 'sustainable-fashion-wardrobe-essentials', date: '2024-12-01', image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80' },
    { slug: 'digital-detox-reclaiming-your-attention', date: '2024-11-25', image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80' },
    { slug: 'the-perfect-home-office-setup', date: '2024-11-18', image: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=1200&q=80' },
  ];

  const productPages = (productsData as Array<{ slug: string; image?: string }>).map(p => ({
    slug: p.slug,
    image: p.image || null,
  }));

  // Build URLs for static pages
  const urls = staticPages.map(page => {
    const entry: any = {
      url: `${siteUrl}${page.path}`,
      lastmod: today,
      changefreq: page.changefreq,
      priority: page.priority,
    };
    return entry;
  });

  // Add blog post URLs with images
  for (const post of blogPosts) {
    const entry: any = {
      url: `${siteUrl}/blog/${post.slug}`,
      lastmod: post.date,
      changefreq: 'monthly',
      priority: '0.9',
    };
    if (post.image) {
      entry.image = post.image;
    }
    urls.push(entry);
  }

  // Add product pages with images
  for (const prod of productPages) {
    const entry: any = {
      url: `${siteUrl}/products/${prod.slug}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.8',
    };
    if (prod.image) {
      entry.image = prod.image;
    }
    urls.push(entry);
  }

  // Try to add content collection blog posts
  try {
    const collectionPosts = await getCollection('blog');
    for (const post of collectionPosts) {
      const entry: any = {
        url: `${siteUrl}/blog/${post.data.slug || post.slug}`,
        lastmod: post.data.date ? post.data.date : today,
        changefreq: 'monthly',
        priority: '0.9',
      };
      if (post.data.image) {
        entry.image = post.data.image;
      }
      urls.push(entry);
    }
  } catch {
    // Collection may not exist yet
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
