const ZAI_ENDPOINT =
  process.env.ZAI_ENDPOINT || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const MODEL_NAME = process.env.ZAI_MODEL || 'glm-4.5-flash';

export interface ZAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ZAIChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface ZAIChatResult {
  content: string;
  tokens: number;
  model: string;
}

export function isAIConfigured(): boolean {
  const key = process.env.ZAI_API_KEY;
  return Boolean(key && key.trim().length > 0 && key.includes('.'));
}

/**
 * GLM-4.5 supports a "thinking" step (chain-of-thought). For short marketing
 * copy we disable it — same final answer, roughly 80% fewer tokens.
 */
export async function chatComplete(
  messages: ZAIMessage[],
  options: ZAIChatOptions = {}
): Promise<ZAIChatResult> {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) {
    throw new Error('ZAI_API_KEY is not set');
  }
  const model = options.model || MODEL_NAME;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.8,
    max_tokens: options.maxTokens ?? 2000,
    thinking: { type: 'disabled' },
  };

  const res = await fetch(ZAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errMsg = `ZAI API HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      const inner = errBody?.error;
      if (inner?.message) errMsg = String(inner.message);
      if (inner?.code) errMsg += ` (code ${inner.code})`;
    } catch {
      errMsg = `ZAI API HTTP ${res.status} ${res.statusText}`;
    }
    const e = new Error(errMsg) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
    model?: string;
  };

  const content: string = data?.choices?.[0]?.message?.content ?? '';
  const tokens: number =
    data?.usage?.total_tokens ?? Math.ceil(content.length / 4);

  return { content: content.trim(), tokens, model: data?.model || model };
}
