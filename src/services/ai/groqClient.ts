const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_BASE = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_TIMEOUT_MS = 30_000;
const GROQ_MIN_GAP_MS = 2_000;

let lastGroqRequestAt = 0;

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const gap = now - lastGroqRequestAt;
  if (gap < GROQ_MIN_GAP_MS) {
    await new Promise<void>((resolve) =>
      setTimeout(resolve, GROQ_MIN_GAP_MS - gap),
    );
  }
  lastGroqRequestAt = Date.now();
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls Groq chat completions and returns the raw JSON string.
 * Rate-limited to 2 s minimum gap. Retries up to 2× on 429.
 */
export async function callGroqRaw(
  system: string,
  user: string,
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error(
      'EXPO_PUBLIC_GROQ_API_KEY is not set. Check your .env.local file.',
    );
  }

  await enforceRateLimit();

  let lastError: Error = new Error('Groq: unknown error');

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise<void>((r) =>
        setTimeout(r, Math.pow(2, attempt - 1) * 1_000),
      );
    }

    let res: Response;
    try {
      res = await fetchWithTimeout(`${GROQ_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });
    } catch (fetchErr) {
      if ((fetchErr as Error).name === 'AbortError') {
        throw new Error(`Groq request timed out after ${GROQ_TIMEOUT_MS}ms`);
      }
      throw fetchErr;
    }

    if (res.status === 429) {
      lastError = new Error('Groq rate limit exceeded (429)');
      continue; // retry after backoff
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Groq API error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content || content.trim() === '') {
      throw new Error('Groq returned empty content');
    }

    return content;
  }

  throw lastError;
}
