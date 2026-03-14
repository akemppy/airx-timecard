"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Send } from "lucide-react";

export default function QueryPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);

  const handleQuery = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer || "No results found.");
      setHistory((prev) => [{ q: question, a: data.answer || "No results" }, ...prev]);
      setQuestion("");
    } catch {
      setAnswer("Query failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "How many hours on ductwork at Echo Glen?",
    "What's our average install time per RTU?",
    "Show me all jobs where controls went over budget",
    "Who logged the most hours this week?",
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1F3864] text-white px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Productivity Query</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <Card className="p-4">
          <Textarea
            placeholder="Ask a question about your timecard data..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[80px] mb-3"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleQuery();
              }
            }}
          />
          <Button
            onClick={handleQuery}
            disabled={loading || !question.trim()}
            className="w-full bg-[#1F3864] hover:bg-[#2a4a80]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Ask
          </Button>
        </Card>

        {!answer && history.length === 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Try asking:</p>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuestion(s)}
                  className="block w-full text-left p-3 bg-white rounded-lg border text-sm text-slate-600 hover:bg-slate-50 transition"
                >
                  &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {answer && (
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-500 mb-2">Answer</h3>
            <div className="text-sm text-slate-700 whitespace-pre-wrap">{answer}</div>
          </Card>
        )}

        {history.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500">History</h3>
            {history.slice(0, 10).map((h, i) => (
              <Card key={i} className="p-3">
                <p className="text-xs font-medium text-slate-800 mb-1">{h.q}</p>
                <p className="text-xs text-slate-600 whitespace-pre-wrap">{h.a}</p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
