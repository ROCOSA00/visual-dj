"use client";

import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Popover } from "./Popover";
import { Tooltip } from "./Tooltip";

/* ---------------------------------- Field --------------------------------- */

export function FieldLabel({
  label,
  hint,
  htmlFor,
  onReset,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  onReset?: () => void;
  children?: React.ReactNode;
}) {
  const text = (
    <label htmlFor={htmlFor} className="cursor-default select-none text-xs font-medium text-muted">
      {label}
    </label>
  );
  return (
    <div className="group/label flex min-h-5 items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        {hint ? <Tooltip content={hint}>{text}</Tooltip> : text}
        {onReset && (
          <Tooltip content="Reset to default">
            <button
              type="button"
              onClick={onReset}
              className="text-subtle opacity-0 transition-opacity hover:text-ink group-hover/label:opacity-100"
              aria-label={`Reset ${label}`}
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}

/* --------------------------------- Slider --------------------------------- */

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
  defaultValue?: number;
  /** Display multiplier, e.g. 100 to show 0..1 as a percentage. */
  displayScale?: number;
  decimals?: number;
  onChange: (value: number) => void;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  hint,
  defaultValue,
  displayScale = 1,
  decimals,
  onChange,
}: SliderProps) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const fill = ((value - min) / (max - min)) * 100;
  const places = decimals ?? (step < 0.1 && displayScale === 1 ? 2 : step < 1 && displayScale === 1 ? 1 : 0);
  const display = (value * displayScale).toFixed(places);

  const commitDraft = () => {
    const n = parseFloat(draft);
    if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n / displayScale)));
    setEditing(false);
  };

  return (
    <div className="space-y-1.5">
      <FieldLabel
        label={label}
        hint={hint}
        htmlFor={id}
        onReset={defaultValue !== undefined && Math.abs(defaultValue - value) > 1e-6 ? () => onChange(defaultValue) : undefined}
      >
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitDraft();
              if (e.key === "Escape") setEditing(false);
            }}
            className="h-5 w-14 rounded border border-accent/50 bg-surface-3 px-1 text-right font-mono text-[11px] text-ink outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(display);
              setEditing(true);
            }}
            className="rounded px-1 font-mono text-[11px] tabular-nums text-ink/80 hover:bg-white/[0.06] hover:text-ink"
            aria-label={`Edit ${label} value`}
          >
            {display}
            {unit}
          </button>
        )}
      </FieldLabel>
      <input
        id={id}
        type="range"
        className="vd-range w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

/* -------------------------------- Segmented ------------------------------- */

export interface SegmentOption<T> {
  value: T;
  label?: string;
  icon?: React.ReactNode;
  tooltip?: string;
}

export function Segmented<T extends string | number | boolean>({
  value,
  options,
  onChange,
  size = "md",
  className,
  ariaLabel,
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("flex gap-0.5 rounded-lg border border-line bg-black/30 p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        const btn = (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label ?? o.tooltip}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-all",
              size === "sm" ? "h-6 px-2 text-[11px]" : "h-7 px-2.5 text-xs",
              active ? "bg-white/[0.11] text-ink shadow-[0_1px_0_rgb(255_255_255/0.08)_inset]" : "text-muted hover:text-ink",
            )}
          >
            {o.icon}
            {o.label && <span className="truncate">{o.label}</span>}
          </button>
        );
        return o.tooltip ? (
          <Tooltip key={String(o.value)} content={o.tooltip}>
            {btn}
          </Tooltip>
        ) : (
          btn
        );
      })}
    </div>
  );
}

/* --------------------------------- Toggle --------------------------------- */

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}) {
  const sw = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-all duration-200 disabled:opacity-40",
        checked ? "border-transparent bg-brand-strong shadow-[0_0_12px_-2px_rgb(139_92_246/0.8)]" : "border-line-strong bg-white/[0.06]",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow transition-all duration-200",
          checked ? "left-[18px]" : "left-[2px] bg-white/70",
        )}
      />
    </button>
  );
  if (!label) return sw;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink/90">{label}</p>
        {description && <p className="mt-0.5 text-2xs leading-relaxed text-subtle">{description}</p>}
      </div>
      {sw}
    </div>
  );
}

/* --------------------------------- Select --------------------------------- */

export interface SelectOption<T> {
  value: T;
  label: string;
  description?: string;
  preview?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  className,
  ariaLabel,
  renderValue,
  maxHeight = 300,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
  renderValue?: (option: SelectOption<T> | undefined) => React.ReactNode;
  maxHeight?: number;
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <button
        ref={anchor}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-line bg-black/30 px-2.5 text-left text-xs text-ink transition-colors hover:border-line-strong",
          open && "border-accent/50",
          className,
        )}
      >
        <span className="truncate" style={current?.style}>
          {renderValue ? renderValue(current) : current?.label}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-subtle transition-transform", open && "rotate-180")} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={anchor} width="anchor">
        <div role="listbox" className="overflow-y-auto" style={{ maxHeight }}>
          {options.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
                o.value === value ? "bg-accent/15 text-ink" : "text-ink/85 hover:bg-white/[0.06]",
              )}
            >
              {o.preview}
              <span className="min-w-0 flex-1">
                <span className="block truncate" style={o.style}>
                  {o.label}
                </span>
                {o.description && <span className="block truncate text-2xs text-subtle">{o.description}</span>}
              </span>
              {o.value === value && <Check className="h-3.5 w-3.5 shrink-0 text-accent-soft" />}
            </button>
          ))}
        </div>
      </Popover>
    </>
  );
}

/* ------------------------------ Text inputs ------------------------------- */

export function TextInput({
  value,
  onChange,
  placeholder,
  className,
  multiline,
  maxLength,
  ariaLabel,
  autoFocus,
  onEnter,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  maxLength?: number;
  ariaLabel?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  const cls = cn(
    "w-full rounded-lg border border-line bg-black/30 px-2.5 text-[13px] text-ink placeholder:text-subtle outline-none transition-colors hover:border-line-strong focus:border-accent/60 focus:bg-black/40",
    multiline ? "min-h-[64px] resize-y py-2 leading-snug" : "h-9",
    className,
  );
  return multiline ? (
    <textarea
      aria-label={ariaLabel}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cls}
      autoFocus={autoFocus}
    />
  ) : (
    <input
      aria-label={ariaLabel}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onEnter?.();
      }}
      className={cls}
      autoFocus={autoFocus}
    />
  );
}

/** Inline editable text (project name, scene and layer names). */
export function InlineEdit({
  value,
  onCommit,
  className,
  inputClassName,
  ariaLabel,
  editing: controlledEditing,
  onEditingChange,
}: {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
}) {
  const [localEditing, setLocalEditing] = useState(false);
  const editing = controlledEditing ?? localEditing;
  const setEditing = (v: boolean) => {
    setLocalEditing(v);
    onEditingChange?.(v);
  };
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  if (editing) {
    return (
      <input
        autoFocus
        aria-label={ariaLabel}
        value={draft}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft.trim() && draft !== value) onCommit(draft.trim());
          setEditing(false);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn(
          "min-w-0 rounded-md border border-accent/60 bg-black/50 px-1.5 text-ink outline-none",
          inputClassName,
        )}
      />
    );
  }
  return (
    <button
      type="button"
      onDoubleClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "F2") setEditing(true);
      }}
      className={cn("min-w-0 truncate text-left", className)}
      title="Double-click to rename"
    >
      {value}
    </button>
  );
}
