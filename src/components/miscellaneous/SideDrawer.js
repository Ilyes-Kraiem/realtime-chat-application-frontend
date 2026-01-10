import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Spinner,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { BellIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

import ChatLoading from "../ChatLoading";
import ProfileModal from "./ProfileModal";
import { getSender } from "../../config/ChatLogics";
import UserListItem from "../userAvatar/UserListItem";
import { ChatState } from "../../Context/ChatProvider";

function SideDrawer() {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const {
    user,
    setUser,
    setSelectedChat,
    notification,
    setNotification,
    chats,
    setChats,
  } = ChatState() || {};

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");

    // make sure these setters exist (in case ChatState is temporarily undefined)
    if (setUser) setUser(null);
    if (setSelectedChat) setSelectedChat(null);
    if (setChats) setChats([]);
    if (setNotification) setNotification([]);

    navigate("/");
  };

  const handleSearch = async () => {
    const q = search.trim();

    if (!q) {
      toast({
        title: "Please enter something in search",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-left",
      });
      return;
    }

    if (!user?.token) {
      toast({
        title: "Not authenticated",
        description: "Please login again.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
      navigate("/");
      return;
    }

    try {
      setLoading(true);

      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };

      const { data } = await axios.get(
        `/api/user?search=${encodeURIComponent(q)}`,
        config
      );

      setSearchResult(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Error occurred!",
        description: error?.response?.data?.message || "Failed to load the search results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    } finally {
      setLoading(false);
    }
  };

  const accessChat = async (userId) => {
    if (!user?.token) return;

    try {
      setLoadingChat(true);

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(`/api/chat`, { userId }, config);

      const safeChats = Array.isArray(chats) ? chats : [];
      if (data?._id && !safeChats.find((c) => c._id === data._id)) {
        setChats([data, ...safeChats]);
      }

      setSelectedChat(data);
      onClose();
    } catch (error) {
      toast({
        title: "Error fetching the chat",
        description: error?.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    } finally {
      setLoadingChat(false);
    }
  };

  const notifCount = Array.isArray(notification) ? notification.length : 0;

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bg="white"
        w="100%"
        p="5px 10px"
        borderWidth="5px"
      >
        <Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
          <Button variant="ghost" onClick={onOpen}>
            <i className="fas fa-search" />
            <Text display={{ base: "none", md: "flex" }} px={4}>
              Search User
            </Text>
          </Button>
        </Tooltip>

        <Text fontSize="2xl" fontFamily="Work sans">
          Talk-A-Tive
        </Text>

        <Box display="flex" alignItems="center" gap={2}>
          {/* Notifications */}
          <Menu>
            <MenuButton p={1}>
              <Box position="relative" display="inline-block">
                <BellIcon fontSize="2xl" m={1} />
                {notifCount > 0 && (
                  <Badge
                    position="absolute"
                    top="-1"
                    right="-1"
                    borderRadius="full"
                    px="2"
                    fontSize="0.7em"
                    colorScheme="red"
                  >
                    {notifCount}
                  </Badge>
                )}
              </Box>
            </MenuButton>

            <MenuList pl={2}>
              {notifCount === 0 && "No New Messages"}

              {Array.isArray(notification) &&
                notification.map((notif) => (
                  <MenuItem
                    key={notif._id}
                    onClick={() => {
                      setSelectedChat?.(notif.chat);

                      // ✅ IMPORTANT: use functional update (prevents stale state bugs)
                      setNotification?.((prev) =>
                        Array.isArray(prev)
                          ? prev.filter((n) => n._id !== notif._id)
                          : []
                      );
                    }}
                  >
                    {notif.chat?.isGroupChat
                      ? `New Message in ${notif.chat.chatName}`
                      : `New Message from ${getSender(
                          user,
                          notif.chat?.users || []
                        )}`}
                  </MenuItem>
                ))}
            </MenuList>
          </Menu>

          {/* Profile */}
          <Menu>
            <MenuButton
              as={Button}
              bg="white"
              rightIcon={<ChevronDownIcon />}
              isDisabled={!user}
            >
              <Avatar
                size="sm"
                cursor="pointer"
                name={user?.name || "User"}
                src={user?.pic}
              />
            </MenuButton>

            <MenuList>
              <ProfileModal user={user}>
                <MenuItem isDisabled={!user}>My Profile</MenuItem>
              </ProfileModal>
              <MenuDivider />
              <MenuItem onClick={logoutHandler}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Box>

      {/* Search Drawer */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Search Users</DrawerHeader>

          <DrawerBody>
            <Box display="flex" pb={2}>
              <Input
                placeholder="Search by name or email"
                mr={2}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <Button onClick={handleSearch}>Go</Button>
            </Box>

            {loading ? (
              <ChatLoading />
            ) : (
              Array.isArray(searchResult) &&
              searchResult.map((u) => (
                <UserListItem
                  key={u._id}
                  user={u}
                  handleFunction={() => accessChat(u._id)}
                />
              ))
            )}

            {loadingChat && <Spinner ml="auto" display="flex" />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default SideDrawer;
