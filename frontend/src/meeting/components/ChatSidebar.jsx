export default function ChatSidebar({
  messages,
  chatInput,
  setChatInput,
  sendMessage
}) {
  return (
    <aside className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">

      <header className="px-4 py-3 border-b border-slate-800 text-sm font-semibold">
        Chat
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 text-xs">
        {messages.length === 0 && (
          <p className="text-slate-500 text-center mt-4">Say Hi 👋</p>
        )}

        {messages.map((m) => (
          <div key={m.id} className="bg-slate-800/40 p-2 rounded-lg">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span className="font-medium">{m.user.name}</span>
              <span>{new Date(m.ts).toLocaleTimeString()}</span>
            </div>
            <div className="mt-1 text-slate-200">{m.text}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 p-3 flex gap-2">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type message..."
          className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700"
        >
          Send
        </button>
      </div>

    </aside>
  );
}
