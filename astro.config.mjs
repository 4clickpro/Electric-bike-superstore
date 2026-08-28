import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://theelectricbikesuperstore.com',
  base: '/',
  integrations: [mdx()],
  output: 'static',
  redirects: {
    '/blog/amazon-ats-power-golf-cart-2': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-ats-power-golf-cart': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-giyi-4-seater-golf-cart': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-golf-cart-b0f8xd5f94': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-golf-cart-b0f8xd5f94-vs-kingbull-hunter': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-golf-cart-b0g53wwvps': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-golf-cart-b0g53wwvps-vs-burchda-y3-awd': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-golf-cart-b0gdfmd6qm': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-golf-cart-b0gdfmd6qm-vs-amazon-electric-mobility-scooter': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-goup-sightseeing-2-vs-amazon-golf-cart-b0gdfmd6qm': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-goup-sightseeing-golf-cart': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-goup-stylish-golf-cart': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-sdlanch-4-seater-golf-cart': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-xark-4-seater-golf-cart': '/blog/best-electric-golf-carts-2026',
    '/blog/kingbull-discover-vs-amazon-goup-sightseeing-golf-cart': '/blog/best-golf-cart-ebikes-2026',
    '/blog/amazon-ats-power-waterproof': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-goup-sightseeing-2': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-goup-2-seater': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-goup-4-seater-sunroof': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-1200-electric-passenger': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-electric-mobility-scooter': '/blog/best-electric-golf-carts-2026',
    '/blog/amazon-eahora-romeo-pro-iii-vs-amazon-goup-sightseeing-2': '/blog/amazon-eahora-romeo-pro-iii',
    '/blog/amazon-1200-electric-passenger-vs-amazon-eahora-urace-carbon': '/blog/amazon-eahora-urace-carbon',
    '/blog/amazon-8500w-electric-dirt-bike-vs-amazon-1200-electric-passenger': '/blog/amazon-8500w-electric-dirt-bike'
  },
  build: {
    assets: 'assets'
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});
