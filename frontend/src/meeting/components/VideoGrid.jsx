import { useRef } from "react";

export default function VideoGrid({
  localVideoRef,
  remoteStreams,
  participants,
  onUserClick, // NEW
}) {
  return (
    <div className="flex-1 grid gap-2 p-3 auto-rows-[minmax(0,1fr)] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {/* LOCAL VIDEO */}
      <div
        className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer"
        onClick={() => onUserClick && onUserClick("self")}
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-1 left-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-900/70">
          You
        </div>
      </div>

      {/* REMOTE VIDEOS */}
      {Object.entries(remoteStreams).map(([socketId, stream]) => (
        <RemoteTile
          key={socketId}
          socketId={socketId}
          stream={stream}
          user={participants?.[socketId]}
          onClick={onUserClick}
        />
      ))}
    </div>
  );
}

function RemoteTile({ socketId, stream, user, onClick }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer"
      onClick={() => onClick && onClick(socketId)}
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-1 left-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-900/70">
        {user?.name || "Guest"}
      </div>
    </div>
  );
}
