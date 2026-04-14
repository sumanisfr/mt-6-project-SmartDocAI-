import ReactMarkdown from "react-markdown";

const suggestions = [
  "How does auth work?",
  "What are the main exports?",
  "Show me an example"
];

function TypingIndicator() {
  return (
    <div className="message-enter max-w-[90%] self-start rounded-[var(--radius-md)] rounded-bl-[4px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2">
      <div className="flex gap-1.5">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">SmartDocs is thinking...</p>
    </div>
  );
}

export default function ChatPanel({ messages, question, setQuestion, onSend, isSending, project, onClose }) {
  const showEmptyState = messages.length <= 1;

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend(event);
    }
  };

  return (
    <aside className="fade-slide-up flex h-full min-h-[28rem] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
      <div className="flex items-start justify-between border-b border-[var(--border-subtle)] p-4">
        <div className="flex items-start gap-2.5">
          <span className={`mt-1 h-2 w-2 rounded-full ${isSending ? "animate-pulse" : ""}`} style={{ background: "var(--accent)" }} />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Ask anything</p>
            <p className="text-xs text-[var(--text-muted)]">Based on your docs</p>
          </div>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-sm)] border border-[var(--border-default)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {showEmptyState ? (
          <div className="mt-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]">
              ?
            </div>
            <p className="text-sm text-[var(--text-secondary)]">Ask a question about your codebase</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setQuestion(suggestion)}
                  className="rounded-full border border-[var(--border-default)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`message-enter max-w-[90%] px-3 py-2 text-sm ${
              message.role === "user"
                ? "ml-auto rounded-[var(--radius-md)] rounded-br-[4px] bg-[var(--accent)] text-white"
                : "rounded-[var(--radius-md)] rounded-bl-[4px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
            }`}
          >
            {message.role === "assistant" ? (
              <div className="prose prose-invert max-w-none prose-p:my-2 prose-p:text-[var(--text-primary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--accent)]">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap leading-6">{message.content}</p>
            )}
          </div>
        ))}

        {isSending ? <TypingIndicator /> : null}
      </div>

      <form onSubmit={onSend} className="border-t border-[var(--border-subtle)] p-4">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder={project ? "Ask about this docs set..." : "Generate docs first"}
          className="input-token w-full resize-none px-3 py-2.5 text-sm"
          disabled={!project || isSending}
          style={{ maxHeight: "120px" }}
        />

        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={!project || isSending || !question.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m4 12 14-7-3 7 3 7-14-7Z" />
            </svg>
          </button>
        </div>
      </form>
    </aside>
  );
}
