import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";

import Header from "./components/Header";
import VideoGrid from "./components/VideoGrid";
import ChatSidebar from "./components/ChatSidebar";
import ReactionMenu from "./components/ReactionMenu";
import ControlsBar from "./components/ControlsBar";
import FloatingReactions from "./components/FloatingReactions";

import useWebRTC from "./hooks/useWebRTC";
import useReactions from "./hooks/useReactions";

import "./styles/MeetingRoom.css";
import "./styles/reactions.css";

export default function MeetingRoom() {
  const { user } = useAuth();

  const {
    meeting,
    error,
    participants,
    localVideoRef,
    remoteStreams,
    messages,
    chatInput,
    setChatInput,
    sendMessage,
    notifyTyping,
    micOn,
    cameraOn,
    toggleTrack,
    screenSharing,
    toggleScreenShare,
    leave,
    typingUser,
    selfSocketId,
  } = useWebRTC();

  const {
    showReactionMenu,
    setShowReactionMenu,
    floatingReactions,
    sendReaction,
    raiseHand,
  } = useReactions();

  // Chat target: "all" or socketId
  const [selectedTarget, setSelectedTarget] = useState("all");

  // Mobile chat toggle (Option A: desktop always visible)
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Simple DM unread counter
  const [dmUnread, setDmUnread] = useState(0);

  // Increase unread when a new private message comes for me
  // (very simple: based on last message)
  if (messages.length) {
    const last = messages[messages.length - 1];
    if (
      last.isPrivate &&
      last.to === selfSocketId &&
      last.from !== selfSocketId &&
      dmUnread === 0 && // avoid infinite loop; very simple logic
      selectedTarget !== last.from
    ) {
      // eslint-disable-next-line no-set-state
      setDmUnread(1);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <button
          onClick={leave}
          className="px-3 py-1 text-xs rounded-full bg-slate-800 hover:bg-slate-700"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const handleToggleChat = () => {
    setShowMobileChat((prev) => !prev);
    setDmUnread(0);
  };

  const handleSelectTarget = (value) => {
    setSelectedTarget(value);
    setDmUnread(0);
  };

  return (
    <div className="meeting-layout relative">

      {/* LEFT AREA: video + controls */}
      <div className="video-area">

        {/* Header */}
        <Header meeting={meeting} participants={participants} />

        {/* Videos */}
        <VideoGrid
          localVideoRef={localVideoRef}
          remoteStreams={remoteStreams}
          participants={participants}
        />

        {/* Reaction picker */}
        <ReactionMenu
          show={showReactionMenu}
          onSelect={(emoji) => {
            sendReaction(emoji);
            setShowReactionMenu(false);
          }}
        />

        {/* Floating reactions */}
        <FloatingReactions floatingReactions={floatingReactions} />

        {/* Controls bar */}
        <ControlsBar
          micOn={micOn}
          cameraOn={cameraOn}
          toggleTrack={toggleTrack}
          screenSharing={screenSharing}
          toggleScreenShare={toggleScreenShare}
          raiseHand={raiseHand}
          onToggleReactions={() => setShowReactionMenu((v) => !v)}
          onLeave={leave}
          onToggleChat={handleToggleChat}
          dmUnread={dmUnread}
        />
      </div>

      {/* RIGHT AREA: desktop chat (always visible on md+) */}
      <div className="hidden md:flex">
        <ChatSidebar
          user={user}
          selfSocketId={selfSocketId}
          participants={participants}
          messages={messages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendMessage={sendMessage}
          notifyTyping={notifyTyping}
          typingUser={typingUser}
          selectedTarget={selectedTarget}
          onSelectTarget={handleSelectTarget}
        />
      </div>

      {/* Mobile chat overlay */}
      {showMobileChat && (
        <div className="fixed inset-0 z-40 bg-slate-950/90 flex md:hidden">
          <div className="flex-1 max-w-md mx-auto my-4">
            <ChatSidebar
              user={user}
              selfSocketId={selfSocketId}
              participants={participants}
              messages={messages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              sendMessage={sendMessage}
              notifyTyping={notifyTyping}
              typingUser={typingUser}
              selectedTarget={selectedTarget}
              onSelectTarget={handleSelectTarget}
              isMobile
              onClose={handleToggleChat}
            />
          </div>
        </div>
      )}
    </div>
  );
}
