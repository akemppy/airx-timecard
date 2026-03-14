"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const PIN_LENGTH = 4;

export default function LoginPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const submitPin = useCallback(
    async (pin: string) => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin }),
        });

        if (res.ok) {
          router.push("/");
          router.refresh();
        } else {
          const data = await res.json().catch(() => null);
          setError(data?.error || "Invalid PIN. Please try again.");
          setDigits(Array(PIN_LENGTH).fill(""));
          setTimeout(() => inputRefs.current[0]?.focus(), 50);
        }
      } catch {
        setError("Unable to connect. Please try again.");
        setDigits(Array(PIN_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const handleChange = (index: number, value: string) => {
    // Only allow single digits
    const digit = value.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError("");

    if (digit && index < PIN_LENGTH - 1) {
      // Auto-advance to next input
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (digit && index === PIN_LENGTH - 1) {
      const pin = newDigits.join("");
      if (pin.length === PIN_LENGTH) {
        inputRefs.current[index]?.blur();
        submitPin(pin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back on backspace when current field is empty
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
        e.preventDefault();
      }
    }

    if (e.key === "Enter") {
      const pin = digits.join("");
      if (pin.length === PIN_LENGTH) {
        submitPin(pin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (!pasted) return;

    const newDigits = Array(PIN_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    if (pasted.length === PIN_LENGTH) {
      inputRefs.current[PIN_LENGTH - 1]?.blur();
      submitPin(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, PIN_LENGTH - 1)]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header bar */}
      <div className="bg-[#1F3864] h-2 w-full" />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        {/* Logo / branding */}
        <div className="mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1F3864] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold tracking-tight">AX</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">AirX Timecard</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your PIN to continue</p>
        </div>

        {/* PIN input boxes */}
        <div className="flex gap-3 mb-6">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              disabled={loading}
              aria-label={`PIN digit ${i + 1}`}
              className={`
                w-14 h-16 text-center text-2xl font-semibold rounded-xl
                border-2 outline-none transition-all duration-150
                bg-white shadow-sm
                ${error
                  ? "border-red-400 text-red-600"
                  : "border-slate-200 text-slate-800 focus:border-[#1F3864] focus:ring-2 focus:ring-[#1F3864]/20"
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 text-sm text-red-600 font-medium text-center animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Signing in...</span>
          </div>
        )}

        {/* Help text */}
        <p className="mt-8 text-xs text-slate-400 text-center">
          Contact your administrator if you need a PIN
        </p>
      </div>
    </div>
  );
}
