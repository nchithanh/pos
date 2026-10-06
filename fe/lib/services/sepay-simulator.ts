/**
 * SePay e-invoice sandbox contract simulator (docs-shaped responses).
 * No real network / credentials — for POS demo on static Pages.
 * @see https://developer.sepay.vn/vi/einvoice-api/v1/xuat-hoa-don-dien-tu
 */

export type SepaySimTokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
};

export type SepaySimInvoiceCreateRequest = {
  provider_account_id: string;
  template_code: string;
  invoice_series: string;
  seller_store_xid?: string;
  is_draft?: boolean;
  buyer: {
    name: string;
    tax_code: string;
    address?: string;
    email?: string;
    type: "individual" | "business";
  };
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }[];
  amount: number;
};

export type SepaySimInvoiceCreateResponse = {
  tracking_code: string;
  tracking_url: string;
  status: "draft" | "processing";
  message: string;
};

export type SepaySimTrackingResponse = {
  tracking_code: string;
  status: "draft" | "processing" | "issued" | "failed";
  invoice_number?: string;
  tracking_url: string;
  message: string;
};

const TOKENS = new Map<string, number>();
const TRACKING = new Map<
  string,
  {
    status: SepaySimTrackingResponse["status"];
    invoice_number?: string;
    createdAt: number;
    payload: SepaySimInvoiceCreateRequest;
  }
>();

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** POST /v1/token — simulator */
export async function sepaySimGetToken(input?: {
  client_id?: string;
  client_secret?: string;
}): Promise<SepaySimTokenResponse> {
  await delay(280);
  if (input?.client_id === "invalid") {
    throw new Error("SePay simulator: invalid_client");
  }
  const access_token = uid("tok");
  TOKENS.set(access_token, Date.now() + 3600_000);
  return {
    access_token,
    token_type: "Bearer",
    expires_in: 3600,
  };
}

function assertToken(bearer?: string) {
  if (!bearer?.startsWith("Bearer ")) {
    throw new Error("SePay simulator: missing Bearer token");
  }
  const token = bearer.slice(7);
  const exp = TOKENS.get(token);
  if (!exp || exp < Date.now()) {
    throw new Error("SePay simulator: token expired");
  }
}

/** POST /v1/invoices/create — simulator */
export async function sepaySimCreateInvoice(
  bearer: string,
  body: SepaySimInvoiceCreateRequest,
): Promise<SepaySimInvoiceCreateResponse> {
  await delay(450);
  assertToken(bearer);
  if (!body.provider_account_id) {
    throw new Error("SePay simulator: provider_account_id required");
  }
  if (!body.items?.length) {
    throw new Error("SePay simulator: items required");
  }
  const tracking_code = uid("trk");
  const isDraft = body.is_draft !== false;
  TRACKING.set(tracking_code, {
    status: isDraft ? "draft" : "processing",
    createdAt: Date.now(),
    payload: body,
  });
  return {
    tracking_code,
    tracking_url: `https://einvoice-api-sandbox.sepay.vn/demo/tracking/${tracking_code}`,
    status: isDraft ? "draft" : "processing",
    message: isDraft
      ? "Simulator: hóa đơn nháp đã tạo"
      : "Simulator: đang xử lý phát hành",
  };
}

/** GET tracking — after ~400ms processing → issued */
export async function sepaySimGetTracking(
  bearer: string,
  trackingCode: string,
): Promise<SepaySimTrackingResponse> {
  await delay(320);
  assertToken(bearer);
  const row = TRACKING.get(trackingCode);
  if (!row) throw new Error("SePay simulator: tracking not found");

  if (row.status === "draft") {
    return {
      tracking_code: trackingCode,
      status: "draft",
      tracking_url: `https://einvoice-api-sandbox.sepay.vn/demo/tracking/${trackingCode}`,
      message: "Simulator: đang ở trạng thái nháp (is_draft)",
    };
  }

  if (row.status === "processing" && Date.now() - row.createdAt > 200) {
    const invoice_number = String(
      10000000 + (TRACKING.size % 90000000),
    ).padStart(8, "0");
    row.status = "issued";
    row.invoice_number = invoice_number;
  }

  return {
    tracking_code: trackingCode,
    status: row.status,
    invoice_number: row.invoice_number,
    tracking_url: `https://einvoice-api-sandbox.sepay.vn/demo/tracking/${trackingCode}`,
    message:
      row.status === "issued"
        ? "Simulator: đã phát hành (không nộp CQT thật)"
        : "Simulator: đang xử lý…",
  };
}

/** Convenience: token → create (is_draft false) → poll until issued */
export async function sepaySimIssueFlow(body: SepaySimInvoiceCreateRequest) {
  const token = await sepaySimGetToken();
  const bearer = `Bearer ${token.access_token}`;
  const created = await sepaySimCreateInvoice(bearer, {
    ...body,
    is_draft: false,
  });
  let tracking = await sepaySimGetTracking(bearer, created.tracking_code);
  if (tracking.status === "processing") {
    await delay(250);
    tracking = await sepaySimGetTracking(bearer, created.tracking_code);
  }
  return { created, tracking };
}
