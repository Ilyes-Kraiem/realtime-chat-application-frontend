import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Lottie from "lottie-react";

import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";

import "./styles.css";
import animationData from "../animations/typing.json";

import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";

export default function SingleChat({ fetchAgain, setFetchAgain }) {
  const toast = useToast();

  const {
    selectedChat,
    setSelectedChat,
    user,
    setNotification,
    socketRef,
    onlineUsers,
  } = ChatState();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const selectedChatRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // online status helper
  const getOtherUserId = (chat) => {
    if (!chat || chat.isGroupChat) return null;
    const other = chat.users?.find((u) => u?._id !== user?._id);
    return other?._id ? String(other._id) : null;
  };

  const isOtherUserOnline = (chat) => {
    const otherId = getOtherUserId(chat);
    if (!otherId) return false;
    return (Array.isArray(onlineUsers) ? onlineUsers : []).includes(otherId);
  };

  // socket listeners
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const onTyping = () => setIsTyping(true);
    const onStopTyping = () => setIsTyping(false);

    const onMessageReceived = (newMsg) => {
      const current = selectedChatRef.current;

      // if user is in this chat => append real-time (with dedupe)
      if (current && current._id === newMsg?.chat?._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev; // ✅ dedupe
          return [...prev, newMsg];
        });
        return;
      }

      // otherwise => notifications
      setNotification((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        if (safePrev.some((m) => m._id === newMsg._id)) return safePrev;
        return [newMsg, ...safePrev];
      });

      setFetchAgain((prev) => !prev);
    };

    socket.on("typing", onTyping);
    socket.on("stop typing", onStopTyping);
    socket.on("message received", onMessageReceived);

    return () => {
      socket.off("typing", onTyping);
      socket.off("stop typing", onStopTyping);
      socket.off("message received", onMessageReceived);
    };
  }, [socketRef, setFetchAgain, setNotification]);

  // join room + fetch messages
  useEffect(() => {
    const socket = socketRef?.current;

    if (!selectedChat?._id || !user?.token) {
      setMessages([]);
      return;
    }

    if (socket) socket.emit("join chat", selectedChat._id);

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${user.token}` } };

        const { data } = await axios.get(`/api/message/${selectedChat._id}`, config);
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        toast({
          title: "Error occurred!",
          description: err?.response?.data?.message || "Failed to load messages",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChat, user, toast, socketRef]);

  // send message
  const sendMessage = async (e) => {
    if (e.key !== "Enter") return;
    if (!newMessage.trim() || !selectedChat?._id) return;

    const socket = socketRef?.current;
    if (socket) socket.emit("stop typing", selectedChat._id);

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const content = newMessage.trim();
      setNewMessage("");

      const { data } = await axios.post(
        "/api/message",
        { content, chatId: selectedChat._id },
        config
      );

      // ✅ sender sees instantly (with dedupe)
      setMessages((prev) => {
        if (prev.some((m) => m._id === data._id)) return prev;
        return [...prev, data];
      });

      // ✅ receiver sees instantly
      if (socket) socket.emit("new message", data);

      setFetchAgain((prev) => !prev);
    } catch (err) {
      toast({
        title: "Error occurred!",
        description: err?.response?.data?.message || "Failed to send message",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  // typing handler
  const typingHandler = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    const socket = socketRef?.current;
    if (!socket || !socket.connected || !selectedChat?._id) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop typing", selectedChat._id);
      setTyping(false);
    }, 2000);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat(null)}
            />

            {!selectedChat.isGroupChat ? (
              <Box display="flex" alignItems="center" gap="10px">
                <Text fontWeight="bold" m={0}>
                  {getSender(user, selectedChat.users)}
                </Text>

                <Text fontSize="sm" m={0}>
                  {isOtherUserOnline(selectedChat) ? "🟢 Online" : "⚪ Offline"}
                </Text>

                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </Box>
            ) : (
              <Box display="flex" alignItems="center" gap="10px">
                <Text fontWeight="bold" m={0}>
                  {selectedChat.chatName.toUpperCase()}
                </Text>
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                />
              </Box>
            )}
          </Text>

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner size="xl" w={20} h={20} alignSelf="center" m="auto" />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}

            <FormControl onKeyDown={sendMessage} isRequired mt={3}>
              {isTyping && (
                <div style={{ width: 70, marginBottom: 10 }}>
                  <Lottie animationData={animationData} loop autoplay />
                </div>
              )}

              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={typingHandler}
              />
            </FormControl>
          </Box>
        </>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
}
