const BASE_PATH = '/gnomo';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // Strip /gnomo prefix so the Worker finds files at their real dist/ paths
    if (pathname.startsWith(BASE_PATH)) {
      pathname = pathname.slice(BASE_PATH.length) || '/';
    }

    // Try to serve the static asset
    const assetRequest = new Request(new URL(pathname, url.origin), request);
    const response = await env.ASSETS.fetch(assetRequest);

    if (response.status !== 404) return response;

    // SPA fallback: serve index.html for client-side routes
    return env.ASSETS.fetch(new Request(new URL('/', url.origin), request));
  },
};
