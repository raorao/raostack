import { Actor } from "../activitypub/types.ts";
import { crypto } from "https://deno.land/std/crypto/mod.ts";

const kv = await Deno.openKv();

export interface ActorData {
  username: string;
  domain: string;
  displayName: string;
  summary: string;
  publicKey: string;
  privateKey: string;
  createdAt: number;
}

async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  return keyPair;
}

export async function createActor(
  username: string,
  displayName: string,
  summary: string,
): Promise<ActorData | null> {
  const domain = Deno.env.get("DOMAIN") || "localhost:8000";

  // Check if username already exists
  const existing = await getActor(username);
  if (existing) {
    return null;
  }

  // Generate keypair (we'll implement this next)
  const { publicKey, privateKey } = await generateKeyPair();

  const actor: ActorData = {
    username,
    domain,
    displayName,
    summary,
    publicKey,
    privateKey,
    createdAt: Date.now(),
  };

  // Store in KV
  await kv.set(["actors", username], actor);
  return actor;
}

export async function getActor(username: string): Promise<ActorData | null> {
  const result = await kv.get<ActorData>(["actors", username]);
  return result.value;
}

export function actorToActivityPub(actor: ActorData): Actor {
  const domain = actor.domain;
  const baseUrl = `https://${domain}/users/${actor.username}`;

  return {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1",
    ],
    type: "Person",
    id: baseUrl,
  };
}