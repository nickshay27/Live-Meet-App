export default function Header({ meeting, participants, code }) {
  return (
    <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
      <div>
        <div className="font-semibold text-base">{meeting?.title || "Meeting"}</div>
        <div className="text-slate-400 text-xs">
          Code: <span className="font-mono">{code}</span>
        </div>
      </div>

      <div className="text-slate-300 text-sm">
        👥 {Object.keys(participants).length}
      </div>
    </header>
  );
}
