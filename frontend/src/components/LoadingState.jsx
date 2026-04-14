import { useEffect, useState } from "react";

const messages = [
  "Analyzing code...",
  "Generating sections...",
  "Finalizing docs..."
];

export default function LoadingState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="fade-slide-up relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.03) 45%, transparent 70%)",
          animation: "progressIndeterminate 1.8s infinite linear"
        }}
      />
      <p className="relative text-sm text-[var(--text-primary)]">{messages[index]}</p>
      <div className="progress-indeterminate relative mt-4 h-1.5 rounded-full bg-[var(--bg-hover)]" />
    </div>
  );
}
