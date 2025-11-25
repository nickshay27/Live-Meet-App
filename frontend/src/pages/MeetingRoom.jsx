import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useSocket } from "../contexts/SocketContext.jsx";
import { apiClient } from "../api/client.js";

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
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);

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
          audio: true,
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

        setConnected(true);
      } catch (err) {
        console.error(err);
        setError("Could not access camera/microphone");
      }
    };

    const createPeerConnection = (remoteSocketId) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" }
        ]
      });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setRemoteStreams((prev) => ({
          ...prev,
          [remoteSocketId]: stream
        }));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-ice-candidate", {
            to: remoteSocketId,
            candidate: event.candidate
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
      const pc = createPeerConnection(remoteSocketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", { to: remoteSocketId, offer });
    };

    const createAnswerFor = async (remoteSocketId, offer) => {
      const pc = createPeerConnection(remoteSocketId);
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
    const track = stream.getTracks().find((t) => t.kind === kind);
    if (!track) return;
    track.enabled = !track.enabled;
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

  return (
    <div className="grid gap-4 md:grid-cols-[2fr,1fr] h-[calc(100vh-80px)]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
        <header className="px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div className="font-semibold text-sm">
              {meeting?.title || "Instant meeting"}
            </div>
            <div className="text-slate-400">
              Code: <span className="font-mono">{code}</span>
            </div>
          </div>
          <div className="text-slate-400 text-xs">
            Participants: {Object.keys(participants).length}
          </div>
        </header>
        <div className="flex-1 grid gap-2 p-3 auto-rows-[minmax(0,1fr)] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
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
          {Object.entries(remoteStreams).map(([socketId, stream]) => (
            <RemoteVideo key={socketId} stream={stream} user={participants[socketId]} />
          ))}
        </div>
        <footer className="px-4 py-3 border-t border-slate-800 flex items-center justify-center gap-3">
          <button
            onClick={() => toggleTrack("audio")}
            className="px-3 py-1.5 text-xs rounded-full bg-slate-800 hover:bg-slate-700"
          >
            Toggle Mic
          </button>
          <button
            onClick={() => toggleTrack("video")}
            className="px-3 py-1.5 text-xs rounded-full bg-slate-800 hover:bg-slate-700"
          >
            Toggle Camera
          </button>
          <button
            onClick={leave}
            className="px-3 py-1.5 text-xs rounded-full bg-red-600 hover:bg-red-700"
          >
            Leave
          </button>
        </footer>
      </div>

      <aside className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col">
        <header className="px-4 py-2 border-b border-slate-800 text-xs font-semibold">
          Chat
        </header>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-xs">
          {messages.length === 0 && (
            <p className="text-slate-500 text-center mt-4 text-[11px]">
              Be the first one to say hi 👋
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id}>
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{m.user.name}</span>
                <span className="text-[10px] text-slate-500">
                  {new Date(m.ts).toLocaleTimeString()}
                </span>
              </div>
              <div>{m.text}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 p-2 flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-700 text-xs"
          />
          <button
            onClick={sendMessage}
            className="px-3 py-1.5 rounded-full bg-brand hover:bg-brand-dark text-xs"
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
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute bottom-1 left-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-900/70">
        {user?.name || "Guest"}
      </div>
    </div>
  );
}
