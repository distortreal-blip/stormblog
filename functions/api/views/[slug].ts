interface Env {
	VIEWS: KVNamespace;
}

function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
		},
	});
}

export const onRequest: PagesFunction<Env> = async (context) => {
	const slug = context.params.slug;

	if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
		return json({ error: 'Invalid slug' }, 400);
	}

	const viewsKey = `views:${slug}`;

	if (context.request.method === 'GET') {
		const views = Number.parseInt((await context.env.VIEWS.get(viewsKey)) || '0', 10);
		return json({ slug, views });
	}

	if (context.request.method === 'POST') {
		const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
		const dedupeKey = `dedupe:${slug}:${ip}`;
		const alreadyViewed = await context.env.VIEWS.get(dedupeKey);

		if (!alreadyViewed) {
			const current = Number.parseInt((await context.env.VIEWS.get(viewsKey)) || '0', 10);
			await context.env.VIEWS.put(viewsKey, String(current + 1));
			await context.env.VIEWS.put(dedupeKey, '1', { expirationTtl: 86_400 });
		}

		const views = Number.parseInt((await context.env.VIEWS.get(viewsKey)) || '0', 10);
		return json({ slug, views });
	}

	return new Response('Method Not Allowed', { status: 405 });
};
