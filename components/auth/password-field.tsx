"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFieldClassName } from "@/components/auth/auth-page-shell";
import { cn } from "@/lib/utils";

export function PasswordField({
  id = "password",
  name = "password",
  autoComplete,
  minLength,
  required = true,
  invalid = false,
  describedBy,
  error,
  hint,
}: {
  id?: string;
  name?: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  error?: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  const messageId = error ? describedBy ?? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>Password</Label>
        <button
          type="button"
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
        >
          <span className="inline-flex items-center gap-1">
            {visible ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
            {visible ? "Hide" : "Show"}
          </span>
        </button>
      </div>
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={messageId}
        className={cn(authFieldClassName, "pr-3")}
      />
      {error ? (
        <p id={messageId} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
