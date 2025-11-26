import Header from "./components/Header";
import VideoGrid from "./components/VideoGrid";
import ChatSidebar from "./components/ChatSidebar";
import ReactionMenu from "./components/ReactionMenu";

import useWebRTC from "./hooks/useWebRTC";
import useReactions from "./hooks/useReactions";

import "./styles/MeetingRoom.css";
import "./styles/reactions.css";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MonitorUp,
  Hand,
  SmilePlus,
  LogOut
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useState } from "react";



export default function MeetingRoom() {
  const {
  meeting,
  participants,
  localVideoRef,
  remoteStreams,

  messages,
  chatInput,
  setChatInput,
  sendMessage,

  micOn,
  cameraOn,
  toggleTrack,

  screenSharing,
  toggleScreenShare,

  leave,
  error,

  // 🔥 DM / PRIVATE CHAT ADDED
  chatTarget,
  setChatTarget,
  dmMessages,
  activeDM,
  setActiveDM,
  unreadDM,
  dmTyping,
  sendTyping,
} = useWebRTC();


  const {
    showReactionMenu,
    setShowReactionMenu,
    floatingReactions,
    sendReaction,
    raiseHand
  } = useReactions();
    const { code } = useParams();


  if (error) {
    return (
      <div className="error-screen">
        <p>{error}</p>
        <button onClick={leave}>Back to Dashboard</button>
      </div>
    );
  }

  const handleVideoUserClick = (socketId) => {
  // ignore self for now or could open self DM in future
  if (socketId === "self") return;

  // open DM with clicked user
  setChatTarget(socketId);
  setActiveDM(socketId);
};


  return (
    <div className="meeting-layout">

      {/* LEFT AREA */}
      <div className="video-area">

        <Header meeting={meeting} participants={participants} code={code} />

        <VideoGrid
          localVideoRef={localVideoRef}
          remoteStreams={remoteStreams}
          participants={participants}
          onUserClick={handleVideoUserClick}
        />

        <ReactionMenu
          show={showReactionMenu}
          onSelect={(emoji) => {
            sendReaction(emoji);
            setShowReactionMenu(false);
          }}
        />

    
    {floatingReactions.map((r) => (
  <div
    key={r.id}
    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-5xl animate-float z-50"
  >
    {r.emoji}
  </div>
))}

        {/* FOOTER CONTROLS */}
    <div className="control-bar flex items-center justify-center gap-6 border-t border-slate-800 bg-slate-900 px-4 py-4">

  {/* MIC */}
  <button onClick={() => toggleTrack("audio")} className="control-btn">
    {micOn ? <Mic size={18} /> : <MicOff size={18} />}
    <span>{micOn ? "Mic On" : "Mic Off"}</span>
  </button>

  {/* CAMERA */}
  <button onClick={() => toggleTrack("video")} className="control-btn">
    {cameraOn ? <Camera size={18} /> : <CameraOff size={18} />}
    <span>{cameraOn ? "Camera On" : "Camera Off"}</span>
  </button>

  {/* SCREEN SHARE */}
  <button onClick={toggleScreenShare} className="control-btn">
    <MonitorUp size={18} className={screenSharing ? "text-green-400" : ""} />
    <span>{screenSharing ? "Sharing" : "Share"}</span>
  </button>

  {/* HAND */}
  <button onClick={raiseHand} className="control-btn">
    <Hand size={18} />
    <span>Hand</span>
  </button>

  {/* REACTIONS */}
  <div className="relative">
    <button
      onClick={() => setShowReactionMenu(!showReactionMenu)}
      className="control-btn"
    >
      <SmilePlus size={18} />
      <span>React</span>
    </button>

    {showReactionMenu && (
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-800 p-2 rounded-xl flex gap-2 shadow-lg">
        {["👍", "❤️", "😂", "🎉", "🔥"].map((e) => (
          <button
            key={e}
            onClick={() => {
              sendReaction(e);
              setShowReactionMenu(false);
            }}
            className="text-2xl hover:scale-150 transition-transform"
          >
            {e}
          </button>
        ))}
      </div>
    )}
  </div>

  {/* LEAVE */}
  <button
    onClick={leave}
    className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 flex items-center gap-2 text-sm font-semibold"
  >
    <LogOut size={18} />
    Leave
  </button>

</div>

      </div>

      {/* RIGHT AREA (Chat) */}
     <ChatSidebar
  messages={messages}
  dmMessages={dmMessages}
  participants={participants}

  chatInput={chatInput}
  setChatInput={setChatInput}
  sendMessage={sendMessage}

  chatTarget={chatTarget}
  setChatTarget={setChatTarget}

  activeDM={activeDM}
  setActiveDM={setActiveDM}

  unreadDM={unreadDM}
  dmTyping={dmTyping}
  sendTyping={sendTyping}
/>

    </div>
  );
}
