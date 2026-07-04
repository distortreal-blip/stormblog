import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export const TOPICS = ['VPS', 'DevOps', 'Linux', 'Docker', 'Безопасность', 'Облака'] as const;

export function sortPostsByDate(posts: BlogPost[]) {
	return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function getReadingTimeMinutes(body: string) {
	const words = body.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / 200));
}

export function formatReadingTime(minutes: number) {
	return `${minutes} мин`;
}

export function getPostPath(id: string) {
	return `/blog/${id}/`;
}

export function getAdjacentPosts(current: BlogPost, posts: BlogPost[]) {
	const sorted = sortPostsByDate(posts);
	const index = sorted.findIndex((post) => post.id === current.id);
	return {
		prev: index > 0 ? sorted[index - 1] : undefined,
		next: index < sorted.length - 1 ? sorted[index + 1] : undefined,
	};
}

export function getRelatedPosts(current: BlogPost, posts: BlogPost[], limit = 3) {
	return sortPostsByDate(posts)
		.filter((post) => post.id !== current.id)
		.sort((a, b) => {
			const sameCategory =
				Number(b.data.category === current.data.category) -
				Number(a.data.category === current.data.category);
			if (sameCategory !== 0) return sameCategory;
			return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
		})
		.slice(0, limit);
}

export function slugHue(id: string) {
	let hash = 0;
	for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	return hash % 360;
}

export interface TocHeading {
	id: string;
	text: string;
	level: 2 | 3;
}

export function extractHeadings(body: string): TocHeading[] {
	const headings: TocHeading[] = [];
	const regex = /^(#{2,3})\s+(.+)$/gm;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(body)) !== null) {
		const level = match[1].length as 2 | 3;
		const text = match[2].replace(/\*\*(.+?)\*\*/g, '$1').trim();
		const id = text
			.toLowerCase()
			.replace(/[^\p{L}\p{N}\s-]/gu, '')
			.replace(/\s+/g, '-');
		headings.push({ id, text, level });
	}

	return headings;
}
