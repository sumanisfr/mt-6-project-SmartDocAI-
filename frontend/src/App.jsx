import { useEffect, useMemo, useState } from "react";
import { askQuestion, createDocumentation, getProject, getProjectChatHistory } from "./api/client.js";
import UploadPanel from "./components/UploadPanel.jsx";
import Sidebar from "./components/Sidebar.jsx";
import DocsViewer from "./components/DocsViewer.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import LoadingState from "./components/LoadingState.jsx";

const welcomeMessage = {
  role: "assistant",
  content: "Upload a project or GitHub repo, then generate docs to start chatting about the codebase."
};

const ACTIVE_PROJECT_KEY = "smartdocai.activeProjectId";

const DEFAULT_DOCUMENTATION = `# Smart Documentation Platform

## Product Overview
Smart Documentation Platform helps engineering teams generate, read, and chat with technical docs from source code and repositories.

### Core capabilities
- Generate structured docs from uploaded files or a GitHub repository.
- Navigate sections quickly from a dedicated sidebar.
- Ask contextual questions in the integrated chat panel.

## Quick Start
1. Enter a project name.
2. Add a GitHub repo URL or upload source files.
3. Click **Generate Documentation**.
4. Explore sections and ask questions in chat.

## Suggested Workflow
### For new projects
- Start with architecture and setup docs.
- Validate generated sections and regenerate when needed.

### For existing projects
- Ingest a repository URL.
- Use chat to answer onboarding and maintenance questions.

## Platform Notes
- Generated documentation replaces this default guide once a project is created.
- Use **New Project** in the sidebar to reset and return to this baseline view.
`;

function buildSectionsFromMarkdown(markdown) {
  const sections = [];
  const usedIds = new Map();

  for (const line of markdown.split("\n")) {
    const match = line.match(/^##\s+(.+)/);
    if (!match) {
      continue;
    }

    const title = match[1].trim();
    const baseId = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") || "section";

    const seenCount = usedIds.get(baseId) || 0;
    usedIds.set(baseId, seenCount + 1);

    sections.push({
      id: seenCount ? `${baseId}-${seenCount + 1}` : baseId,
      title
    });
  }

  return sections;
}

const DEFAULT_SECTIONS = buildSectionsFromMarkdown(DEFAULT_DOCUMENTATION);

function hydrateMessages(chatHistory) {
  const messages = [welcomeMessage];

  for (const exchange of chatHistory || []) {
    if (exchange.question) {
      messages.push({ role: "user", content: exchange.question });
    }

    if (exchange.answer) {
      messages.push({ role: "assistant", content: exchange.answer });
    }
  }

  return messages;
}

export default function App() {
  const [projectName, setProjectName] = useState("Smart Documentation Platform");
  const [repoUrl, setRepoUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [project, setProject] = useState(null);
  const [documentation, setDocumentation] = useState(DEFAULT_DOCUMENTATION);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [activeSection, setActiveSection] = useState(DEFAULT_SECTIONS[0]?.id || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([welcomeMessage]);
  const [error, setError] = useState("");
  const [isRestoring, setIsRestoring] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  const isDesktop = viewportWidth >= 1280;
  const isTablet = viewportWidth >= 1024 && viewportWidth < 1280;
  const isDrawerLayout = viewportWidth < 1024;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const restoreProject = async () => {
      const projectId = window.localStorage.getItem(ACTIVE_PROJECT_KEY);

      if (!projectId) {
        setIsRestoring(false);
        return;
      }

      try {
        const [projectResponse, historyResponse] = await Promise.all([
          getProject(projectId),
          getProjectChatHistory(projectId)
        ]);

        setProject(projectResponse.project);
        setDocumentation(projectResponse.project.documentation || "");
        setSections(projectResponse.project.sections || []);
        setActiveSection(projectResponse.project.sections?.[0]?.id || "");
        setMessages(hydrateMessages(historyResponse.chatHistory));
      } catch {
        window.localStorage.removeItem(ACTIVE_PROJECT_KEY);
        setProject(null);
        setDocumentation(DEFAULT_DOCUMENTATION);
        setSections(DEFAULT_SECTIONS);
        setActiveSection(DEFAULT_SECTIONS[0]?.id || "");
        setMessages([welcomeMessage]);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreProject();
  }, []);

  useEffect(() => {
    if (sections.length && !activeSection) {
      setActiveSection(sections[0].id);
    }
  }, [sections, activeSection]);

  useEffect(() => {
    if (isDesktop) {
      setChatOpen(false);
      setSidebarOpen(false);
      setHasUnreadChat(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    const latest = messages[messages.length - 1];

    if (!latest || latest.role !== "assistant") {
      return;
    }

    if (!isDesktop && !chatOpen) {
      setHasUnreadChat(true);
    }
  }, [messages, chatOpen, isDesktop]);

  const sectionLookup = useMemo(() => new Map(sections.map((section) => [section.id, section])), [sections]);

  const handleGenerate = async () => {
    if (!repoUrl.trim() && files.length === 0) {
      setError("Add at least one file or a GitHub repository URL.");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const response = await createDocumentation({
        projectName,
        repoUrl: repoUrl.trim(),
        files
      });

      setProject(response.project);
      setDocumentation(response.project.documentation);
      setSections(response.project.sections || []);
      setActiveSection(response.project.sections?.[0]?.id || "");
      window.localStorage.setItem(ACTIVE_PROJECT_KEY, response.project.id);
      setMessages([
        welcomeMessage,
        {
          role: "assistant",
          content: `Documentation generated for **${response.project.name}**. Ask a question in the right panel.`
        }
      ]);
    } catch (generationError) {
      setError(generationError.message || "Failed to generate documentation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();

    if (!project || !question.trim()) {
      return;
    }

    const nextQuestion = question.trim();
    setQuestion("");
    setIsSending(true);
    setError("");
    setMessages((current) => [...current, { role: "user", content: nextQuestion }]);

    try {
      const response = await askQuestion(project.id, nextQuestion);
      setMessages((current) => [...current, { role: "assistant", content: response.answer }]);
    } catch (chatError) {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: chatError.message || "Unable to answer that question right now." }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetProject = () => {
    window.localStorage.removeItem(ACTIVE_PROJECT_KEY);
    setProject(null);
    setDocumentation(DEFAULT_DOCUMENTATION);
    setSections(DEFAULT_SECTIONS);
    setActiveSection(DEFAULT_SECTIONS[0]?.id || "");
    setMessages([welcomeMessage]);
    setQuestion("");
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);

    if (isDrawerLayout) {
      setSidebarOpen(false);
    }

    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const activeSectionTitle = activeSection ? sectionLookup.get(activeSection)?.title : "Overview";
  const gridTemplateColumns = isDesktop ? "240px minmax(0,1fr) 320px" : isTablet ? "240px minmax(0,1fr)" : "1fr";

  return (
    <div className="min-h-screen text-[var(--text-primary)]">
      <main className="relative mx-auto flex min-h-screen max-w-[1800px] flex-col gap-5 p-4 lg:p-6">
        <header className="fade-slide-up rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-[var(--text-muted)]">SmartDocs Platform</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
                Document your codebase in minutes.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] md:text-base">
                Generate clean docs, navigate sections instantly, and ask contextual questions from one focused workspace.
              </p>
            </div>
          </div>
        </header>

        <UploadPanel
          projectName={projectName}
          setProjectName={setProjectName}
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          files={files}
          setFiles={setFiles}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        {error ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        <div className="grid flex-1 gap-5" style={{ gridTemplateColumns }}>
          {isDesktop || isTablet ? (
            <Sidebar
              sections={sections}
              activeSection={activeSection}
              onSelectSection={scrollToSection}
              project={project}
              onNewProject={handleResetProject}
            />
          ) : null}

          <section className="fade-slide-up flex min-h-[42rem] flex-col rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-base)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 px-4 py-3 backdrop-blur md:px-6">
              <div className="flex items-center gap-3">
                {isDrawerLayout ? (
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-[var(--radius-sm)] border border-[var(--border-default)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M3 12h18M3 18h18" />
                    </svg>
                  </button>
                ) : null}
                <div>
                  <p className="text-xs text-[var(--text-muted)]">SmartDocs / {project?.name || "Project"}</p>
                  <h2 className="text-base font-semibold md:text-lg">{activeSectionTitle}</h2>
                </div>
              </div>
            </div>

            <div className="h-[calc(100vh-13rem)] overflow-y-auto px-4 py-6 md:px-6">
              {isGenerating || isRestoring ? <LoadingState /> : <DocsViewer markdown={documentation} />}
            </div>
          </section>

          {isDesktop ? (
            <ChatPanel
              messages={messages}
              question={question}
              setQuestion={setQuestion}
              onSend={handleSend}
              isSending={isSending}
              project={project}
            />
          ) : null}
        </div>

        {!isDesktop ? (
          <button
            type="button"
            onClick={() => {
              setChatOpen(true);
              setHasUnreadChat(false);
            }}
            className="fixed bottom-6 right-6 z-30 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[0_4px_20px_var(--accent-glow)] hover:bg-[var(--accent-hover)]"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H6l-3 3V12A8.5 8.5 0 1 1 21 12Z" />
            </svg>
            {hasUnreadChat ? (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
            ) : null}
          </button>
        ) : null}

        {isDrawerLayout && sidebarOpen ? (
          <div className="fixed inset-0 z-40 bg-black/45" onClick={() => setSidebarOpen(false)}>
            <div className="h-full w-[min(86vw,320px)]" onClick={(event) => event.stopPropagation()}>
              <Sidebar
                sections={sections}
                activeSection={activeSection}
                onSelectSection={scrollToSection}
                project={project}
                onNewProject={handleResetProject}
              />
            </div>
          </div>
        ) : null}

        {!isDesktop && chatOpen ? (
          <div className="fixed inset-0 z-40 bg-black/45" onClick={() => setChatOpen(false)}>
            <div
              className={`absolute ${viewportWidth < 768 ? "bottom-0 left-0 right-0 h-[76vh]" : "bottom-4 right-4 h-[78vh] w-[min(420px,92vw)]"}`}
              onClick={(event) => event.stopPropagation()}
            >
              <ChatPanel
                messages={messages}
                question={question}
                setQuestion={setQuestion}
                onSend={handleSend}
                isSending={isSending}
                project={project}
                onClose={() => setChatOpen(false)}
              />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
