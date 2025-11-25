import { useEffect, useRef } from "react";

export default function RemoteVideo({ stream, user }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !stream) return;
    ref.current.srcObject = stream;
    ref.current.play().catch(() => {});
  }, [stream]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 shadow-md">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 px-2 py-1 text-xs rounded bg-black/60 backdrop-blur">
        {user?.name || "Guest"}
      </div>
    </div>
  );
}
