import { useEffect, useMemo, useRef, useState } from "react";

export default function ChatSidebar({
  messages,
  dmMessages,
  participants,
  chatInput,
  setChatInput,
  sendMessage,
  chatTarget,
  setChatTarget,
  activeDM,
  setActiveDM,
  unreadDM,
  dmTyping,
  sendTyping,
}) {
  const isDM = chatTarget !== "everyone";

  // 🔍 search
  const [search, setSearch] = useState("");

  // 📌 pinned message IDs
  const [pinnedIds, setPinnedIds] = useState([]);

  // final message list (based on target)
  const rawMessages = useMemo(
    () =>
      isDM
        ? dmMessages[chatTarget] || []
        : messages.filter((m) => m.target === "everyone"),
    [isDM, dmMessages, chatTarget, messages]
  );

  const messagesEndRef = useRef(null);

useEffect(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages, dmMessages, chatTarget]);


  // apply search filter
  const filteredMessages = useMemo(() => {
    if (!search.trim()) return rawMessages;
    const q = search.toLowerCase();
    return rawMessages.filter((m) => m.text?.toLowerCase().includes(q));
  }, [rawMessages, search]);

  // sort: pinned first
  const visibleMessages = useMemo(() => {
    const pinned = [];
    const normal = [];
    filteredMessages.forEach((m) => {
      if (pinnedIds.includes(m.id)) pinned.push(m);
      else normal.push(m);
    });
    return [...pinned, ...normal];
  }, [filteredMessages, pinnedIds]);

  const handleTargetChange = (value) => {
    setChatTarget(value);
    if (value === "everyone") {
      setActiveDM(null);
    } else {
      setActiveDM(value);
    }
  };

  const togglePin = (id) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isUserTyping =
    isDM && activeDM && dmTyping && Boolean(dmTyping[activeDM]);

  return (
    <aside className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col w-80">
      {/* HEADER */}
      <header className="px-4 py-3 border-b border-slate-800 text-sm font-semibold flex justify-between items-center">
        <span>Chat</span>
        {isDM && activeDM && (
          <span className="text-[11px] text-purple-300">Private chat</span>
        )}
      </header>

      {/* TARGET SELECT */}
      <div className="border-b border-slate-800 p-3">
        <select
          value={chatTarget}
          onChange={(e) => handleTargetChange(e.target.value)}
          className="w-full bg-slate-800 p-2 rounded text-xs"
        >
          <option value="everyone">Everyone</option>

          {Object.entries(participants || {}).map(([socketId, user]) => (
            <option key={socketId} value={socketId}>
              {user?.name || "User"} (Private)
            </option>
          ))}
        </select>
      </div>

      {/* DM USER LIST */}
      <div className="border-b border-slate-800 max-h-40 overflow-y-auto p-2 space-y-1">
        {Object.entries(participants || {}).map(([socketId, user]) => (
          <button
            key={socketId}
            className={`w-full flex justify-between items-center p-2 rounded-lg text-xs
              ${
                activeDM === socketId ? "bg-slate-700" : "bg-slate-800/40"
              } hover:bg-slate-700`}
            onClick={() => handleTargetChange(socketId)}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-[10px]">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span>{user?.name || "User"}</span>
            </div>

            <div className="flex flex-col items-end gap-0.5">
              {unreadDM?.[socketId] > 0 && (
                <span className="bg-red-500 text-[9px] px-2 py-0.5 rounded-full">
                  {unreadDM[socketId]}
                </span>
              )}
              {dmTyping?.[socketId] && (
                <span className="text-green-400 text-[9px]">typing…</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="border-b border-slate-800 p-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search in messages..."
          className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[11px]"
        />
      </div>

      {/* MESSAGES */}
      {/* <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 text-xs"> */}
      <div
  className="flex-1 px-3 py-4 space-y-3 text-xs overflow-y-auto scroll-smooth"
  style={{ maxHeight: "100%", scrollbarWidth: "thin" }}
>

        {visibleMessages.length === 0 && (
          <p className="text-slate-500 text-center mt-4 text-[11px]">
            No messages yet.
          </p>
        )}

        {visibleMessages.map((m) => {
          const isPinned = pinnedIds.includes(m.id);
          const isSelf = m.from === "self" || m.user?.isSelf;

          return (
            <div
              key={m.id}
              className={`bg-slate-800/40 p-2 rounded-lg ${
                isSelf ? "border border-slate-600/60" : ""
              }`}
            >
              {/* HEADER */}
              <div className="flex justify-between text-[11px] text-slate-300">
                <span className="font-medium flex items-center gap-1">
                  {m.fromUser || m.user?.name || "You"}
                  {isDM || m.target !== "everyone" ? (
                    <span className="text-purple-400 ml-0.5 text-[10px]">
                      (Private)
                    </span>
                  ) : null}
                  {isPinned && <span className="text-yellow-300">📌</span>}
                </span>

                <span>{new Date(m.ts).toLocaleTimeString()}</span>
              </div>

              {/* TEXT / FILE */}
              <div className="mt-1 text-slate-200">{m.text}</div>

              {/* FOOTER ROW: status + pin */}
              <div className="mt-1 flex justify-between items-center text-[10px] text-slate-400">
                <span>{isSelf ? "You • sent" : "Received"}</span>
                <button
                  onClick={() => togglePin(m.id)}
                  className="hover:text-yellow-300"
                >
                  {isPinned ? "Unpin" : "Pin"}
                </button>
              </div>
            </div>
          );
        })}

        {/* Typing line for active DM */}
        {isUserTyping && (
          <div className="mt-2 text-[11px] text-green-400">
            Typing…
          </div>
        )}
          <div ref={messagesEndRef}></div>
      </div>

      {/* INPUT */}
      <div className="border-t border-slate-800 p-3 flex gap-2">
        <input
          value={chatInput}
          onChange={(e) => {
            setChatInput(e.target.value);

            if (isDM) {
              // send typing events for DMs
              sendTyping(true);
              clearTimeout(window.__dmTypingTimer);
              window.__dmTypingTimer = setTimeout(() => {
                sendTyping(false);
              }, 1000);
            }
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={`Message ${
            chatTarget === "everyone" ? "everyone" : "privately"
          }`}
          className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-brand rounded-lg text-sm hover:bg-brand-dark"
        >
          Send
        </button>
      </div>
    </aside>
  );
}
