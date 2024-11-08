import { serve } from "https://deno.land/std@0.220.1/http/server.ts";

const handler = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);

  switch (url.pathname) {
    case "/":
      return new Response("Welcome to high-performance Deno server!", {
        headers: { "content-type": "text/plain" },
      });
    default:
      return new Response("Not Found", { status: 404 });
  }
};

serve(handler, { port: Deno.env.get("PORT") || 8000 });