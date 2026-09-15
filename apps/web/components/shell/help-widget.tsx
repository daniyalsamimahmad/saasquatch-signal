"use client";

import * as React from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = { role: "user" | "assistant"; text: string };

/**
 * Rule-based helper. It answers from a fixed knowledge base about this app;
 * there is no model behind it, which also means it answers instantly and
 * identically every time.
 */
const KNOWLEDGE: Array<{ match: RegExp; answer: string }> = [
  {
    match: /ai search|natural|plain english|prompt|describe/i,
    answer:
      "On Find leads, type who you want in plain English — “CTOs at 50-200 person fintech companies in Texas” — and hit Search with AI. It fills the same filters you see in the left rail, so you can inspect and adjust everything it applied.",
  },
  {
    match: /signal|hiring|funding|news|personali/i,
    answer:
      "Many contacts carry a signal chip — a concrete fact like a funding round or hiring spree. The AI writer opens step-1 emails by citing that signal, which is what makes them read like research instead of a blast.",
  },
  {
    match: /campaign|sequence|step|launch|generate/i,
    answer:
      "Campaigns start from a four-field brief; the AI designs the whole sequence. Add contacts from a list, hit Generate drafts (step 1 is personalized per lead), review, then Launch. Follow-up steps schedule themselves on the queue after the configured wait days.",
  },
  {
    match: /linkedin/i,
    answer:
      "LinkedIn steps become tasks, not automated sends — automation there violates LinkedIn's terms and gets accounts banned. Each task has an AI-drafted message: Copy & open puts it on your clipboard and opens the profile so you send it yourself.",
  },
  {
    match: /valid|verify|bounce|mx|phone number/i,
    answer:
      "The Validate page checks emails (syntax, live MX lookup, disposable domains, role accounts) and phone numbers (format, allocated range, line type). Bulk mode takes up to 25 per batch and exports results as CSV.",
  },
  {
    match: /verified|guessed|badge|email status/i,
    answer:
      "Every contact's email carries a status: a green check means verified, an amber question mark means pattern-guessed, and “No email” is exactly that. Launching a campaign skips contacts without an address instead of bouncing.",
  },
  {
    match: /import|apollo|hunter|enrich|real data|live data/i,
    answer:
      "Import from web (on Find leads) pulls one company's live profile from Apollo by domain — and people with work emails via Hunter when a key is configured. Imports land in the same index as everything else.",
  },
  {
    match: /save|list|undo/i,
    answer:
      "Select rows on Find leads and hit Save to list — into an existing list or a new one on the spot. Lists feed campaigns: open one and use “Add all to campaign”.",
  },
  {
    match: /csv|export|excel|download/i,
    answer:
      "Select rows and hit Export CSV, or export a whole list from its page. Files open cleanly in Excel and are guarded against formula injection.",
  },
  {
    match: /plan|price|pricing|upgrade|pay|billing|subscription/i,
    answer:
      "Your current plan shows in the top bar — click it to compare tiers. Billing in this build is simulated, so switching is instant and nothing is charged.",
  },
  {
    match: /search|find|filter|location|tech stack/i,
    answer:
      "Find leads has People and Companies tabs with a filter rail: titles, seniority, department, email status, industry, location, company size and tech stack. Filters live in the URL, so a search is shareable and the back button just works.",
  },
  {
    match: /brief|tone|writing|voice/i,
    answer:
      "Settings → AI writing brief stores your offer, audience, tone, CTA and words to avoid. Every AI draft — campaign steps, personalized emails, LinkedIn messages — starts from it, so new campaigns prefill instantly.",
  },
  {
    match: /theme|dark|light|appearance/i,
    answer:
      "Use the sun/moon button in the top bar, or pick Light, Dark or System in Settings. Both themes are tuned separately, not auto-inverted.",
  },
  {
    match: /password|profile|name|account|setting/i,
    answer:
      "Settings (bottom of the sidebar) covers your name, password, AI writing brief, integrations and theme. Email stays fixed since it's your sign-in identity.",
  },
  {
    match: /hi|hello|hey|help|what can/i,
    answer:
      "Hi! Ask me about finding leads, AI search, campaigns, LinkedIn tasks, validation, lists, CSV export, or plans. Or tap one of the quick questions below.",
  },
];

const FALLBACK =
  "I don't have a good answer for that yet. I'm a small built-in helper, so try asking about search, campaigns, validation, lists, or plans.";

const QUICK_QUESTIONS = [
  "How does AI search work?",
  "How do campaigns send?",
  "Why are LinkedIn steps manual?",
];

function answerFor(text: string): string {
  for (const entry of KNOWLEDGE) {
    if (entry.match.test(text)) return entry.answer;
  }
  return FALLBACK;
}

export function HelpWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      text: "Hey! I'm the built-in helper. Ask me anything about how this app works.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  const ask = (text: string) => {
    const question = text.trim();
    if (!question) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    // A small delay so the reply reads as a reply, not an echo.
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", text: answerFor(question) }]);
    }, 350);
  };

  return (
    <>
      {open && (
        <div
          className="fixed right-4 bottom-20 z-40 flex h-[440px] w-[340px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border bg-card shadow-lift"
          role="dialog"
          aria-label="Help assistant"
        >
          <div className="flex items-center gap-2 border-b bg-surface-2/50 px-3 py-2.5">
            <LogoMark className="size-5" />
            <div className="flex-1">
              <p className="text-sm font-semibold leading-none">Help</p>
              <p className="mt-0.5 text-[11px] text-text-3">
                Built-in guide, answers instantly
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close help"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>

          <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto p-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-surface-2 text-foreground",
                )}
              >
                {message.text}
              </div>
            ))}
            {messages.length <= 1 && (
              <div className="space-y-1.5 pt-1">
                {QUICK_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => ask(question)}
                    className="block w-full rounded-md border px-2.5 py-1.5 text-left text-xs text-text-2 transition-colors hover:border-brand-500 hover:text-foreground"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="flex items-center gap-2 border-t p-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question"
              className="h-9"
              aria-label="Ask the help assistant"
            />
            <Button type="submit" size="icon" className="size-9 shrink-0" aria-label="Send">
              <Send className="size-4" aria-hidden />
            </Button>
          </form>
        </div>
      )}

      <Button
        size="icon"
        className="fixed right-4 bottom-4 z-40 size-12 rounded-full shadow-lift"
        aria-label={open ? "Close help" : "Open help"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <X className="size-5" aria-hidden />
        ) : (
          <MessageCircle className="size-5" aria-hidden />
        )}
      </Button>
    </>
  );
}
