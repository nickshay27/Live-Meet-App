import { useState } from "react";
import { useSocket } from "../../contexts/SocketContext.jsx";
import { useParams } from "react-router-dom";

export default function useReactions() {
  const { socket } = useSocket();
  const { code } = useParams();

  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);

  // Emit reaction to room + show floating
  const sendReaction = (emoji) => {
    socket.emit("reaction", { code, emoji });
    spawnFloatingReaction(emoji);
  };

  const raiseHand = () => {
    sendReaction("✋");
  };

  // Floating emoji logic
  const spawnFloatingReaction = (emoji) => {
    const id = Date.now();

    setFloatingReactions((prev) => [...prev, { id, emoji }]);

    setTimeout(() => {
      setFloatingReactions((prev) =>
        prev.filter((r) => r.id !== id)
      );
    }, 2000);
  };

  return {
    showReactionMenu,
    setShowReactionMenu,
    floatingReactions,
    sendReaction,
    raiseHand
  };
}
