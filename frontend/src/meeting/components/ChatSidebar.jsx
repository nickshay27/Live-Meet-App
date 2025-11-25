import { useMemo } from "react";
import { X } from "lucide-react";

export default function ChatSidebar({
  user,
  selfSocketId,
  participants = {},
  messages,
  chatInput,
  setChatInput,
  sendMessage,
  notifyTyping,
  typingUser,
  selectedTarget,
  onSelectTarget,
  isMobile = false,
  onClose,
}) {
  const participantEntries = Object.entries(participants).filter(
    ([socketId]) => socketId !== selfSocketId
  );

  // Filter messages based on target
  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    if (selectedTarget === "all") {
      // Only public messages
      return messages.filter((m) => !m.isPrivate);
    }
    // DM between me and selectedTarget
    return messages.filter(
      (m) =>
        m.isPrivate &&
        ((m.from === selfSocketId && m.to === selectedTarget) ||
          (m.from === selectedTarget && m.to === selfSocketId))
    );
  }, [messages, selectedTarget, selfSocketId]);

  // For DM notification badge per user (simple: any DM from that user to me)
  const hasDmFrom = (socketId) =>
    messages?.some(
      (m) =>
        m.isPrivate &&
        m.from === socketId &&
        m.to === selfSocketId &&
        selectedTarget !== socketId
    );

  return (
    <aside
      className={`chat-sidebar flex flex-col bg-slate-900 border border-slate-800 rounded-2xl ${
        isMobile ? "h-full" : ""
      }`}
    >
      {/* Header */}
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-sm font-semibold">
        <span>Chat</span>
        {isMobile && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100"
          >
            <X size={18} />
          </button>
        )}
      </header>

      {/* Participants + target selector */}
      <div className="px-3 py-2 border-b border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">To:</span>
          <select
            value={selectedTarget}
            onChange={(e) => onSelectTarget(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs"
          >
            <option value="all">Everyone</option>
            {participantEntries.map(([socketId, p]) => (
              <option key={socketId} value={socketId}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {participantEntries.map(([socketId, p]) => (
            <div
              key={socketId}
              className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-800/60 text-[11px]"
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>{p.name}</span>
              {hasDmFrom(socketId) && (
                <span className="ml-1 text-[9px] px-1 rounded-full bg-red-600 text-white">
                  DM
                </span>
              )}
            </div>
          ))}
          {participantEntries.length === 0 && (
            <span className="text-slate-500 text-[11px]">Only you here</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 text-xs">
        {filteredMessages.length === 0 && (
          <p className="text-slate-500 text-center mt-4">Say Hi 👋</p>
        )}
        {filteredMessages.map((m) => (
          <div key={m.id} className="bg-slate-800/40 p-2 rounded-lg">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span className="font-medium">
                {m.user.name}
                {m.isPrivate && (
                  <span className="ml-1 text-[9px] text-pink-400">
                    (Private)
                  </span>
                )}
              </span>
              <span>{new Date(m.ts).toLocaleTimeString()}</span>
            </div>
            <div className="mt-1 text-slate-200">{m.text}</div>
          </div>
        ))}
      </div>

      {/* Typing indicator */}
      {typingUser && selectedTarget === "all" && (
        <div className="text-[11px] text-slate-400 px-3 pb-1">
          {typingUser} is typing…
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-800 p-3 flex gap-2">
        <input
          value={chatInput}
          onChange={(e) => {
            setChatInput(e.target.value);
            notifyTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(selectedTarget)}
          placeholder={
            selectedTarget === "all"
              ? "Message to everyone..."
              : "Private message..."
          }
          className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
        />
        <button
          onClick={() => sendMessage(selectedTarget)}
          className="px-4 py-2 bg-brand rounded-lg text-sm hover:bg-brand-dark"
        >
          Send
        </button>
      </div>
    </aside>
  );
}
