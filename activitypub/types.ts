export interface Actor {
  "@context": string[];
  type: "Person";
  id: string;
  following: string;
  followers: string;
  inbox: string;
  outbox: string;
  preferredUsername: string;
  name: string;
  summary: string;
  publicKey: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
}