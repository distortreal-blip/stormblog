import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const categories = ['VPS', 'DevOps', 'Linux', 'Docker', 'Безопасность', 'Облака', 'Разработка'] as const;

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			category: z.enum(categories).default('VPS'),
			heroImage: z.optional(image()),
		}),
});

export const collections = { blog };
