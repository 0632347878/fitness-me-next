"use client";

import { useState } from "react";
import { updateSessionNotes } from "../workouts.api";
import { useLang } from "@/lib/lang-context";
import styles from "./NoteModal.module.css";

interface NoteModalProps {
  sessionId: string;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}

export function NoteModal({ sessionId, value, onChange, onClose }: NoteModalProps) {
  const { lang } = useLang();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try { await updateSessionNotes(sessionId, value); } catch {}
    setSaving(false);
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle}>
          <div className={styles.handleBar} />
        </div>
        <p className={styles.label}>
          {lang === "ru" ? "Заметка" : "Note"}
        </p>
        <textarea
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          rows={3}
          placeholder={lang === "ru" ? "Добавьте заметку к упражнению…" : "Add a note to this exercise…"}
        />
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? "…" : lang === "ru" ? "Сохранить" : "Save"}
        </button>
      </div>
    </div>
  );
}

