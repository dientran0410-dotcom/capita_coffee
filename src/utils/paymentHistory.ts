export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export type PaymentResult = {
  status: PaymentStatus;
  invoiceId?: string;
  orderNumber?: string;
  total?: number;
  orderedAt?: string;
  paymentMethod?: string;
  recordedAt: string;
};

const HISTORY_KEY = 'paymentResults';
const LAST_KEY = 'lastPaymentResult';

const safeGetStorage = (kind: 'local' | 'session'): Storage | null => {
  try {
    return kind === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
  } catch {
    return null;
  }
};

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeResult(input: unknown): PaymentResult | null {
  if (!input || typeof input !== 'object') return null;

  const payload = input as Partial<PaymentResult>;
  const status = payload.status;
  if (status !== 'SUCCESS' && status !== 'FAILED' && status !== 'PENDING') return null;

  const invoiceId = typeof payload.invoiceId === 'string' ? payload.invoiceId.trim() : undefined;
  const orderNumber = typeof payload.orderNumber === 'string' ? payload.orderNumber.trim() : undefined;
  const paymentMethod = typeof payload.paymentMethod === 'string' ? payload.paymentMethod.trim() : undefined;

  const total =
    typeof payload.total === 'number'
      ? payload.total
      : typeof payload.total === 'string'
        ? Number(payload.total)
        : undefined;

  const orderedAt = typeof payload.orderedAt === 'string' ? payload.orderedAt : undefined;
  const recordedAt = typeof payload.recordedAt === 'string' && payload.recordedAt ? payload.recordedAt : new Date().toISOString();

  return {
    status,
    invoiceId: invoiceId || undefined,
    orderNumber: orderNumber || undefined,
    total: Number.isFinite(total as number) ? (total as number) : undefined,
    orderedAt,
    paymentMethod: paymentMethod || undefined,
    recordedAt,
  };
}

function resultKey(r: PaymentResult): string {
  // Deduplicate identical results (PaymentReturn + PaymentSuccess can fire for same invoice).
  return [
    r.status,
    r.invoiceId || '',
    r.orderNumber || '',
    r.total ?? '',
    r.orderedAt || '',
    r.paymentMethod || '',
  ].join('|');
}

function readFromStorage(storage: Storage | null): PaymentResult[] {
  if (!storage) return [];

  const arr = safeParseJson<unknown>(storage.getItem(HISTORY_KEY));
  if (Array.isArray(arr)) {
    const normalized = arr
      .map((x) => normalizeResult(x as any))
      .filter(Boolean) as PaymentResult[];

    // Newest first
    normalized.sort((a, b) => (b.recordedAt || '').localeCompare(a.recordedAt || ''));
    return normalized;
  }

  // Backward compat
  const last = safeParseJson<unknown>(storage.getItem(LAST_KEY));
  const one = normalizeResult(last as any);
  return one ? [one] : [];
}

function writeToStorage(storage: Storage | null, results: PaymentResult[], last: PaymentResult) {
  if (!storage) return;
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(results));
  } catch {
    // ignore storage failures
  }
  try {
    storage.setItem(
      LAST_KEY,
      JSON.stringify({
        status: last.status,
        invoiceId: last.invoiceId,
        orderNumber: last.orderNumber,
        total: last.total,
        orderedAt: last.orderedAt,
        paymentMethod: last.paymentMethod,
      }),
    );
  } catch {
    // ignore
  }
}

export function readPaymentResults(): PaymentResult[] {
  const local = readFromStorage(safeGetStorage('local'));
  const session = readFromStorage(safeGetStorage('session'));

  if (local.length === 0 && session.length === 0) return [];

  // Merge + dedupe (sessionStorage keeps working in current tab; localStorage persists across restarts)
  const seen = new Set<string>();
  const merged: PaymentResult[] = [];

  for (const r of [...local, ...session]) {
    const key = resultKey(r);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(r);
  }

  merged.sort((a, b) => (b.recordedAt || '').localeCompare(a.recordedAt || ''));

  // Migrate session -> local (best-effort)
  if (local.length === 0 && merged.length > 0) {
    writeToStorage(safeGetStorage('local'), merged, merged[0]);
  }

  return merged;
}

export function appendPaymentResult(
  input: Omit<Partial<PaymentResult>, 'recordedAt'> & { recordedAt?: string },
  max = 20,
) {
  const next = normalizeResult({ ...input, recordedAt: input.recordedAt || new Date().toISOString() });
  if (!next) return;

  const existing = readPaymentResults();
  const key = resultKey(next);
  const filtered = existing.filter((r) => resultKey(r) !== key);
  const updated = [next, ...filtered].slice(0, Math.max(1, max));

  // Write to both: sessionStorage for current-tab immediacy, localStorage for persistence.
  writeToStorage(safeGetStorage('session'), updated, next);
  writeToStorage(safeGetStorage('local'), updated, next);
}
