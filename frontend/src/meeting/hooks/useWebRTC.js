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

  // PUBLIC CHAT (meeting-wide)
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // PRIVATE CHAT STATE
  const [chatTarget, setChatTarget] = useState("everyone"); // "everyone" or socketId
  const [dmMessages, setDmMessages] = useState({});          // { socketId: [msgs] }
  const [activeDM, setActiveDM] = useState(null);            // active DM socketId
  const [unreadDM, setUnreadDM] = useState({});              // { socketId: count }
  const [dmTyping, setDmTyping] = useState({});              // { socketId: bool }

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const peerConnectionsRef = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});

  /* ----------------------------------------------------------
   * FETCH MEETING DETAILS
   * --------------------------------------------------------*/
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

  /* ----------------------------------------------------------
   * MAIN WEBRTC + SOCKET SETUP
   * --------------------------------------------------------*/
  useEffect(() => {
    if (!socket || !code || !user) return;

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
            [joinedUser.socketId]: joinedUser,
          }));
          createOffer(joinedUser.socketId);
        });

        socket.on("user-left", ({ socketId }) => {
          setParticipants((prev) => {
            const cp = { ...prev };
            delete cp[socketId];
            return cp;
          });

          setRemoteStreams((prev) => {
            const cp = { ...prev };
            delete cp[socketId];
            return cp;
          });

          if (peerConnectionsRef.current[socketId]) {
            peerConnectionsRef.current[socketId].close();
            delete peerConnectionsRef.current[socketId];
          }
        });

        socket.on("webrtc-offer", async ({ from, offer }) => {
          await createAnswer(from, offer);
        });

        socket.on("webrtc-answer", async ({ from, answer }) => {
          const pc = peerConnectionsRef.current[from];
          if (!pc) return;
          await pc.setRemoteDescription(answer);
        });

        socket.on("webrtc-ice-candidate", async ({ from, candidate }) => {
          const pc = peerConnectionsRef.current[from];
          if (pc) {
            try {
              await pc.addIceCandidate(candidate);
            } catch (err) {
              console.error("ICE Error:", err);
            }
          }
        });

        // PUBLIC CHAT
        socket.on("chat-message", (msg) => {
          setMessages((prev) => [...prev, msg]);
        });

       // PRIVATE MESSAGE
socket.on("private-message", (msg) => {
  // store in DM threads
  setDmMessages((prev) => ({
    ...prev,
    [msg.from]: [...(prev[msg.from] || []), msg],
  }));

  // also log in global timeline (optional)
  setMessages((prev) => [...prev, { ...msg, isPrivate: true }]);

  // 🔔 Play notification sound for incoming DM
  try {
    const audio = new Audio("/sounds/dm.mp3"); // place file in public/sounds/dm.mp3
    audio.play().catch(() => {});
  } catch (e) {
    console.log("Notification sound error:", e);
  }

  // unread counter if chat not active
  if (activeDM !== msg.from) {
    setUnreadDM((prev) => ({
      ...prev,
      [msg.from]: (prev[msg.from] || 0) + 1,
    }));
  }
});


        // TYPING INDICATOR FOR DM
        socket.on("typing", ({ from, isTyping }) => {
          setDmTyping((prev) => ({
            ...prev,
            [from]: isTyping,
          }));
        });

      } catch (err) {
        console.error(err);
        setError("Could not access camera/microphone");
      }
    };

    /* ---------------------------
     * CREATE PEER CONNECTION
     * -------------------------*/
    const createPeerConnection = (socketId) => {
const pc = new RTCPeerConnection({
  iceServers: [
  {
    urls: "stun:stun.metered.ca:80",
  },
  {
    urls: "turn:global.relay.metered.ca:80",
    username: "dcd4ef71add2cf037c05b635",
    credential: "+orXegGVTJCFptMQ",
  },
  {
    urls: "turn:global.relay.metered.ca:80?transport=tcp",
    username: "dcd4ef71add2cf037c05b635",
    credential: "+orXegGVTJCFptMQ",
  },
  {
    urls: "turn:global.relay.metered.ca:443",
    username: "dcd4ef71add2cf037c05b635",
    credential: "+orXegGVTJCFptMQ",
  },
  {
    urls: "turns:global.relay.metered.ca:443?transport=tcp",
    username: "dcd4ef71add2cf037c05b635",
    credential: "+orXegGVTJCFptMQ",
  },
];

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
          [socketId]: stream,
        }));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-ice-candidate", {
            to: socketId,
            candidate: event.candidate,
          });
        }
      };

      peerConnectionsRef.current[socketId] = pc;
      return pc;
    };

    /* ---------------------------
     * OFFER + ANSWER HANDLING
     * -------------------------*/
    const createOffer = async (socketId) => {
      let pc = peerConnectionsRef.current[socketId];
      if (!pc) pc = createPeerConnection(socketId);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc-offer", { to: socketId, offer });
    };

    const createAnswer = async (socketId, offer) => {
      let pc = peerConnectionsRef.current[socketId];
      if (!pc) pc = createPeerConnection(socketId);

      await pc.setRemoteDescription(offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc-answer", { to: socketId, answer });
    };

    useWebRTC._internal = { createOffer, createAnswer };

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
        socket.off("private-message");
        socket.off("typing");
      }

      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [socket, code, user, activeDM]);

  /* ----------------------------------------------------------
   * SEND MESSAGE (PUBLIC or PRIVATE)
   * --------------------------------------------------------*/
  const sendMessage = () => {
    if (!chatInput.trim() || !socket) return;

    const msg = {
      id: Date.now(),
      user: { id: user.id, name: user.name },
      text: chatInput.trim(),
      ts: new Date().toISOString(),
      target: chatTarget,
    };

    if (chatTarget === "everyone") {
      socket.emit("chat-message", { code, message: msg });
      setMessages((prev) => [...prev, msg]);
    } else {
      // PRIVATE MESSAGE
      socket.emit("private-message", { to: chatTarget, message: msg });

      // store in local DM thread
      setDmMessages((prev) => ({
        ...prev,
        [chatTarget]: [
          ...(prev[chatTarget] || []),
          { ...msg, from: "self", fromUser: user.name },
        ],
      }));

      // optional: also log to global timeline
      setMessages((prev) => [...prev, { ...msg, isPrivate: true }]);
    }

    setChatInput("");
    // stop typing indication
    if (chatTarget !== "everyone") {
      sendTyping(false);
    }
  };

  /* ----------------------------------------------------------
   * TYPING INDICATOR
   * --------------------------------------------------------*/
  const sendTyping = (isTyping) => {
    if (!socket) return;
    if (chatTarget === "everyone") return;

    socket.emit("typing", { to: chatTarget, isTyping });
  };

  /* ----------------------------------------------------------
   * MIC / CAMERA TOGGLE
   * --------------------------------------------------------*/
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

  /* ----------------------------------------------------------
   * SCREEN SHARE
   * --------------------------------------------------------*/
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const screenTrack = screen.getVideoTracks()[0];

        setScreenSharing(true);

        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });

        screenTrack.onended = () => {
          const camTrack = localStreamRef.current.getVideoTracks()[0];
          setScreenSharing(false);

          Object.values(peerConnectionsRef.current).forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === "video");
            if (sender) sender.replaceTrack(camTrack);
          });
        };
      } catch (err) {
        console.log("ScreenShare Error", err);
      }
    }
  };

  /* ----------------------------------------------------------
   * LEAVE MEETING
   * --------------------------------------------------------*/
  const leave = () => {
    navigate("/");
  };

  return {
    meeting,
    participants,
    localVideoRef,
    remoteStreams,

    micOn,
    cameraOn,
    toggleTrack,

    screenSharing,
    toggleScreenShare,

    messages,
    chatInput,
    setChatInput,
    sendMessage,

    leave,
    error,

    // PRIVATE CHAT / DM STUFF
    chatTarget,
    setChatTarget,
    dmMessages,
    activeDM,
    setActiveDM,
    unreadDM,
    dmTyping,
    sendTyping,
  };
}
