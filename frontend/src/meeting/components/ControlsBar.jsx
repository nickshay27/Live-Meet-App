import { Mic, MicOff, Camera, CameraOff, MonitorUp, Hand, SmilePlus, LogOut, MessageSquare } from "lucide-react";

export default function ControlsBar({
  micOn,
  cameraOn,
  toggleTrack,
  screenSharing,
  toggleScreenShare,
  raiseHand,
  onToggleReactions,
  onLeave,
  onToggleChat,
  dmUnread,
}) {
  return (
    <footer className="px-4 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-center gap-4 md:gap-6 relative">

      {/* Mic */}
      <button onClick={() => toggleTrack("audio")} className="control-btn">
        {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        <span>{micOn ? "Mic On" : "Mic Off"}</span>
      </button>

      {/* Camera */}
      <button onClick={() => toggleTrack("video")} className="control-btn">
        {cameraOn ? <Camera size={18} /> : <CameraOff size={18} />}
        <span>{cameraOn ? "Camera On" : "Camera Off"}</span>
      </button>

      {/* Screen share */}
      <button onClick={toggleScreenShare} className="control-btn">
        <MonitorUp size={18} className={screenSharing ? "text-green-400" : ""} />
        <span>{screenSharing ? "Sharing" : "Share"}</span>
      </button>

      {/* Raise hand */}
      <button onClick={raiseHand} className="control-btn">
        <Hand size={18} />
        <span>Hand</span>
      </button>

      {/* Reactions */}
      <button onClick={onToggleReactions} className="control-btn">
        <SmilePlus size={18} />
        <span>React</span>
      </button>

      {/* Chat toggle (with DM badge) */}
      <div className="relative">
        <button onClick={onToggleChat} className="control-btn">
          <MessageSquare size={18} />
          <span>Chat</span>
        </button>
        {dmUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1 rounded-full">
            {dmUnread}
          </span>
        )}
      </div>

      {/* Leave */}
      <button
        onClick={onLeave}
        className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 flex items-center gap-2 text-sm font-semibold"
      >
        <LogOut size={18} />
        Leave
      </button>
    </footer>
  );
}
