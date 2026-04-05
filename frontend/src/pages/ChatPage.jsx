import { useState, useEffect, useRef } from 'react';
import { Bot, MoreHorizontal, Plus, Trash2, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function groupThreadsByDate(threads) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const groups = { today: [], yesterday: [], week: [], older: [] };

  threads.forEach((t) => {
    const d = new Date(t.creationDate || t.createdAt || t.updatedAt);
    if (d >= today) groups.today.push(t);
    else if (d >= yesterday) groups.yesterday.push(t);
    else if (d >= weekAgo) groups.week.push(t);
    else groups.older.push(t);
  });

  return groups;
}

export default function ChatPage() {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [chats, setChats] = useState([]);
  const [input, setInput] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingChats, setLoadingChats] = useState(false);
  const [sending, setSending] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  // ---- Threads ----

  const fetchThreads = async () => {
    try {
      const res = await api.get('/threads');
      setThreads(res.data);
    } catch {
      /* silently fail */
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const handleNewThread = async () => {
    try {
      const res = await api.post('/threads', { title: 'New Chat' });
      setThreads((prev) => [res.data, ...prev]);
      setActiveThreadId(res.data._id);
      setChats([]);
    } catch {
      /* silently fail */
    }
  };

  const handleDeleteThread = async (id) => {
    try {
      await api.delete(`/threads/${id}`);
      setThreads((prev) => prev.filter((t) => t._id !== id));
      if (activeThreadId === id) {
        setActiveThreadId(null);
        setChats([]);
      }
    } catch {
      /* silently fail */
    }
    setMenuOpenId(null);
  };

  const handleRenameThread = async (id) => {
    const thread = threads.find((t) => t._id === id);
    const newTitle = prompt('Rename thread:', thread?.title || '');
    if (newTitle && newTitle.trim()) {
      try {
        await api.put(`/threads/${id}`, { title: newTitle.trim() });
        setThreads((prev) =>
          prev.map((t) => (t._id === id ? { ...t, title: newTitle.trim() } : t))
        );
      } catch {
        /* silently fail */
      }
    }
    setMenuOpenId(null);
  };

  // ---- Chats ----

  const fetchChats = async (threadId) => {
    setLoadingChats(true);
    try {
      const res = await api.get(`/chats/${threadId}`);
      setChats(res.data);
    } catch {
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  const selectThread = (id) => {
    setActiveThreadId(id);
    fetchChats(id);
    setMenuOpenId(null);
  };

  useEffect(scrollToBottom, [chats]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !activeThreadId) return;

    const isFirstMessage = chats.length === 0;
    const tempId = `temp-${Date.now()}`;

    setInput('');
    setSending(true);
    setChats((prev) => [
      ...prev,
      { _id: tempId, prompt: text, response: [''], streaming: true },
    ]);

    try {
      const res = await fetch(`${API_BASE}/chats/${activeThreadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: text }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'token') {
              setChats((prev) =>
                prev.map((c) =>
                  c._id === tempId
                    ? {
                        ...c,
                        response: [(c.response?.[0] || '') + data.content],
                        status: null,
                      }
                    : c
                )
              );
            } else if (data.type === 'status') {
              setChats((prev) =>
                prev.map((c) =>
                  c._id === tempId ? { ...c, status: data.message } : c
                )
              );
            } else if (data.type === 'done') {
              setChats((prev) =>
                prev.map((c) =>
                  c._id === tempId
                    ? { ...data.chat, streaming: false }
                    : c
                )
              );
              if (isFirstMessage) fetchThreads();
            } else if (data.type === 'error') {
              setChats((prev) => prev.filter((c) => c._id !== tempId));
            }
          } catch {
            /* malformed SSE event */
          }
        }
      }
    } catch {
      setChats((prev) => prev.filter((c) => c._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // ---- Thread group rendering ----
  const grouped = groupThreadsByDate(threads);

  const renderThreadGroup = (label, items) => {
    if (items.length === 0) return null;
    return (
      <div key={label}>
        <p
          className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </p>
        {items.map((t) => (
          <li key={t._id} className="relative">
            <button
              type="button"
              onClick={() => selectThread(t._id)}
              className="group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition"
              style={{
                background: t._id === activeThreadId ? 'var(--hover-bg)' : 'transparent',
                color: 'var(--text-primary)',
                fontWeight: t._id === activeThreadId ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (t._id !== activeThreadId) e.currentTarget.style.background = 'var(--hover-bg)';
              }}
              onMouseLeave={(e) => {
                if (t._id !== activeThreadId) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span className="truncate text-left flex-1">{t.title}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === t._id ? null : t._id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === t._id ? null : t._id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded-lg ml-2 shrink-0 transition"
                style={{ color: 'var(--text-secondary)' }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </span>
            </button>

            {menuOpenId === t._id && (
              <div
                className="absolute right-2 top-10 z-20 rounded-lg shadow-lg border py-1 min-w-[120px]"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleRenameThread(t._id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Pencil className="w-3.5 h-3.5" /> Rename
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteThread(t._id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </div>
    );
  };

  // ---- Markdown renderer for AI responses ----

  const renderAIContent = (chat) => {
    if (chat.streaming) {
      const text = chat.response?.[0] || '';
      if (text) {
        return (
          <div
            className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-sm prose prose-sm max-w-none"
            style={{
              background: 'var(--chat-assistant-bg)',
              color: 'var(--chat-assistant-text)',
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            <span className="inline-block w-2 h-4 ml-0.5 animate-pulse rounded-sm" style={{ background: 'var(--accent-color)' }} />
          </div>
        );
      }
      if (chat.status) {
        return (
          <div
            className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm flex items-center gap-3"
            style={{
              background: 'var(--chat-assistant-bg)',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              className="w-4 h-4 border-2 rounded-full animate-spin shrink-0"
              style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-color)' }}
            />
            {chat.status}
          </div>
        );
      }
      return (
        <div
          className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm"
          style={{
            background: 'var(--chat-assistant-bg)',
            color: 'var(--text-secondary)',
          }}
        >
          <span className="inline-flex gap-1">
            <span className="animate-bounce [animation-delay:0ms]">.</span>
            <span className="animate-bounce [animation-delay:150ms]">.</span>
            <span className="animate-bounce [animation-delay:300ms]">.</span>
          </span>
        </div>
      );
    }

    const markdown = chat.response?.[0] || '';
    return (
      <div
        className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-sm prose prose-sm max-w-none"
        style={{
          background: 'var(--chat-assistant-bg)',
          color: 'var(--chat-assistant-text)',
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    );
  };

  // ---- Render ----

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ---- Thread Sidebar ---- */}
      <aside
        className="w-64 shrink-0 flex flex-col"
        style={{
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        <div className="p-4">
          <button
            type="button"
            onClick={handleNewThread}
            className="w-full py-2.5 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition"
            style={{
              background: 'var(--accent-color)',
              color: 'var(--bg-primary)',
            }}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto px-2 pb-2">
          {loadingThreads ? (
            <li className="px-3 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Loading&hellip;
            </li>
          ) : threads.length === 0 ? (
            <li className="px-3 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              No conversations yet
            </li>
          ) : (
            <>
              {renderThreadGroup('Today', grouped.today)}
              {renderThreadGroup('Yesterday', grouped.yesterday)}
              {renderThreadGroup('Previous 7 Days', grouped.week)}
              {renderThreadGroup('Older', grouped.older)}
            </>
          )}
        </ul>
      </aside>

      {/* ---- Chat area ---- */}
      <main className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--bg-primary)' }}>
        {activeThreadId == null ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <Bot className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Start a conversation
            </h2>
            <p className="mt-2 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              Select an existing chat or create a new one to talk with FinBud.
            </p>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="max-w-2xl mx-auto space-y-4">
                {loadingChats ? (
                  <div className="flex justify-center py-12">
                    <div
                      className="w-8 h-8 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-color)' }}
                    />
                  </div>
                ) : chats.length === 0 ? (
                  <p className="text-sm text-center mt-12" style={{ color: 'var(--text-secondary)' }}>
                    No messages yet — say something!
                  </p>
                ) : (
                  chats.map((c) => (
                    <div key={c._id} className="space-y-3">
                      {/* User prompt */}
                      <div className="flex justify-end">
                        <div
                          className="max-w-[70%] px-4 py-3 rounded-2xl rounded-br-sm text-sm"
                          style={{
                            background: 'var(--chat-user-bg)',
                            color: 'var(--chat-user-text)',
                          }}
                        >
                          {c.prompt}
                        </div>
                      </div>
                      {/* AI response */}
                      <div className="flex gap-3 items-start">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: 'var(--bg-secondary)' }}
                        >
                          <Bot className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        </div>
                        {renderAIContent(c)}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div
              className="px-4 py-3"
              style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}
            >
              <form
                onSubmit={handleSend}
                className="max-w-2xl mx-auto flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 px-5 py-2.5 rounded-xl outline-none transition text-sm"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="px-6 py-2.5 font-medium rounded-xl disabled:opacity-40 transition text-sm"
                  style={{
                    background: 'var(--accent-color)',
                    color: 'var(--bg-primary)',
                  }}
                >
                  {sending ? '…' : 'Send'}
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
