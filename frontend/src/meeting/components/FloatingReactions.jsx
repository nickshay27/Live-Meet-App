export default function FloatingReactions({ floatingReactions = [] }) {
  if (!Array.isArray(floatingReactions)) return null;

  return (
    <>
      {floatingReactions.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-5xl animate-float z-50"
        >
          {r.emoji}
        </div>
      ))}
    </>
  );
}
