import { useMemo } from "react";

export default function UploadPanel({ projectName, setProjectName, repoUrl, setRepoUrl, files, setFiles, onGenerate, isGenerating }) {
  const totalBytes = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  const readableSize = useMemo(() => {
    if (!totalBytes) {
      return "0 KB";
    }

    const kb = totalBytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(1)} MB`;
  }, [totalBytes]);

  const handleRemoveFile = (targetName) => {
    setFiles(files.filter((file) => file.name !== targetName));
  };

  return (
    <section className="fade-slide-up relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
      <div className="pointer-events-none absolute left-1/2 top-[-8rem] h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--accent-glow)] blur-3xl orb-pulse" />

      <div className="relative text-center">
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] md:text-[48px]">
          Document your code, instantly.
        </h1>
        <p className="mx-auto mt-3 max-w-[480px] text-sm text-[var(--text-secondary)] md:text-base">
          Paste a GitHub URL or upload source files. Grok AI generates production-ready documentation in seconds.
        </p>
      </div>

      <div className="relative mt-8 grid gap-6 xl:grid-cols-[1fr_auto_1fr]">
        <div className="surface-card p-6">
          <div className="mb-3 flex items-center gap-2 text-[var(--text-primary)]">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M12 .5A12 12 0 0 0 8.2 23c.6.1.8-.2.8-.6v-2.1c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.3 1.8 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.4-1.3-5.4-6A4.8 4.8 0 0 1 6.3 7c-.1-.3-.6-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.2 11.2 0 0 1 6 0C18 3.5 19 3.8 19 3.8c.7 1.7.2 2.9.1 3.2a4.8 4.8 0 0 1 1.3 3.3c0 4.6-2.8 5.7-5.5 6 .4.4.8 1 .8 2.1v3c0 .4.2.7.8.6A12 12 0 0 0 12 .5Z" />
            </svg>
            <p className="text-sm font-semibold">Import from GitHub</p>
          </div>
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Repository URL</label>
          <input
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/user/repo"
            className="input-token h-11 w-full px-3 text-sm"
          />
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || (!repoUrl.trim() && !files.length)}
            className="mt-4 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Generate Docs →
          </button>
        </div>

        <div className="hidden items-center xl:flex">
          <div className="h-px w-10 bg-[var(--border-subtle)]" />
          <span className="mx-3 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">or</span>
          <div className="h-px w-10 bg-[var(--border-subtle)]" />
        </div>

        <div className="surface-card p-6">
          <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Upload source files</p>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-8 text-center hover:border-[var(--accent)] hover:bg-[var(--bg-hover)] hover:scale-[1.01]">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" className="mb-3 text-[var(--text-secondary)]">
              <path d="M12 16V4m0 0 4 4m-4-4-4 4" />
              <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
            <p className="text-sm text-[var(--text-primary)]">Drop files here</p>
            <p className="text-xs text-[var(--text-secondary)]">or click to browse</p>
            <p className="mt-3 rounded-full border border-[var(--border-default)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
              .js .ts .py .go .java
            </p>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
            />
          </label>

          <div className="mt-3 text-xs text-[var(--text-secondary)]">
            {files.length ? `${files.length} file(s) selected • ${readableSize}` : "No files selected"}
          </div>

          {files.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              {files.map((file) => (
                <div key={file.name} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border-subtle)] px-2 py-1 text-xs text-[var(--text-secondary)]">
                  <span className="truncate pr-2">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.name)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative mt-5">
        <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Project name (optional)</label>
        <input
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          placeholder="My project"
          className="input-token h-11 w-full px-3 text-sm"
        />
      </div>

      {isGenerating ? (
        <div className="mt-5 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3">
          <p className="text-sm text-[var(--text-primary)]">Analyzing code... Generating sections... Finalizing docs...</p>
          <div className="progress-indeterminate mt-3 h-1.5 rounded-full bg-[var(--bg-hover)]" />
        </div>
      ) : null}

      <div className="mt-5">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || (!repoUrl.trim() && !files.length)}
          className="w-full rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isGenerating ? "Generating Documentation..." : "Generate Documentation"}
        </button>
      </div>
    </section>
  );
}
