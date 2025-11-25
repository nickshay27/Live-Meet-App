export default function ChatSidebar({
  messages,
  chatInput,
  setChatInput,
  sendMessage,
  participants,
  chatTarget,
  setChatTarget
}) {
  return (
    <aside className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">

      {/* HEADER */}
      <header className="px-4 py-3 border-b border-slate-800 text-sm font-semibold flex justify-between items-center">
        <span>Chat</span>
      </header>

      {/* 🔽 TARGET SELECT (Everyone / User) */}
    {/* TARGET SELECT */}
<div className="p-3 border-b border-slate-800">
  <select
    value={chatTarget}
    onChange={(e) => setChatTarget(e.target.value)}
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


      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 text-xs">
        {messages.map((m) => (
          <div key={m.id} className="bg-slate-800/40 p-2 rounded-lg">

            {/* HEADER */}
            <div className="flex justify-between text-[11px] text-slate-300">
              <span className="font-medium">
                {m.user.name}
                {m.target !== "everyone" ? (
                  <span className="text-red-400 ml-1">(Private)</span>
                ) : null}
              </span>

              <span>{new Date(m.ts).toLocaleTimeString()}</span>
            </div>

            {/* TEXT */}
            <div className="mt-1 text-slate-200">{m.text}</div>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="border-t border-slate-800 p-3 flex gap-2">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={`Message ${chatTarget === "everyone" ? "everyone" : "privately"}`}
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
