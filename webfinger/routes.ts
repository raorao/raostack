import { getActor } from "../storage/actors.ts";

export async function handleWebFinger(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");

  if (!resource) {
    return new Response("Resource query parameter required", { status: 400 });
  }

  const match = resource.match(/^acct:([^@]+)@(.+)$/);
  if (!match) {
    return new Response("Invalid resource format", { status: 400 });
  }

  const [_, username, domain] = match;

  const ourDomain = Deno.env.get("DOMAIN") || "localhost:8000";
  console.log(`Domain: ${domain}`);

  if (domain !== ourDomain) {
    return new Response("Resource not found", { status: 404 });
  }

  // Look up the actor in our KV store
  const actor = await getActor(username);
  if (!actor) {
    return new Response("User not found", { status: 404 });
  }

  const response = {
    subject: `acct:${username}@${domain}`,
    aliases: [
      `https://${domain}/users/${username}`,
    ],
    links: [
      {
        rel: "self",
        type: "application/activity+json",
        href: `https://${domain}/users/${username}`,
      },
      {
        rel: "http://webfinger.net/rel/profile-page",
        type: "text/html",
        href: `https://${domain}/users/${username}`,
      },
    ],
  };

  return new Response(JSON.stringify(response), {
    headers: {
      "content-type": "application/jrd+json",
    },
  });
}