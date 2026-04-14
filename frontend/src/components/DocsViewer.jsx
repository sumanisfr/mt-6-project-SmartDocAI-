import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toText(children) {
  return Array.isArray(children)
    ? children.map((child) => (typeof child === "string" ? child : "")).join("")
    : String(children || "");
}

function CodeBlock({ inline, className, children }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "text";
  const value = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[0.9em] text-[var(--text-primary)]">
        {children}
      </code>
    );
  }

  return (
    <div className="my-5 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs">
        <span className="font-mono text-[var(--text-muted)]">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          style={copied ? { color: "var(--success)" } : undefined}
        >
          {copied ? (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m5 13 4 4L19 7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <rect x="4" y="4" width="11" height="11" rx="2" />
            </svg>
          )}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-[1.7] text-[var(--text-primary)]">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function Heading({ level, children }) {
  const text = toText(children);
  const id = slugify(text);
  const Tag = `h${level}`;

  const cls = {
    1: "mb-2 border-b border-[var(--border-subtle)] pb-3 text-[32px] font-semibold text-[var(--text-primary)]",
    2: "mt-10 text-[22px] font-medium text-[var(--text-primary)]",
    3: "mt-6 text-[16px] font-medium text-[var(--text-secondary)]"
  };

  return (
    <Tag id={id} className={cls[level] || cls[3]}>
      {children}
    </Tag>
  );
}

export default function DocsViewer({ markdown }) {
  if (!markdown) {
    return (
      <div className="flex h-full items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] p-10 text-center text-[var(--text-secondary)]">
        Generate documentation to start reading here.
      </div>
    );
  }

  return (
    <article className="fade-slide-up mx-auto w-full max-w-[860px] prose prose-invert prose-p:text-[15px] prose-p:leading-[1.75] prose-p:text-[var(--text-secondary)] prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline prose-strong:text-[var(--text-primary)] prose-li:text-[var(--text-secondary)] prose-blockquote:border-l-[3px] prose-blockquote:border-[var(--accent)] prose-blockquote:text-[var(--text-muted)] prose-blockquote:italic prose-hr:border-[var(--border-subtle)] prose-table:w-full prose-th:bg-[var(--bg-surface)] prose-th:text-[var(--text-primary)] prose-td:border prose-td:border-[var(--border-subtle)] prose-th:border prose-th:border-[var(--border-subtle)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          h1: ({ children }) => <Heading level={1}>{children}</Heading>,
          h2: ({ children }) => <Heading level={2}>{children}</Heading>,
          h3: ({ children }) => <Heading level={3}>{children}</Heading>
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
