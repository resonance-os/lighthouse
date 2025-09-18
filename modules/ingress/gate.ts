// modules/ingress/gate.ts（一部）: HMAC-SHA256（web標準）
const ACTORS = {
  oss: {
    secret: "supersecret",
    allow: [/^git\..*/, /^release\..*/, /^actor\.event$/],
  },
};

// Add this export if not present
export function validateObservation(obs: any): {
  valid: boolean;
  error?: string;
} {
  // Implement your validation logic here
  if (!obs) {
    return { valid: false, error: "Observation is required" };
  }
  // Example: always valid
  return { valid: true };
}

export async function verifySig(req: Request, raw: string): Promise<boolean> {
  const id = req.headers.get("x-actor-id") ?? "";
  const sig = req.headers.get("x-actor-signature") ?? ""; // 例: "sha256=abcdef..."
  const ts = Number(req.headers.get("x-actor-ts") ?? 0);
  if (!id || !sig || !ts || Math.abs(Date.now() - ts) > 300_000) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ACTORS[id as keyof typeof ACTORS]?.secret ?? ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(raw)
  );
  const hex = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return sig === `sha256=${hex}`;
}
export const allowType = (id: string, type: string) =>
  (ACTORS as any)[id]?.allow?.some((re: RegExp) => re.test(type)) ?? false;
