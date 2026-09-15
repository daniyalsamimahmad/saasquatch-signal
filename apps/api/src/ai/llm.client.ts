import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

/**
 * LLM access with graceful degradation:
 *   1. Gemini (free tier) — primary, tried across current model aliases
 *   2. Groq (free tier)  — fallback when Gemini is saturated
 * Both are optional; callers must handle `enabled === false` (demo mode).
 */
@Injectable()
export class LlmClient {
  private readonly logger = new Logger(LlmClient.name);
  private readonly geminiModels = [
    process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-3-flash-preview',
  ];

  get enabled() {
    return !!process.env.GEMINI_API_KEY || !!process.env.GROQ_API_KEY;
  }

  async complete(prompt: string, opts?: { json?: boolean }): Promise<string> {
    if (process.env.GEMINI_API_KEY) {
      for (const model of this.geminiModels) {
        const out = await this.gemini(model, prompt, opts?.json ?? false);
        if (out !== null) return out;
      }
    }
    if (process.env.GROQ_API_KEY) {
      const out = await this.groq(prompt, opts?.json ?? false);
      if (out !== null) return out;
    }
    throw new ServiceUnavailableException(
      'AI providers are unavailable right now — try again in a minute.',
    );
  }

  private async gemini(model: string, prompt: string, json: boolean) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              ...(json ? { responseMimeType: 'application/json' } : {}),
            },
          }),
        },
      );
      const body = (await res.json()) as any;
      const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!res.ok || !text) {
        this.logger.warn(
          `gemini/${model}: ${body?.error?.message?.slice(0, 120) ?? `HTTP ${res.status}`}`,
        );
        return null;
      }
      return text as string;
    } catch (err) {
      this.logger.warn(`gemini/${model} failed: ${err}`);
      return null;
    }
  }

  private async groq(prompt: string, json: boolean) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          ...(json ? { response_format: { type: 'json_object' } } : {}),
        }),
      });
      const body = (await res.json()) as any;
      const text = body?.choices?.[0]?.message?.content;
      if (!res.ok || !text) {
        this.logger.warn(`groq: ${body?.error?.message?.slice(0, 120) ?? `HTTP ${res.status}`}`);
        return null;
      }
      return text as string;
    } catch (err) {
      this.logger.warn(`groq failed: ${err}`);
      return null;
    }
  }
}
