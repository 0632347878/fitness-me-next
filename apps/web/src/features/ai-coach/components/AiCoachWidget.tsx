"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Icon } from "@/components/fm";
import { useLang } from "@/lib/lang-context";
import { askCoach, type CoachMessage } from "../ai-coach.api";
import s from "./AiCoachWidget.module.css";

const COPY = {
  en: {
    title: "AI Coach",
    status: "Knows your training profile",
    welcome: "Ask me about your workout, exercise technique, recovery, or how to adapt your plan.",
    placeholder: "Ask your coach…",
    send: "Send",
    close: "Close AI coach",
    open: "Open AI coach",
    reset: "New chat",
    thinking: "Thinking…",
    disclaimer: "AI can make mistakes. Stop training if you feel pain.",
    suggestions: ["What should I train today?", "How can I improve recovery?", "Adapt my plan to my equipment"],
  },
  ru: {
    title: "AI-тренер",
    status: "Учитывает ваш тренировочный профиль",
    welcome: "Спросите меня о тренировке, технике упражнений, восстановлении или адаптации плана.",
    placeholder: "Спросите тренера…",
    send: "Отправить",
    close: "Закрыть AI-тренера",
    open: "Открыть AI-тренера",
    reset: "Новый чат",
    thinking: "Думаю…",
    disclaimer: "AI может ошибаться. Прекратите тренировку при боли.",
    suggestions: ["Что тренировать сегодня?", "Как улучшить восстановление?", "Адаптируй план под мой инвентарь"],
  },
} as const;

function Sparkles({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3z" />
      <path d="M18.5 14l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3z" />
      <path d="M5.5 13l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9z" />
    </svg>
  );
}

export function AiCoachWidget() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    function onEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  async function submit(content: string) {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    const userMessage: CoachMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage].slice(-11);
    setMessages(nextMessages);
    setDraft("");
    setError(null);
    setLoading(true);

    try {
      const response = await askCoach(nextMessages, lang);
      const coachMessage: CoachMessage = { role: "assistant", content: response };
      setMessages((current) => [...current, coachMessage].slice(-12));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI coach is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(draft);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit(draft);
    }
  }

  return (
    <div className={s.root}>
      {open && (
        <section className={s.panel} role="dialog" aria-modal="false" aria-label={copy.title}>
          <header className={s.header}>
            <span className={s.coachIcon}><Sparkles size={20} /></span>
            <span className={s.heading}>
              <strong>{copy.title}</strong>
              <small><span className={s.onlineDot} />{copy.status}</small>
            </span>
            <button className={s.reset} type="button" onClick={() => { setMessages([]); setError(null); }}>
              {copy.reset}
            </button>
            <button className={s.iconButton} type="button" onClick={() => setOpen(false)} aria-label={copy.close}>
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className={s.messages} aria-live="polite">
            {messages.length === 0 && (
              <div className={s.welcome}>
                <span className={s.welcomeIcon}><Sparkles size={24} /></span>
                <p>{copy.welcome}</p>
                <div className={s.suggestions}>
                  {copy.suggestions.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => void submit(suggestion)}>{suggestion}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "user" ? s.userRow : s.coachRow}>
                {message.role === "assistant" && <span className={s.messageIcon}><Sparkles size={14} /></span>}
                <p>{message.content}</p>
              </div>
            ))}

            {loading && (
              <div className={s.coachRow}>
                <span className={s.messageIcon}><Sparkles size={14} /></span>
                <p className={s.thinking}><span /><span /><span /><em>{copy.thinking}</em></p>
              </div>
            )}
            {error && <p className={s.error} role="alert">{error}</p>}
            <div ref={endRef} />
          </div>

          <form className={s.composer} onSubmit={onSubmit}>
            <textarea
              ref={inputRef}
              rows={1}
              maxLength={2_000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder={copy.placeholder}
              aria-label={copy.placeholder}
            />
            <button type="submit" disabled={!draft.trim() || loading} aria-label={copy.send}>
              <Icon.ChevRight s={18} c="currentColor" />
            </button>
          </form>
          <p className={s.disclaimer}>{copy.disclaimer}</p>
        </section>
      )}

      <button
        type="button"
        className={s.launcher}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? copy.close : copy.open}
      >
        <Sparkles size={24} />
        <span>{copy.title}</span>
      </button>
    </div>
  );
}
