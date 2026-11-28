// Shared helpers: polite HTTP within a per-run budget, state files, CSV and dates.
import { gzipSync, gunzipSync } from 'node:zlib';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';

export const IDX = process.env.INDEXER_URL || 'https://mainnet-idx.4160.nodely.dev';
export const ALGOD = process.env.ALGOD_URL || 'https://mainnet-api.4160.nodely.dev';
export const ALGO = 1e6; // microalgos per ALGO

const UA = 'ALGO-Tables/2 (+https://algotables.github.io)';
const GAP_MS = 220; // Nodely's free tier allows bots 5 requests a second

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const budget = {
  started: Date.now(),
  maxMs: Number(process.env.MAX_MINUTES || 14) * 60_000,
  maxBytes: Number(process.env.MAX_MB || 1200) * 1e6,
  bytes: 0,
  requests: 0,
};
export const msLeft = () => budget.maxMs - (Date.now() - budget.started);
// True once the run has used its download allowance or is inside the time reserve.
export const spent = (reserveMs = 0) => budget.bytes >= budget.maxBytes || msLeft() <= reserveMs;

let nextSlot = 0;
export async function getJSON(url, { allow = [] } = {}) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    const wait = nextSlot - Date.now();
    if (wait > 0) await sleep(wait);
    nextSlot = Date.now() + GAP_MS;
    budget.requests++;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(45_000),
      });
      const text = await res.text();
      budget.bytes += text.length;
      if (res.ok) return JSON.parse(text);
      if (allow.includes(res.status)) return null;
      lastError = new Error(`HTTP ${res.status} ${text.slice(0, 160)}`);
      if (res.status < 500 && res.status !== 429) break; // retrying won't help
    } catch (error) {
      lastError = error;
    }
    await sleep(1500 * 2 ** attempt);
  }
  throw new Error(`${url.split('?')[0]} failed: ${lastError?.message}`);
}

export async function readState(path, fallback) {
  if (!existsSync(path)) return fallback;
  const buf = await readFile(path);
  return JSON.parse((path.endsWith('.gz') ? gunzipSync(buf) : buf).toString('utf8'));
}

export async function writeOut(path, data) {
  await mkdir(dirname(path), { recursive: true });
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  await writeFile(path, path.endsWith('.gz') ? gzipSync(body) : body);
}

export function toCSV(rows, columns) {
  const cell = (value) => {
    if (value == null || (typeof value === 'number' && !Number.isFinite(value))) return '';
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [columns.join(','), ...rows.map((row) => columns.map((c) => cell(row[c])).join(','))].join('\n') + '\n';
}

export const utcDay = (unixSeconds) => new Date(unixSeconds * 1000).toISOString().slice(0, 10);
export const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
