export default function ReactionMenu({ show, onSelect }) {
  if (!show) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-800 p-3 rounded-xl flex gap-3 shadow-xl z-50">
      {["👍", "❤️", "😂", "🎉", "🔥"].map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="text-3xl hover:scale-150 transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
