// components/ChatBox.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Message = {
  id: number;
  role: "user" | "bot";
  text: string;
};

// ── Q&A data ──────────────────────────────────────────────────────────────────

const QA = [
  {
    q: "How does receipt scanning work?",
    a: "Upload a photo or PDF. The OCR model reads vendor, date, total, VAT rate, and line items in under three seconds — even on crumpled or faded paper.",
  },
  {
    q: "Which accounting tools are supported?",
    a: "Fortnox, Visma, and Bokio connect natively. Any other tool works via SIE4 export.",
  },
  {
    q: "Where is my data stored?",
    a: "Encrypted at rest on Swedish servers with seven-year retention — full compliance with Bokföringslagen.",
  },
  {
    q: "What is included in the free plan?",
    a: "50 receipts per month, AI OCR, BAS auto-categorisation, multi-currency, and SIE4 export. No credit card required.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. All plans are month-to-month. Cancel from account settings — access continues to the end of the billing period.",
  },
  {
    q: "Which VAT rates are detected?",
    a: "6 %, 12 %, and 25 % are detected automatically from the receipt — no manual configuration needed.",
  },
  {
    q: "How does BankID sign-off work?",
    a: "Employees use BankID to sign expense submissions. The signed record is stored alongside the receipt for audit purposes.",
  },
  {
    q: "Can I manage a team?",
    a: "Team and Business plans support multiple users with role-based access, per-person spending limits, and a shared approval dashboard.",
  },
] as const;

// ── ID factory (stable module-scope counter) ──────────────────────────────────

let _mid = 0;
const newId = () => ++_mid;

function makeInitialMessages(): Message[] {
  return [
    {
      id: newId(),
      role: "bot",
      text: "Hi — I can answer common questions about Kvittino. Select one below to get started.",
    },
  ];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.18 }}
      className="flex justify-start"
    >
      <div className="rounded-2xl rounded-bl-sm border hairline bg-white/60 px-4 py-3.5 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block h-1.5 w-1.5 rounded-full bg-ink/50"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.16,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-ink text-paper"
            : "rounded-bl-sm border hairline bg-white/60 text-ink shadow-sm backdrop-blur-sm",
        )}
      >
        {message.text}
      </div>
    </motion.div>
  );
}

function IconChat() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ChatBox() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(makeInitialMessages);
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const [typing, setTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new content
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
    return () => clearTimeout(t);
  }, [messages, typing, open]);

  // Badge: set when closing mid-conversation
  useEffect(() => {
    if (!open && asked.size > 0) setHasUnread(true);
  }, [open, asked.size]);

  // Badge: clear on open
  useEffect(() => {
    if (open) setHasUnread(false);
  }, [open]);

  const handleQuestion = useCallback(
    (qa: (typeof QA)[number]) => {
      if (typing) return;
      setAsked((prev) => new Set(prev).add(qa.q));
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "user", text: qa.q },
      ]);
      setTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: newId(), role: "bot", text: qa.a },
        ]);
        setTyping(false);
      }, 950);
    },
    [typing],
  );

  function handleReset() {
    setMessages(makeInitialMessages());
    setAsked(new Set());
    setTyping(false);
  }

  const remaining = QA.filter((qa) => !asked.has(qa.q));
  const visibleSuggestions = remaining.slice(0, 3);
  const overflowCount = remaining.length - 3;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* ── Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            style={{ originX: 1, originY: 1 }}
            className="flex h-[540px] w-[340px] flex-col overflow-hidden rounded-3xl border hairline bg-paper/80 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.22)] backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center gap-3 border-b hairline bg-ink px-5 py-4">
              {/* Pulsing online dot */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper/10">
                <span className="relative flex h-2.5 w-2.5">
                  <motion.span
                    className="absolute inline-flex h-full w-full rounded-full bg-nordic-400"
                    animate={{ scale: [1, 2.4], opacity: [0.55, 0] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-nordic-400" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold leading-tight text-paper">
                  Kvittino Support
                </p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={typing ? "t" : "o"}
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 3 }}
                    transition={{ duration: 0.18 }}
                    className="text-xs text-paper/50"
                  >
                    {typing ? "Typing\u2026" : "Online \u2014 quick answers"}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Reset — visible after first question */}
              <AnimatePresence>
                {asked.size > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                    onClick={handleReset}
                    aria-label="Restart conversation"
                    className="rounded-full p-1.5 text-paper/40 transition hover:bg-paper/10 hover:text-paper/80"
                  >
                    <IconReset />
                  </motion.button>
                )}
              </AnimatePresence>

              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-1.5 text-paper/40 transition hover:bg-paper/10 hover:text-paper/80"
              >
                <IconX />
              </button>
            </div>

            {/* Messages */}
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-5">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              <AnimatePresence>
                {typing && <TypingIndicator key="typing-indicator" />}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Suggestions footer */}
            <div className="shrink-0 border-t hairline bg-gradient-to-b from-paper/30 to-paper/70 px-4 pb-5 pt-3 backdrop-blur-sm">
              <AnimatePresence mode="wait">
                {remaining.length > 0 ? (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <p className="mb-2.5 text-xs font-medium uppercase tracking-[0.12em] text-ink/35">
                      {asked.size === 0 ? "Common questions" : "Keep exploring"}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <AnimatePresence>
                        {visibleSuggestions.map((qa, i) => (
                          <motion.button
                            key={qa.q}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{
                              opacity: 0,
                              x: 14,
                              transition: { duration: 0.12 },
                            }}
                            transition={{ delay: i * 0.05, duration: 0.2 }}
                            onClick={() => handleQuestion(qa)}
                            disabled={typing}
                            className="group w-full rounded-xl border hairline bg-white/40 px-3.5 py-2.5 text-left text-xs leading-snug text-ink/75 backdrop-blur-sm transition-all hover:border-ink/20 hover:bg-white/80 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="flex items-center gap-2">
                              <span className="shrink-0 text-nordic-600 opacity-0 transition group-hover:opacity-100">
                                →
                              </span>
                              {qa.q}
                            </span>
                          </motion.button>
                        ))}
                      </AnimatePresence>
                    </div>
                    {overflowCount > 0 && (
                      <p className="mt-2 text-right text-xs text-ink/30">
                        +{overflowCount} more
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="exhausted"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="py-1 text-center"
                  >
                    <p className="text-xs text-ink/50">All questions answered.</p>
                    <a
                      href="mailto:sales@Kvittino.se"
                      className="mt-2 inline-block rounded-full border hairline px-4 py-1.5 text-xs font-medium text-nordic-600 transition hover:border-nordic-600/40 hover:bg-paper"
                    >
                      Contact us →
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB ── */}
      <div className="relative">
        <AnimatePresence>
          {hasUnread && !open && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              className="absolute -right-1 -top-1 z-10 h-3.5 w-3.5 rounded-full bg-nordic-600 ring-2 ring-paper"
            />
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close chat" : "Open chat"}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.91 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full shadow-[0_8px_24px_-4px_rgba(0,0,0,0.22)] transition-colors",
            open
              ? "bg-nordic-900 text-paper"
              : "bg-ink text-paper hover:bg-nordic-900",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="x"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.14 }}
              >
                <IconX />
              </motion.span>
            ) : (
              <motion.span
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.14 }}
              >
                <IconChat />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}