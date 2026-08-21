const allowedOrigins = [
  "https://orange-pine-933a.jesse-r-pillay.workers.dev",
  "https://nexahnw.co.za",
  "http://nexahnw.co.za",
  "https://www.nexahnw.co.za",
  "http://www.nexahnw.co.za",
];

const ANTHROPIC_API_URL = "https://api.anthropic.com";

function getCorsHeaders(origin) {
  if (allowedOrigins.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access",
      "Access-Control-Max-Age": "86400",
    };
  }
  return {};
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = getCorsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!allowedOrigins.includes(origin)) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const url = new URL(request.url);
      const targetUrl = ANTHROPIC_API_URL + url.pathname + url.search;

      const headers = new Headers(request.headers);
      headers.delete("Origin");
      headers.set("Origin", ANTHROPIC_API_URL);

      if (env.ANTHROPIC_API_KEY) {
        headers.set("x-api-key", env.ANTHROPIC_API_KEY);
      }

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.body,
      });

      const responseHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Proxy error: " + err.message }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  },
};
