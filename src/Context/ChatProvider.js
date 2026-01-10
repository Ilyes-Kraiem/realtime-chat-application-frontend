import { createContext, useContext, useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const ChatContext = createContext();
const ENDPOINT = "http://localhost:5000";

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [notification, setNotification] = useState([]);

  const socketRef = useRef(null);

  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) setUser(userInfo);
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    if (socketRef.current) return; 

    const socket = io(ENDPOINT, {
      transports: ["polling", "websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ socket connected:", socket.id);
      socket.emit("setup", user);
    });

    socket.on("online users", (list) => {
      const safe = Array.isArray(list) ? list.map(String) : [];
      setOnlineUsers(safe);
      console.log("🟢 online users initial:", safe);
    });

    socket.on("user online", (userId) => {
      const id = String(userId);
      setOnlineUsers((prev) => (prev.includes(id) ? prev : [...prev, id]));
      console.log("🟢 user online:", id);
    });

    socket.on("user offline", (userId) => {
      const id = String(userId);
      setOnlineUsers((prev) => prev.filter((x) => x !== id));
      console.log("⚪ user offline:", id);
    });

    socket.on("disconnect", (reason) => {
      console.log("⚠️ socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.log("❌ socket connect_error:", err.message);
    });

  }, [user]);

  return (
    <ChatContext.Provider
      value={{
        user,
        setUser,
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        notification,
        setNotification,
        socketRef,
        onlineUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => useContext(ChatContext);
export default ChatProvider;
