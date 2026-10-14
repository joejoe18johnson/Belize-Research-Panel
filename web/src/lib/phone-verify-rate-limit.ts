import "server-only";

type Bucket = {
  sends: number[];
  checks: number[];
  lastSendAt: number;
};

const buckets = new Map<string, Bucket>();

const SEND_COOLDOWN_MS = 60_000;
const MAX_SENDS_PER_DAY = 8;
const MAX_CHECKS_PER_HOUR = 12;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function getBucket(key: string): Bucket {
  const existing = buckets.get(key);
  if (existing) return existing;
  const created: Bucket = { sends: [], checks: [], lastSendAt: 0 };
  buckets.set(key, created);
  return created;
}

function prune(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((ts) => now - ts < windowMs);
}

export function assertCanSendPhoneCode(accountKey: string): void {
  const now = Date.now();
  const bucket = getBucket(accountKey.toLowerCase());
  bucket.sends = prune(bucket.sends, DAY_MS, now);
  if (bucket.lastSendAt && now - bucket.lastSendAt < SEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((SEND_COOLDOWN_MS - (now - bucket.lastSendAt)) / 1000);
    throw new Error(`Please wait ${waitSec} seconds before requesting another code.`);
  }
  if (bucket.sends.length >= MAX_SENDS_PER_DAY) {
    throw new Error("Too many verification codes requested today. Try again tomorrow.");
  }
}

export function recordPhoneCodeSend(accountKey: string): void {
  const now = Date.now();
  const bucket = getBucket(accountKey.toLowerCase());
  bucket.sends = prune(bucket.sends, DAY_MS, now);
  bucket.sends.push(now);
  bucket.lastSendAt = now;
}

export function assertCanCheckPhoneCode(accountKey: string): void {
  const now = Date.now();
  const bucket = getBucket(accountKey.toLowerCase());
  bucket.checks = prune(bucket.checks, HOUR_MS, now);
  if (bucket.checks.length >= MAX_CHECKS_PER_HOUR) {
    throw new Error("Too many code attempts. Please wait and try again later.");
  }
}

export function recordPhoneCodeCheck(accountKey: string): void {
  const now = Date.now();
  const bucket = getBucket(accountKey.toLowerCase());
  bucket.checks = prune(bucket.checks, HOUR_MS, now);
  bucket.checks.push(now);
}
