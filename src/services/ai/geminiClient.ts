const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_TIMEOUT_MS = 30_000;
const GEMINI_MIN_GAP_MS = 4_000;

let lastGeminiRequestAt = 0;

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const gap = now - lastGeminiRequestAt;
  if (gap < GEMINI_MIN_GAP_MS) {
    await new Promise<void>((resolve) =>
      setTimeout(resolve, GEMINI_MIN_GAP_MS - gap),
    );
  }
  lastGeminiRequestAt = Date.now();
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls Gemini generateContent and returns the raw JSON string.
 * Rate-limited to 4 s minimum gap. Retries up to 2× on 429.
 */
export async function callGeminiRaw(
  system: string,
  user: string,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'EXPO_PUBLIC_GEMINI_API_KEY is not set. Check your .env.local file.',
    );
  }

  await enforceRateLimit();

  let lastError: Error = new Error('Gemini: unknown error');

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise<void>((r) =>
        setTimeout(r, Math.pow(2, attempt - 1) * 1_500),
      );
    }

    const url = `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    let res: Response;
    try {
      res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ parts: [{ text: user }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      });
    } catch (fetchErr) {
      if ((fetchErr as Error).name === 'AbortError') {
        throw new Error(`Gemini request timed out after ${GEMINI_TIMEOUT_MS}ms`);
      }
      throw fetchErr;
    }

    if (res.status === 429) {
      lastError = new Error('Gemini rate limit exceeded (429)');
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Gemini API error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content || content.trim() === '') {
      throw new Error('Gemini returned empty content');
    }

    return content;
  }

  throw lastError;
}
