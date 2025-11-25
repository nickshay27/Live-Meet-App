import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useSocket } from "../../contexts/SocketContext.jsx";
import { apiClient } from "../../api/client.js";

export default function useWebRTC() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { socket } = useSocket();

  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState("");

  const [participants, setParticipants] = useState({});
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);

  const [selfSocketId, setSelfSocketId] = useState(null);

  // ─────────────────────────────
  // Fetch meeting details
  // ─────────────────────────────
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
    if (token && code) fetchMeeting();
  }, [token, code]);

  // ─────────────────────────────
  // WebRTC + Socket wiring
  // ─────────────────────────────
  useEffect(() => {
    if (!socket || !code || !user) return;

    setSelfSocketId(socket.id);

    const setupMediaAndJoin = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: true,
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.emit("join-room", {
          code,
          user: { id: user.id, name: user.name },
        });

        // Existing users in room
        socket.on("room-users", ({ users }) => {
          const map = {};
          users.forEach((u) => {
            map[u.socketId] = u;
          });
          setParticipants(map);
        });

        // New user joined
        socket.on("user-joined", ({ user: joinedUser }) => {
          setParticipants((prev) => ({
            ...prev,
            [joinedUser.socketId]: joinedUser,
          }));
          createOfferFor(joinedUser.socketId);
        });

        // User left
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

        // WebRTC offer/answer/candidates
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

        // Chat message (public or private)
        socket.on("chat-message", (msg) => {
          setMessages((prev) => [...prev, msg]);
        });

        // Typing indicator
        socket.on("typing", ({ name }) => {
          setTypingUser(name || "Someone");
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 2000);
        });

      } catch (err) {
        console.error(err);
        setError("Could not access camera/microphone");
      }
    };

    // ───── WebRTC PeerConnection helpers ─────
    const createPeerConnection = (remoteSocketId) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-offer", { to: remoteSocketId, offer });
        } catch (err) {
          console.error("Renegotiation error:", err);
        }
      };

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
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
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

    // Expose for debugging if you want
    // eslint-disable-next-line no-undef
    if (typeof window !== "undefined") {
      window.MeetingRoomInternal = { createOfferFor, createAnswerFor };
    }

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
        socket.off("typing");
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [socket, code, user]);

  // ─────────────────────────────
  // Public API from hook
  // ─────────────────────────────

  const sendMessage = (targetSocketId = "all") => {
    if (!chatInput.trim() || !socket) return;

    const msg = {
      id: Date.now(),
      user: { id: user.id, name: user.name },
      from: socket.id,
      to: targetSocketId,
      isPrivate: targetSocketId !== "all",
      text: chatInput.trim(),
      ts: new Date().toISOString(),
    };

    socket.emit("chat-message", { code, message: msg });
    // Push locally as well
    setMessages((prev) => [...prev, msg]);
    setChatInput("");
  };

  const notifyTyping = () => {
    if (!socket) return;
    socket.emit("typing", { code });
  };

  const toggleTrack = (kind) => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const track = stream.getTracks().find((t) => t.kind === kind);
    if (!track) return;

    track.enabled = !track.enabled;

    if (kind === "audio") setMicOn(track.enabled);
    if (kind === "video") setCameraOn(track.enabled);

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === kind);
      if (sender) sender.replaceTrack(track);
    });
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        setScreenSharing(true);

        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });

        screenTrack.onended = () => {
          const camTrack = localStreamRef.current.getVideoTracks()[0];
          setScreenSharing(false);

          Object.values(peerConnectionsRef.current).forEach((pc) => {
            const sender = pc
              .getSenders()
              .find((s) => s.track?.kind === "video");
            if (sender) sender.replaceTrack(camTrack);
          });
        };
      } catch (err) {
        console.error("Screen share error:", err);
      }
    }
  };

  const leave = () => {
    navigate("/");
  };

  return {
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
  };
}
