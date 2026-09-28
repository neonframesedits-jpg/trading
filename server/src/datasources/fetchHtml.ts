// Thin fetch wrapper for scraping public pages. Not verified against real
// responses from this codebase's origin session — see README "Live data
// pipeline" section for why, and what to check first if this starts failing.

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "FetchError";
  }
}

export function fetchHtml(url: string, timeoutMs = 15000): Promise<string> {
  return fetchText(url, "text/html,application/xhtml+xml", timeoutMs);
}

export async function fetchText(url: string, accept: string, timeoutMs = 15000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: accept,
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new FetchError(`Request to ${url} failed with status ${res.status}`, url, res.status);
    }
    return await res.text();
  } catch (err) {
    if (err instanceof FetchError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new FetchError(`Request to ${url} failed: ${message}`, url);
  } finally {
    clearTimeout(timer);
  }
}
