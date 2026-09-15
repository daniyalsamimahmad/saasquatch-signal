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
    match: /confiden|band|score|percent|%|block/i,
    answer:
      "Every search gets a confidence score. 85% and above applies automatically, 60–84% applies with a flag, and below 60% the search is blocked so you never get confidently wrong results. Click “Why this match?” on any result page to see the full derivation.",
  },
  {
    match: /naics|taxonom|industr|categor/i,
    answer:
      "Industries here are canonical: 291 raw strings from the source data were cleaned, spell-corrected and collapsed into 32 categories, each mapped to a real NAICS code. Try the Resolver Playground in the sidebar to watch it work on any text you type.",
  },
  {
    match: /typo|spell|misspell|correct/i,
    answer:
      "Type industries however they come out. The resolver fixes typos before matching, so try “computr software” in the search and watch the correction chip appear.",
  },
  {
    match: /save|list|undo/i,
    answer:
      "Select rows on any results page and hit “Save to list”. You can add to an existing list or create one on the spot, and the toast has an Undo that removes exactly what that save added.",
  },
  {
    match: /outreach|draft|email|compose|context point/i,
    answer:
      "Select companies and click “Draft outreach”, or use “Draft outreach for all” on a list. Each draft arrives with three context points written from the lead's own data — industry, size and location. Edit anything, hit Regenerate for another take, then copy the email out.",
  },
  {
    match: /csv|export|excel|download/i,
    answer:
      "Select rows and hit Export CSV, or export a whole list from its page. Files open cleanly in Excel, and the stored raw industry string is included next to the resolved one.",
  },
  {
    match: /plan|price|pricing|upgrade|pay|billing|subscription/i,
    answer:
      "Your current plan shows in the top bar — click it to compare tiers. A quick note: billing in this build is simulated, so upgrading is instant and nothing is charged.",
  },
  {
    match: /search|find|filter|location|refine/i,
    answer:
      "Pick an industry and a metro, then hit Find companies. The Refine section adds employee range, revenue band, founded year and a keyword. Typos in the industry box are fine — the resolver handles them.",
  },
  {
    match: /keyboard|shortcut|escape|accessib/i,
    answer:
      "The pickers are fully keyboard-driven: type to filter, arrows to move, Enter to select, Escape to close. Everything in the app is reachable by Tab.",
  },
  {
    match: /theme|dark|light|appearance/i,
    answer:
      "Use the sun/moon button in the top bar, or pick Light, Dark or System in Settings. Both themes are tuned separately, not auto-inverted.",
  },
  {
    match: /password|profile|name|account|setting/i,
    answer:
      "Settings (bottom of the sidebar) covers your name, password and theme. Email stays fixed since it's your sign-in identity.",
  },
  {
    match: /hi|hello|hey|help|what can/i,
    answer:
      "Hi! Ask me about searching, confidence bands, saving lists, outreach drafts, CSV export, or plans. Or tap one of the quick questions below.",
  },
];

const FALLBACK =
  "I don't have a good answer for that yet. I'm a small built-in helper, so try asking about search, confidence, lists, outreach, or plans.";

const QUICK_QUESTIONS = [
  "What do the confidence bands mean?",
  "How do I save companies to a list?",
  "How does outreach prefill work?",
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
