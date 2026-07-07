import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { BLOG_CATEGORY_LABELS } from './consts';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			category: z.enum(BLOG_CATEGORY_LABELS).default('VPS'),
			keywords: z.array(z.string()).optional(),
			heroImage: z.optional(image()),
			/** SEO: описательный alt для обложки (Google Images) */
			imageAlt: z.string().optional(),
		}),
});

export const collections = { blog };
