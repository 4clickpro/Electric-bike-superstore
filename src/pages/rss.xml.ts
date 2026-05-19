// RSS Feed generation for The Electric Bike Superstore blog
import { getCollection } from 'astro:content';

export async function GET() {
  const siteUrl = 'https://theelectricbikesuperstore.com';
  const siteName = 'The Electric Bike Superstore';
  const siteDescription = 'Discover top-rated electric bikes, expert buying guides, and e-bike gear. Ride farther, ride smarter.';

  // Get content collection blog posts
  let collectionPosts: Array<{ title: string; description: string; slug: string; pubDate: Date; category: string; author: string }> = [];
  try {
    const posts = await getCollection('blog');
    collectionPosts = posts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      slug: post.data.slug || post.slug,
      pubDate: new Date(post.data.date),
      category: post.data.category || 'General',
      author: post.data.author || 'The Electric Bike Superstore',
    }));
  } catch {
    // Collection may not exist yet — that's fine
  }

  // Hardcoded blog posts (from [...slug].astro)
  const hardcodedPosts = [
    { title: 'How to Choose Your First Electric Bike: The Ultimate 2027 Guide', description: 'Everything you need to know before buying your first e-bike — motor types, battery range, classes, and the questions most first-time buyers forget to ask.', slug: 'how-to-choose-your-first-electric-bike', pubDate: new Date('2027-01-12'), category: 'Buying Guide', author: 'Mike Torres' },
    { title: 'How E-Bike Commuting Saves You Time & Money (With Real Numbers)', description: 'We crunched the numbers. A $1,899 e-bike pays for itself in 8 months compared to driving — and you get there faster too.', slug: 'ebike-commuting-save-time-money', pubDate: new Date('2027-01-08'), category: 'Commuting', author: 'Sarah Chen' },
    { title: 'The Complete E-Bike Maintenance Checklist', description: "From battery care to chain lube — this maintenance routine will extend your e-bike's lifespan by years.", slug: 'ebike-maintenance-checklist', pubDate: new Date('2027-01-02'), category: 'Maintenance', author: 'Dave Kim' },
    { title: 'eBike Boys Fat Tire Electric Bike — 1200W Motor, 30+ MPH', description: '1200W motor, fat tires, and 30+ MPH top speed. The ultimate fat tire e-bike for all-terrain domination.', slug: 'shop-ebike-boys-fat-tire-1200w', pubDate: new Date('2027-01-20'), category: 'eBike Boys', author: 'The Electric Bike Superstore' },
    { title: 'eBike Boys 20" Fat Tire Full Suspension E-Bike — 30MPH', description: 'Full suspension, 20" fat tires, and 30 MPH speed. Built to handle any terrain with confidence.', slug: 'shop-ebike-boys-20-fat-tire-full-suspension', pubDate: new Date('2027-01-20'), category: 'eBike Boys', author: 'The Electric Bike Superstore' },
    { title: 'eBike Boys 750W Electric Bike — 48V Battery, 20" Wheels', description: '750W motor with 48V battery on 20" wheels. The perfect balance of power and portability.', slug: 'shop-ebike-boys-750w-48v-20in', pubDate: new Date('2027-01-20'), category: 'eBike Boys', author: 'The Electric Bike Superstore' },
    { title: 'Terrosor 715W Peak Folding Electric Bicycle — 50km/h', description: '715W peak power in a folding frame. Max speed 50km/h. Commute or adventure — this bike does both.', slug: 'shop-terrosor-715w-folding', pubDate: new Date('2027-01-20'), category: 'eBike Boys', author: 'The Electric Bike Superstore' },
    { title: 'Aniioki A9 Pro Max — 60V Dual Motor eBike', description: 'Dual 60V motors for unstoppable power. The Aniioki A9 Pro Max is the ultimate high-performance e-bike.', slug: 'shop-aniioki-a9-pro-max', pubDate: new Date('2027-01-20'), category: 'Rex E-Bikes', author: 'The Electric Bike Superstore' },
    { title: 'RawRR Mantix X Pro — Pro-Level Electric Dirt Bike', description: 'Pro-level performance with no compromises. A new class of electric dirt bike.', slug: 'shop-rawrr-mantix-x-pro', pubDate: new Date('2027-01-20'), category: 'Rex E-Bikes', author: 'The Electric Bike Superstore' },
    { title: 'Eahora Romeo Ultra II — 60V Dual Motor, 80Ah Battery', description: '60V dual-motor system with an 80Ah high-capacity battery for exceptional speed and range.', slug: 'shop-eahora-romeo-ultra-ii', pubDate: new Date('2027-01-20'), category: 'Rex E-Bikes', author: 'The Electric Bike Superstore' },
  ];

  // Merge and sort by date (newest first)
  const allPosts = [...collectionPosts, ...hardcodedPosts]
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, 50); // RSS best practice: max 50 items

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${siteName}</title>
    <link>${siteUrl}</link>
    <description>${siteDescription}</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/og-default.png</url>
      <title>${siteName}</title>
      <link>${siteUrl}</link>
      <width>1200</width>
      <height>630</height>
    </image>
    <category>E-Bikes</category>
    <category>Electric Bikes</category>
    <category>Transportation</category>
    <category>Green Energy</category>
    <ttl>60</ttl>
${allPosts.map(post => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.description}]]></description>
      <category><![CDATA[${post.category}]]></category>
      <dc:creator><![CDATA[${post.author}]]></dc:creator>
      <pubDate>${post.pubDate.toUTCString()}</pubDate>
    </item>`).join('\n')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'max-age=3600',
    },
  });
}
