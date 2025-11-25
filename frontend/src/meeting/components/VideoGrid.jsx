import RemoteVideo from "./RemoteVideo";

export default function VideoGrid({ localVideoRef, remoteStreams, participants }) {
  return (
    <div className="flex-1 p-4 grid gap-4 auto-rows-[200px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

      {/* Local video */}
      <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 shadow-md">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 px-2 py-1 text-xs rounded bg-black/60 backdrop-blur">
          You
        </div>
      </div>

      {/* Remote videos */}
      {Object.entries(remoteStreams).map(([socketId, stream]) => (
        <RemoteVideo key={socketId} stream={stream} user={participants[socketId]} />
      ))}

    </div>
  );
}
