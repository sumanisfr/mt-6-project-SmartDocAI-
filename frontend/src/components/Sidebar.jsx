export default function Sidebar({ sections, activeSection, onSelectSection, project, onNewProject }) {
  return (
    <aside className="fade-slide-up flex h-[calc(100vh-9rem)] flex-col overflow-y-auto rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
        <p className="text-sm font-semibold text-[var(--text-primary)]">SmartDocs</p>
      </div>

      <p className="truncate px-2 pt-2 text-xs text-[var(--text-secondary)]">{project?.name || "No active project"}</p>
      <div className="my-3 border-t border-[var(--border-subtle)]" />

      <nav className="space-y-1">
        {sections.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-muted)]">
            Sections will appear after docs generation.
          </div>
        ) : (
          sections.map((section) => {
            const level = Math.max(0, (section.level || 2) - 2);
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelectSection(section.id)}
                className={`group relative flex w-full items-center rounded-[var(--radius-sm)] px-3 py-2 text-left ${
                  isActive
                    ? "bg-[var(--accent-glow)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                }`}
                style={{ paddingLeft: `${12 + level * 12}px` }}
              >
                <span
                  className={`absolute left-0 top-1/2 h-0 -translate-y-1/2 border-l-2 border-[var(--accent)] ${
                    isActive ? "h-6" : "h-0 group-hover:h-6"
                  }`}
                  style={{ transition: "var(--transition)" }}
                />
                <span className={`line-clamp-2 ${level > 0 ? "text-xs" : "text-sm"}`}>{section.title}</span>
              </button>
            );
          })
        )}
      </nav>

      <div className="mt-auto border-t border-[var(--border-subtle)] pt-3">
        <button
          type="button"
          onClick={onNewProject}
          className="w-full rounded-[var(--radius-sm)] px-2 py-2 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        >
          ← New Project
        </button>
        <p className="px-2 pt-2 text-[11px] text-[var(--text-muted)]">Powered by Grok AI</p>
      </div>
    </aside>
  );
}
