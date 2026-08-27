/**
 * Nexa AI proxy — Cloudflare Worker
 * ---------------------------------
 * Sits between the Nexa app (hosted on GitHub Pages / Cloudflare Pages) and
 * Anthropic's API. The API key lives only here, as a Worker secret — never
 * in the app's own code, where anyone could read it via browser dev tools.
 *
 * The app calls this Worker's URL instead of api.anthropic.com directly;
 * this Worker adds the real API key and forwards the request.
 */

export default {
  async fetch(request, env) {https://github.com/jesserpillay-bit/nexahealthandwellness/blob/main/index.html
    const allowedOrigins = [
      'https://nexahnw.co.za',
      'https://www.nexahnw.co.za',
    ];

    const origin = request.headers.get('Origin') || '';
    const isAllowed = allowedOrigins.includes(origin);

    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Preflight request
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    if (!env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server is missing ANTHROPIC_API_KEY. See README.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body = await request.text();

      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body,
      });

      const data = await anthropicResponse.text();

      return new Response(data, {
        status: anthropicResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Proxy request failed', detail: String(err) }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
