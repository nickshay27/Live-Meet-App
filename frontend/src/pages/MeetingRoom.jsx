import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useSocket } from "../contexts/SocketContext.jsx";
import { apiClient } from "../api/client.js";
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


export default function MeetingRoom() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { socket } = useSocket();

  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState({});
  const [connected, setConnected] = useState(false);

  const localVideoRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [micOn, setMicOn] = useState(true);
const [cameraOn, setCameraOn] = useState(true);
const [screenSharing, setScreenSharing] = useState(false);
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const [reactionBubble, setReactionBubble] = useState(null);


  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const client = apiClient(token);
        const res = await client.get(`/meetings/${code}`);
        setMeeting(res.data.meeting);
      } catch (err) {
        setError(err.response?.data?.message || "Meeting not found");
      }
    };
    if (token) fetchMeeting();
  }, [code, token]);

  useEffect(() => {
    if (!socket || !code || !user) return;

    const setupMediaAndJoin = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: true

        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.emit("join-room", { code, user: { id: user.id, name: user.name } });

        socket.on("room-users", ({ users }) => {
          const map = {};
          users.forEach((u) => {
            map[u.socketId] = u;
          });
          setParticipants(map);
        });

        socket.on("user-joined", ({ user: joinedUser }) => {
          setParticipants((prev) => ({
            ...prev,
            [joinedUser.socketId]: joinedUser
          }));
          createOfferFor(joinedUser.socketId);
        });

        socket.on("user-left", ({ socketId }) => {
          setParticipants((prev) => {
            const copy = { ...prev };
            delete copy[socketId];
            return copy;
          });



          setRemoteStreams((prev) => {
            const copy = { ...prev };
            delete copy[socketId];
            return copy;
          });
          if (peerConnectionsRef.current[socketId]) {
            peerConnectionsRef.current[socketId].close();
            delete peerConnectionsRef.current[socketId];
          }
        });

        socket.on("webrtc-offer", async ({ from, offer }) => {
          await createAnswerFor(from, offer);
        });

        socket.on("webrtc-answer", async ({ from, answer }) => {
          const pc = peerConnectionsRef.current[from];
          if (!pc) return;
          await pc.setRemoteDescription(answer);
        });

        socket.on("webrtc-ice-candidate", async ({ from, candidate }) => {
          const pc = peerConnectionsRef.current[from];
          if (!pc) return;
          try {
            await pc.addIceCandidate(candidate);
          } catch (e) {
            console.error(e);
          }
        });

        
        socket.on("chat-message", (msg) => {
          setMessages((prev) => [...prev, msg]);
        });
socket.on("reaction", ({ user, emoji }) => {
  showReaction(user, emoji);
});

        setConnected(true);
      } catch (err) {
        console.error(err);
        setError("Could not access camera/microphone");
      }
    };

const createPeerConnection = (remoteSocketId) => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // Add local cam + mic
  if (localStreamRef.current) {
    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });
  }

  // 🔥 FIXED — two-way audio/video renegotiation
  pc.onnegotiationneeded = async () => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc-offer", {
        to: remoteSocketId,
        offer,
      });
    } catch (err) {
      console.error("Renegotiation error:", err);
    }
  };

  // Incoming remote media
  pc.ontrack = (event) => {
    const [stream] = event.streams;
    setRemoteStreams((prev) => ({
      ...prev,
      [remoteSocketId]: stream,
    }));
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("webrtc-ice-candidate", {
        to: remoteSocketId,
        candidate: event.candidate,
      });
    }
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[remoteSocketId];
        return copy;
      });
    }
  };

  peerConnectionsRef.current[remoteSocketId] = pc;
  return pc;
};


  

    const createOfferFor = async (remoteSocketId) => {
  let pc = peerConnectionsRef.current[remoteSocketId];
  if (!pc) pc = createPeerConnection(remoteSocketId);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("webrtc-offer", { to: remoteSocketId, offer });
};


const createAnswerFor = async (remoteSocketId, offer) => {
  let pc = peerConnectionsRef.current[remoteSocketId];
  if (!pc) pc = createPeerConnection(remoteSocketId);

  await pc.setRemoteDescription(offer);

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.emit("webrtc-answer", { to: remoteSocketId, answer });
};


    // expose helpers
    MeetingRoom._internal = { createOfferFor, createAnswerFor };

    setupMediaAndJoin();

    return () => {
      if (socket) {
        socket.emit("leave-room", { code });
        socket.off("room-users");
        socket.off("user-joined");
        socket.off("user-left");
        socket.off("webrtc-offer");
        socket.off("webrtc-answer");
        socket.off("webrtc-ice-candidate");
        socket.off("chat-message");
        socket.off("reaction");
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [socket, code, user]);

  const sendMessage = () => {
    if (!chatInput.trim() || !socket) return;
    const msg = {
      id: Date.now(),
      user: { id: user.id, name: user.name },
      text: chatInput.trim(),
      ts: new Date().toISOString()
    };
    socket.emit("chat-message", { code, message: msg });
    setMessages((prev) => [...prev, msg]);
    setChatInput("");
  };

const toggleTrack = (kind) => {
  const stream = localStreamRef.current;
  if (!stream) return;

  const track = stream.getTracks().find(t => t.kind === kind);
  if (!track) return;

  track.enabled = !track.enabled;

  if (kind === "audio") setMicOn(track.enabled);
  if (kind === "video") setCameraOn(track.enabled);

  Object.values(peerConnectionsRef.current).forEach((pc) => {
    const sender = pc.getSenders().find(s => s.track?.kind === kind);
    if (sender) sender.replaceTrack(track);
  });
};

  const leave = () => {
    navigate("/");
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-3 py-1 text-xs rounded-full bg-slate-800 hover:bg-slate-700"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

const toggleScreenShare = async () => {
  if (screenSharing === false) {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      setScreenSharing(true);

      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });

      screenTrack.onended = () => {
        const camTrack = localStreamRef.current.getVideoTracks()[0];

        setScreenSharing(false);

        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) sender.replaceTrack(camTrack);
        });
      };

    } catch (err) {
      console.error("Screen share error:", err);
    }
  }
};

const raiseHand = () => {
  socket.emit("reaction", { code, emoji: "✋", user: user.name });
};

const sendReaction = (emoji) => {
  socket.emit("reaction", { code, emoji, user: user.name });
};

const showReaction = (user, emoji) => {
  setReactionBubble({ user, emoji });

  setTimeout(() => {
    setReactionBubble(null);
  }, 2000);
};



return (
  <div className="grid gap-4 md:grid-cols-[2fr,1fr] h-[calc(100vh-80px)]">

    {/* LEFT SIDE — VIDEO SECTION */}
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
        {/* REACTION BUBBLE */}
  {reactionBubble && (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-5xl animate-bounce z-50">
      {reactionBubble.emoji}
    </div>
  )}

      
      {/* HEADER */}
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

      {/* VIDEO GRID */}
      <div className="flex-1 p-4 grid gap-4 auto-rows-[200px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* LOCAL VIDEO */}
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

        {/* REMOTE VIDEOS */}
        {Object.entries(remoteStreams).map(([socketId, stream]) => (
          <RemoteVideo key={socketId} stream={stream} user={participants[socketId]} />
        ))}
      </div>

      {/* FOOTER CONTROL BAR */}
      <footer className="px-4 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-center gap-6">

<button onClick={() => toggleTrack("audio")} className="control-btn">
  {micOn ? <Mic size={18} /> : <MicOff size={18} />}
  <span>{micOn ? "Mic On" : "Mic Off"}</span>
</button>

<button onClick={() => toggleTrack("video")} className="control-btn">
  {cameraOn ? <Camera size={18} /> : <CameraOff size={18} />}
  <span>{cameraOn ? "Camera On" : "Camera Off"}</span>
</button>

<button onClick={toggleScreenShare} className="control-btn">
  <MonitorUp size={18} className={screenSharing ? "text-green-400" : ""} />
  <span>{screenSharing ? "Sharing" : "Share"}</span>
</button>


        {/* RAISE HAND */}
        <button
          onClick={raiseHand}
          className="control-btn"
        >
          <Hand size={18} />
          <span>Hand</span>
        </button>

        {/* REACTIONS */}
        <button
          onClick={() => sendReaction("👍")}
          className="control-btn"
        >
          <SmilePlus size={18} />
          <span>React</span>
        </button>

        {/* LEAVE */}
        <button
          onClick={leave}
          className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 flex items-center gap-2 text-sm font-semibold"
        >
          <LogOut size={18} />
          Leave
        </button>

      </footer>
    </div>

    {/* RIGHT SIDE — CHAT */}
    <aside className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">

      <header className="px-4 py-3 border-b border-slate-800 text-sm font-semibold">
        Chat
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 text-xs">
        {messages.length === 0 && (
          <p className="text-slate-500 text-center mt-4">Say Hi 👋</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="bg-slate-800/40 p-2 rounded-lg">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span className="font-medium">{m.user.name}</span>
              <span>{new Date(m.ts).toLocaleTimeString()}</span>
            </div>
            <div className="mt-1 text-slate-200">{m.text}</div>
          </div>
        ))}
      </div>

      {/* CHAT INPUT */}
      <div className="border-t border-slate-800 p-3 flex gap-2">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type message..."
          className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-brand rounded-lg text-sm hover:bg-brand-dark"
        >
          Send
        </button>
      </div>
    </aside>
  </div>
);

}

function RemoteVideo({ stream, user }) {
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
