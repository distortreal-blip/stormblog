// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { buildLastmodMap } from './scripts/sitemap-lastmod.mjs';

const lastmodMap = buildLastmodMap();

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.stormnetcloud.com',
	integrations: [
		mdx(),
		sitemap({
			changefreq: 'weekly',
			priority: 0.7,
			serialize(item) {
				const pathname = new URL(item.url).pathname;
				const lastmod = lastmodMap.get(pathname);
				if (lastmod) {
					item.lastmod = lastmod;
				}

				if (pathname === '/') {
					item.priority = 1.0;
					item.changefreq = 'daily';
				} else if (
					pathname.startsWith('/blog/') &&
					pathname !== '/blog/' &&
					!pathname.includes('/category/') &&
					!pathname.includes('/guide/')
				) {
					item.priority = 0.8;
					item.changefreq = 'monthly';
				} else if (pathname.startsWith('/tools/')) {
					item.priority = 0.6;
				}

				return item;
			},
		}),
	],
});
