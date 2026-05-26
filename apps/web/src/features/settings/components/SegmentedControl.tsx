"use client";

import s from "./SegmentedControl.module.css";

interface Option<T extends string> {
  value: T;
  label: string;
  emoji?: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: SegmentedControlProps<T>) {
  return (
    <div className={s.track}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            className={[s.option, active ? s.optionActive : "", disabled ? s.optionDisabled : ""].join(" ")}
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
          >
            {opt.emoji && <span className={s.emoji}>{opt.emoji}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

