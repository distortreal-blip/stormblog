interface Env {
	VIEWS?: KVNamespace;
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

function getViewsStore(env: Env): KVNamespace | null {
	return env.VIEWS ?? null;
}

export const onRequest: PagesFunction<Env> = async (context) => {
	const slug = context.params.slug;

	if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
		return json({ error: 'Invalid slug' }, 400);
	}

	const viewsStore = getViewsStore(context.env);
	if (!viewsStore) {
		return json({ slug, views: 0, configured: false });
	}

	const viewsKey = `views:${slug}`;

	if (context.request.method === 'GET') {
		const views = Number.parseInt((await viewsStore.get(viewsKey)) || '0', 10);
		return json({ slug, views, configured: true });
	}

	if (context.request.method === 'POST') {
		const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
		const dedupeKey = `dedupe:${slug}:${ip}`;
		const alreadyViewed = await viewsStore.get(dedupeKey);

		if (!alreadyViewed) {
			const current = Number.parseInt((await viewsStore.get(viewsKey)) || '0', 10);
			await viewsStore.put(viewsKey, String(current + 1));
			await viewsStore.put(dedupeKey, '1', { expirationTtl: 86_400 });
		}

		const views = Number.parseInt((await viewsStore.get(viewsKey)) || '0', 10);
		return json({ slug, views, configured: true });
	}

	return new Response('Method Not Allowed', { status: 405 });
};
