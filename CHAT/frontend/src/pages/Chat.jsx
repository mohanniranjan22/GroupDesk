import { Box, Flex } from "@chakra-ui/react";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { useEffect, useState } from "react";  
import io from "socket.io-client";

const ENDPOINT = import.meta.env.VITE_API_URL || "http://localhost:5000";



const Chat = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const[socket,setSocket]=useState(null);

  useEffect(()=>{
    const userInfo= JSON.parse(localStorage.getItem("userInfo" ||"{}"));
    const newSocket= io(ENDPOINT,{
      auth:{user:userInfo}
    });
    setSocket(newSocket);
    return ()=>{
      if(newSocket){
        newSocket.disconnect();
      }
    }
  },[])
  return (
    <Flex h="100vh">
      <Box w="300px" borderRight="1px solid" borderColor="gray.200">
        <Sidebar setSelectedGroup={setSelectedGroup}  socket={socket}/> 
      </Box>
      <Box flex="1">
        {socket && <ChatArea selectedGroup={selectedGroup} socket={socket} /> }
      </Box>/
    </Flex>
  );
};

export default Chat;
