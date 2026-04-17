/**
 * Thin wrapper around the CloudPaya REST API.
 *
 * Docs: https://cloudpaya.com/llms-full.txt (all endpoints are POST
 * application/x-www-form-urlencoded to /api.php, see `CLOUDPAYA_BASE`).
 *
 * For the **top-up UX** we use CloudPaya's hosted checkout page:
 *
 *     https://cloudpaya.com/pay.php?checkout_id=<id>&price=<amount>&currency=USD&…
 *
 * The checkout widget JS (`/js/client.min.js`, line ~477) treats any
 * `checkout_id` that contains `"custom"` as an ad-hoc checkout, meaning
 * CloudPaya honours the `price`/`currency` query params verbatim instead of
 * looking up a dashboard-configured saved checkout. We therefore generate a
 * **unique** `custom-<txId>` id per transaction — this guarantees there's
 * no collision with any existing saved checkout (which is what caused the
 * earlier `$10 → 5 USDT` symptom).
 *
 * For inbound notifications we still rely on CloudPaya's **webhook** (HMAC-
 * SHA256 with header `X-Signature` — or `X-Boxcoin-Signature` on newer
 * accounts). We accept either header.
 */

export const CLOUDPAYA_BASE = "https://cloudpaya.com";

export function getCloudpayaApiKey(): string | null {
  const v = process.env.CLOUDPAYA_API_KEY;
  return v && v.length > 0 ? v : null;
}

export function getCloudpayaWebhookSecret(): string | null {
  const v = process.env.CLOUDPAYA_WEBHOOK_SECRET;
  return v && v.length > 0 ? v : null;
}

export type CloudpayaStatus = "P" | "C" | "R" | "X";

export interface CloudpayaWebhookTransaction {
  id: string;
  hash?: string;
  from?: string;
  to?: string;
  amount: string;
  amount_fiat: string;
  cryptocurrency: string;
  currency: string;
  external_reference?: string;
  title?: string;
  status: CloudpayaStatus;
  creation_time?: string;
  confirmations?: number | string;
}

export interface CloudpayaWebhookPayload {
  transaction: CloudpayaWebhookTransaction;
}

interface CloudpayaApiResponse<T> {
  success?: boolean;
  response?: T;
  error?: string;
  message?: string;
}

async function callCloudpaya<T>(
  fn: string,
  params: Record<string, string>
): Promise<{ ok: true; response: T } | { ok: false; error: string }> {
  const apiKey = getCloudpayaApiKey();
  if (!apiKey) return { ok: false, error: "CLOUDPAYA_API_KEY not configured" };

  const body = new URLSearchParams();
  body.set("api-key", apiKey);
  body.set("function", fn);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") body.set(k, v);
  }

  let res: Response;
  try {
    res = await fetch(`${CLOUDPAYA_BASE}/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    });
  } catch (e) {
    return {
      ok: false,
      error: `CloudPaya network error: ${(e as Error).message}`,
    };
  }

  const text = await res.text();
  let json: CloudpayaApiResponse<T> | null;
  try {
    json = JSON.parse(text) as CloudpayaApiResponse<T>;
  } catch {
    return {
      ok: false,
      error: `CloudPaya returned non-JSON (HTTP ${res.status}): ${text.slice(
        0,
        200
      )}`,
    };
  }
  if (!json || json.success === false || json.response === undefined) {
    const detail =
      json?.error ||
      json?.message ||
      (json?.response !== undefined
        ? JSON.stringify(json.response).slice(0, 200)
        : text.slice(0, 200));
    return {
      ok: false,
      error: `CloudPaya ${fn} failed: ${detail || `HTTP ${res.status}`}`,
    };
  }
  return { ok: true, response: json.response as T };
}

/**
 * Build the CloudPaya hosted checkout URL for an ad-hoc, per-transaction
 * custom price. The `checkout_id` starts with `custom-` so CloudPaya's JS
 * treats it as a custom-price checkout and the `price`/`currency` params are
 * honoured. The `<txId>` suffix keeps it unique so we can't collide with
 * anything the merchant happens to have saved in the dashboard.
 */
export function buildHostedCheckoutUrl(params: {
  txId: string;
  priceUsd: number;
  cryptocurrencyCode: string;
  externalReference?: string;
  redirectUrl?: string;
  title?: string;
  description?: string;
}): string {
  const apiKey = getCloudpayaApiKey() ?? "";
  const qs = new URLSearchParams({
    checkout_id: `custom-${params.txId}`,
    price: params.priceUsd.toFixed(2),
    currency: "USD",
    cryptocurrency_code: params.cryptocurrencyCode,
    cloud: apiKey,
  });
  if (params.externalReference) {
    qs.set("external_reference", params.externalReference);
  }
  if (params.redirectUrl) qs.set("redirect", params.redirectUrl);
  if (params.title) qs.set("title", params.title);
  if (params.description) qs.set("description", params.description);
  return `${CLOUDPAYA_BASE}/pay.php?${qs.toString()}`;
}

/**
 * Call `function=get-transaction` to read the authoritative server-side
 * status for a CloudPaya transaction id. Used defensively in the webhook.
 */
export async function fetchCloudpayaTransaction(
  transactionId: string
): Promise<CloudpayaWebhookTransaction | null> {
  const apiKey = getCloudpayaApiKey();
  if (!apiKey) return null;

  const body = new URLSearchParams();
  body.set("api-key", apiKey);
  body.set("function", "get-transaction");
  body.set("transaction_id", transactionId);

  const res = await fetch(`${CLOUDPAYA_BASE}/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) return null;

  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    response?: CloudpayaWebhookTransaction;
  } | null;
  if (!json?.success || !json.response) return null;
  return json.response;
}
