import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Flex,
  Icon,
  Avatar,
  InputGroup,
  InputRightElement,
  useToast,
} from "@chakra-ui/react";
import { FiSend, FiInfo, FiMessageCircle } from "react-icons/fi";
import UsersList from "./UsersList";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import api from "../api";

const ChatArea = ({selectedGroup,socket}) => {

  const [messages,setMessages]=useState([]);
  const[newMessage, setNewMessage]=useState("");
  const[connectedUsers,setConnectedUsers]=useState([]);
  const[isTyping,setIsTyping]=useState(false);
  // const[typingUsers,setTypingUsers]= useState(new Set());
  const [typingUsers, setTypingUsers] = useState([]);

  const messagesEndRef=useRef(null);
  const typingTimeOutRef=useRef(null);
  const toast=useToast();

  const currentUser= JSON.parse(localStorage.getItem("userInfo")||"{}");
  console.log(currentUser);

  useEffect(()=>{
    if(selectedGroup && socket){
      // fetch messages
      fetchMessages();
      // Only use notifications for toast messages (no list update here)
      socket.on("notification", (notification) => {
        toast({
          title: notification?.type === "USER_JOINED" ? "New User" : "Notification",
          description: notification.message,
          status: "info",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
});

      socket.emit("join room",selectedGroup?._id);

      socket.on("message received",(newMessage)=>{
        setMessages((prev)=>[...prev, newMessage]);
      });

     // Always trust the backend for the full list
      socket.on("users in room", (users) => {
        setConnectedUsers(users);
      });

      


      // socket.on('user typing',({username})=>{
      //   setTypingUsers((prev)=> new Set(prev).add(username));

      // })

      // socket.on('user stop typing',({username})=>{
      //   setTypingUsers((prev)=>{
      //     const newSet= new Set(prev);
      //     newSet.delete(username);
      //     return newSet
      //   })
      // })
          // ✅ typing listeners go HERE
  //   socket.on("user typing", ({ username, userId }) => {
  //     console.log("Received typing from:", username);
  //     if (userId !== currentUser._id) {
  //       setTypingUsers((prev) => new Set(prev).add(username));
  //     }
  //   });

  //   socket.on("user stop typing", ({ username, userId }) => {
  //      console.log("Received typing from:", username, "with userId:", userId);
  // console.log("Current user ID:", currentUser._id);
  //     if (userId !== currentUser._id) {
  //       setTypingUsers((prev) => {
  //         const newSet = new Set(prev);
  //         newSet.delete(username);
  //         return newSet;
  //       });
  //     }
  //   });
        socket.on("user typing", ({ username, userId }) => {
        console.log("Received typing from:", username);

        if (userId !== currentUser._id) {
          setTypingUsers((prev) =>
            prev.includes(username) ? prev : [...prev, username]
          );
        }
      });

      socket.on("user stop typing", ({ username, userId }) => {
        if (userId !== currentUser._id) {
          setTypingUsers((prev) => prev.filter((u) => u !== username));
        }
      });


      //cleanup
      return()=>{
      socket.emit('leave room',selectedGroup?._id);
      socket.off('message received');
      socket.off('users in room');
      
      socket.off('notification');
      socket.off('user typing');
      socket.off('user stop typing');
      }


    }
  },[selectedGroup,socket,toast]);

     // fetch messages
     const fetchMessages=async()=>{

        const currentUser= JSON.parse(localStorage.getItem("userInfo")||"{}");
        const token= currentUser?.token;
        try{ 
            const {data}= await api.get(`api/messages/${selectedGroup?._id}`,
              {
                headers:{Authorization:`Bearer ${token}`}
              }
            );
            // console.log(data);
            setMessages(data);
        }
        catch(error){
          console.log(error);

        }


     }

     //send message

     const sendMessage = async () => {
      if (!newMessage.trim()) return;

      const currentUser = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const token = currentUser?.token;

      try {
        const { data } = await api.post(
          "/api/messages",
          {
            content: newMessage,
            groupId: selectedGroup?._id,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        socket.emit("new message", {
          ...data,
          groupId: selectedGroup?._id,
        });

        setMessages((prev) => [...prev, data]);
        setNewMessage("");
      } catch (error) {
        console.error("Send message error:", error.response?.data || error.message);
        toast({
          title: "Error sending message",
          description: error.response?.data?.message || "Something went wrong",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };


     //handletyping
          const handleTyping = (e) => {
        setNewMessage(e.target.value);

        if (!isTyping && selectedGroup) {
          setIsTyping(true);
          socket.emit("typing", {
            groupId: selectedGroup?._id,
            username: currentUser.username,
            userId: currentUser._id,
          });
          console.log("Sent typing event", currentUser.username);

        }

        // clear existing timeout
        if (typingTimeOutRef.current) {
          clearTimeout(typingTimeOutRef.current);
        }

        // set new timeout
        typingTimeOutRef.current = setTimeout(() => {
          if (selectedGroup) {
            socket.emit("stop typing", {
              groupId: selectedGroup?._id,
              username: currentUser.username,
              userId: currentUser._id,
            });
          }
          setIsTyping(false);
        }, 8000);
      };



     //format time
     const formatTime=(date)=>{
      return new Date(date).toLocaleTimeString("en-US",{
        hour:"2-digit",
        minute:"2-digit"
      })
     }
     //render typing indicator
          const renderTypingIndicator = () => {
        if (typingUsers.length === 0) return null;

        return typingUsers.map((username) => (
          <Box key={username} alignSelf="flex-end" maxW="70%">
            <Flex align="center" bg="gray.50" p={2} borderRadius="lg" gap={2}>
              <Text fontSize="sm" color="gray.500" fontStyle="italic">
                {username} is typing...
              </Text>
              <Avatar size="xs" name={username} />
            </Flex>
          </Box>
        ));
      };



      console.log("typingUsers state:", Array.from(typingUsers));





  // Sample data for demonstration
  const sampleMessages = [
    {
      id: 1,
      content: "Hey team! Just pushed the new updates to staging.",
      sender: { username: "Sarah Chen" },
      createdAt: "10:30 AM",
      isCurrentUser: false,
    },
    {
      id: 2,
      content: "Great work! The new features look amazing 🚀",
      sender: { username: "Alex Thompson" },
      createdAt: "10:31 AM",
      isCurrentUser: false,
    },
    {
      id: 3,
      content: "Thanks! Let's review it in our next standup.",
      sender: { username: "You" },
      createdAt: "10:32 AM",
      isCurrentUser: true,
    },
  ];

  const sampleUsers = [
    { id: 1, username: "Sarah Chen", isOnline: true },
    { id: 2, username: "Alex Thompson", isOnline: true },
    { id: 3, username: "John Doe", isOnline: false },
  ];

  return (
    <Flex h="100%" position="relative">
      <Box
        flex="1"
        display="flex"
        flexDirection="column"
        bg="gray.50"
        maxW={`calc(100% - 260px)`}
      >
        {/* Chat Header */}
        {selectedGroup ? (
          <>
          <Flex
          px={6}
          py={4}
          bg="white"
          borderBottom="1px solid"
          borderColor="gray.200"
          align="center"
          boxShadow="sm"
        >
          <Icon as={FiMessageCircle} fontSize="24px" color="blue.500" mr={3} />
          <Box flex="1">
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              {selectedGroup.name}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {selectedGroup.description}
            </Text>
          </Box>
          <Icon
            as={FiInfo}
            fontSize="20px"
            color="gray.400"
            cursor="pointer"
            _hover={{ color: "blue.500" }}
          />
        </Flex>

        {/* Messages Area */}
        <VStack
          flex="1"
          overflowY="auto"
          spacing={4}
          align="stretch"
          px={6}
          py={4}
          position="relative"
          sx={{
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              width: "10px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "gray.200",
              borderRadius: "24px",
            },
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              alignSelf={
                message.sender._id === currentUser?._id 
                ? "flex-start" :
                 "flex-end"}
              maxW="70%"
            >
              <Flex direction="column" gap={1}>
                <Flex
                  align="center"
                  mb={1}
                  justifyContent={
                   message.sender._id === currentUser?._id 
                    ? "flex-start" : "flex-end"
                  }
                  gap={2}
                >
                  {message.sender._id === currentUser?._id 
                   ? (
                    <>
                      <Avatar size="xs" name={message.sender.username} />
                      <Text fontSize="xs" color="gray.500">
                        You • {formatTime(message.createdAt)}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text fontSize="xs" color="gray.500">
                        {message.sender.username} • {formatTime(message.createdAt)}
                      </Text>
                      <Avatar size="xs" name={message.sender.username} />
                    </>
                  )}
                </Flex>

                <Box
                  bg={message.sender._id === currentUser?._id 
                     ? "blue.500" : "white"}
                  color={message.sender._id === currentUser?._id 
                     ? "white" : "gray.800"}
                  p={3}
                  borderRadius="lg"
                  boxShadow="sm"
                >
                  <Text>{message.content}</Text>
                </Box>
              </Flex>
            </Box>
          ))}
          

        </VStack>


        {/* Typing indicator just above input */}
        {renderTypingIndicator()}

        {/* Message Input */}
        <Box
          p={4}
          bg="white"
          borderTop="1px solid"
          borderColor="gray.200"
          position="relative"
          zIndex="1"
        >
          <InputGroup size="lg">
           

            <Input
            placeholder="Type your message..."
            pr="4.5rem"
            bg="gray.50"
            border="none"
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            _focus={{
              boxShadow: "none",
              bg: "gray.100",
            }}
          />
          <InputRightElement width="4.5rem">
            <Button
              h="1.75rem"
              size="sm"
              colorScheme="blue"
              borderRadius="full"
              onClick={sendMessage}
              _hover={{ transform: "translateY(-1px)" }}
              transition="all 0.2s"
            >
              <Icon as={FiSend} />
            </Button>
            </InputRightElement>

          </InputGroup>
        </Box>
                </>
        ):(
          <>
          <Flex
          h="100%"
          direction="column"
          align="center"
          justify="center"
          p={8}
          textAlign="center"

          >
            <Icon as={FiMessageCircle}
            fontSize="64px"
            color="gray.300"
            mb={4}
            />

            <Text fontSize="xl" fontWeight="medium" 
            color="green.500" mb={2}>
              Welcome to the chat
            </Text>
            <Text color="gray.500" mb={2}>
              Select a group from the sidebar to start chatting
            </Text>
          </Flex>
        </>
        )}
      </Box>

      {/* UsersList with fixed width */}
      <Box
        width="260px"
        position="sticky"
        right={0}
        top={0}
        height="100%"
        flexShrink={0}
      >
       {selectedGroup && <UsersList users={connectedUsers} /> } 
      </Box>
    </Flex>
  );
};

export default ChatArea;
