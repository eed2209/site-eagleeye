import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://eagleeye.digital',
  integrations: [
    // /scan, /scan-b… : landings des publicités, noindex et hors du sitemap
    sitemap({ filter: (page) => !page.includes('/scan') }),
  ],
});
