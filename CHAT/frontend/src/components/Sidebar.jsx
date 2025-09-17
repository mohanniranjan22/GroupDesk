import {
  Box,
  VStack,
  Text,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Flex,
  Icon,
  Badge,
  Tooltip,
  Menu, MenuButton, MenuList, MenuItem, IconButton
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { FiLogOut, FiPlus, FiUsers,FiMoreVertical } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

import api from "../api";

const Sidebar = ({setSelectedGroup,socket}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newGroupName, setNewGroupName] = useState("");
  const[groups,setGroups]=useState([]);
  const[userGroups,setUserGroups]=useState([]);

  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isAdmin,setIsAdmin]=useState(false);
  const toast = useToast();
  const navigate=useNavigate();

  useEffect(()=>{

    checkAdminStatus();
    fetchGroups()

  },[])

      useEffect(() => {
        if (!socket) return;

        // Listener for new group creation
        const handleNewGroup = (group) => {
          setGroups((prev) => [...prev, group]);

          const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
          if (group.members.some((m) => m._id === userInfo._id)) {
            setUserGroups((prev) => [...prev, group._id]);
          }

          toast({
            title: "New Group Created",
            description: `${group.name} is now available`,
            status: "info",
            duration: 3000,
            isClosable: true,
          });
        };

        // Listener for group deletion
        const handleGroupDeleted = (groupId) => {
          setGroups((prev) => prev.filter((g) => g._id !== groupId));
          setUserGroups((prev) => prev.filter((id) => id !== groupId));
          setSelectedGroup((prev) => (prev?._id === groupId ? null : prev));

          toast({
            title: "Group Deleted",
            description: "A group has been removed by admin",
            status: "info",
            duration: 3000,
            isClosable: true,
          });
        };

        socket.on("new group", handleNewGroup);
        socket.on("group deleted", handleGroupDeleted);

        // Cleanup on unmount or socket change
        return () => {
          socket.off("new group", handleNewGroup);
          socket.off("group deleted", handleGroupDeleted);
        };
      }, [socket, toast, setSelectedGroup]);


  // check if login user is an admin
  const checkAdminStatus=()=>{
    const userInfo=JSON.parse(localStorage.getItem('userInfo') || {});
    // console.log(userInfo);
    // ! Update admin status
    setIsAdmin(userInfo?.isAdmin || false);
  }
  
  // fetch all groups

  const fetchGroups= async()=>{
    try{
      const userInfo=JSON.parse(localStorage.getItem('userInfo') || {});
      const token=userInfo.token;
      // console.log(token);

     const {data}= await api.get('/api/groups',{
        headers:{
          Authorization:`Bearer ${token}`
        }
        
      })
      // console.log(data);
      setGroups(data);
      const userGroupIds= data.filter((group)=>{
        // console.log(group);

        return group?.members?.some((member)=> member?._id === userInfo?._id)

      }).map(group => group?._id)
      // console.log(userGroupIds);
      setUserGroups(userGroupIds);

    }
    catch(error){
      console.log(error);

    }
  }
  
  //Create groups




  const handleCreateGroup = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const token = userInfo.token;

    const { data } = await api.post(
      "/api/groups",
      {
        name: newGroupName,
        description: newGroupDescription,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const newGroup = data.populatedGroup; // Make sure this matches your backend

    // Update local state immediately for the admin
    setGroups((prev) => [...prev, newGroup]);
    if (newGroup.members.some((m) => m._id === userInfo._id)) {
      setUserGroups((prev) => [...prev, newGroup._id]);
    }

    // Emit to other users if socket exists
    if (socket && socket.connected) {
      socket.emit("create group", newGroup);
    }

    toast({
      title: "Group Created",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    onClose();
    setNewGroupName("");
    setNewGroupDescription("");

  } catch (error) {
    console.log(error);
    toast({
      title: "Error creating group",
      status: "error",
      duration: 3000,
      isClosable: true,
      description: error?.response?.data?.message || "An error occurred",
    });
  }
};

            const handleDeleteGroup = async (groupId) => {
        try {
          const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
          const token = userInfo.token;

          await api.delete(`/api/groups/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          // Update local state immediately
          setGroups((prev) => prev.filter((g) => g._id !== groupId));
          setUserGroups((prev) => prev.filter((id) => id !== groupId));
          if (setSelectedGroup) setSelectedGroup(null);

          toast({
            title: "Group Deleted",
            status: "success",
            duration: 3000,
            isClosable: true,
          });

          // Emit to other users if socket exists
          if (socket && socket.connected) {
            socket.emit("delete group", groupId);
          }
        } catch (error) {
          console.log(error);
          toast({
            title: "Error deleting group",
            status: "error",
            duration: 3000,
            isClosable: true,
            description: error?.response?.data?.message || "An error occurred",
          });
        }
      };


  //logout

  const handleLogout=()=>{
    localStorage.removeItem("userInfo");
    navigate("/login");
  }
  //join group
  const handleJoinGroup= async(groupId) => {
    try{
       const userInfo=JSON.parse(localStorage.getItem('userInfo') || "{}");
       const token=userInfo.token;

       await api.post(`/api/groups/${groupId}/join`,
        {
        
       },{
        headers:{
          Authorization: `Bearer ${token}`
        }
       });

        
       await fetchGroups();
      console.log(groups);
     setSelectedGroup(groups.find((g) => g._id === groupId));
    

       toast({
        title:"Joined group successfully",
        status:"success",
        duration:3000,
        isClosable:true
       });
      

    } 

    catch(error){
      console.log(error);
      toast({
        title:"Error Joining Group",
        status:"error",
        duration:3000,
        isClosable:true,
        description:error?.response?.data?.message || 'An error occured'
       });

    }

  }
  //leave group

   const handleLeaveGroup= async(groupId) => {
    try{
       const userInfo=JSON.parse(localStorage.getItem('userInfo') || "{}");
       const token=userInfo.token;

       await api.post(
        `/api/groups/${groupId}/leave`,
        {
        
       },{
        headers:{
          Authorization: `Bearer ${token}`
        }
       });

        
       await fetchGroups();
      console.log(groups);
     setSelectedGroup(null);
    

       toast({
        title:"Left group successfully",
        status:"success",
        duration:3000,
        isClosable:true
       });
      

    } 

    catch(error){
      console.log(error);
      toast({
        title:"Error Leaving Group",
        status:"error",
        duration:3000,
        isClosable:true,
        description:error?.response?.data?.message || 'An error occured'
       });

    }

  }

 

 

  return (
    <Box
      h="100%"
      bg="white"
      borderRight="1px"
      borderColor="gray.200"
      width="300px"
      display="flex"
      flexDirection="column"
    >
      <Flex
        p={4}
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="white"
        position="sticky"
        top={0}
        zIndex={1}
        backdropFilter="blur(8px)"
        align="center"
        justify="space-between"
      >
        <Flex align="center">
          <Icon as={FiUsers} fontSize="24px" color="blue.500" mr={2} />
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            Groups
          </Text>
        </Flex>
        {isAdmin && (
          <Tooltip label="Create New Group" placement="right">
            <Button
              size="sm"
              colorScheme="blue"
              variant="ghost"
              onClick={onOpen}
              borderRadius="full"
            >
              <Icon as={FiPlus} fontSize="20px" />
            </Button>
          </Tooltip>
        )}
      </Flex>

      <Box flex="1" overflowY="auto" p={4} mb={16}>
        <VStack spacing={3} align="stretch">
          {groups.map((group) => (
            <Box
              key={group.id}
              p={4}
              cursor="pointer"
              borderRadius="lg"
              bg={userGroups.includes(group?._id)? "blue.50" : "gray.50"}
              borderWidth="1px"
              borderColor={userGroups.includes(group?._id) ? "blue.200" : "gray.200"}
              transition="all 0.2s"
              _hover={{
                transform: "translateY(-2px)",
                shadow: "md",
                borderColor: "blue.300",
              }}
            >
              <Flex justify="space-between" align="center">
                <Box 
                onClick={()=>
                  userGroups.includes(group?._id) && setSelectedGroup(group)
                }
                
                flex="1">
                  <Flex align="center" mb={2}>
                    <Text fontWeight="bold" color="gray.800">
                      {group.name}
                    </Text>
                    {userGroups.includes(group?._id)&& (
                      <Badge ml={2} colorScheme="blue" variant="subtle">
                        Joined
                      </Badge>
                    )}
                  </Flex>
                  <Text fontSize="sm" color="gray.600" noOfLines={2}>
                    {group.description}
                  </Text>
                </Box>
                
         <Flex ml={3} align="flex-end">
  <Menu>
    <MenuButton
      as={IconButton}
      icon={<FiMoreVertical />}
      size="sm"
      variant="ghost"
      aria-label="Options"
      _hover={{ bg: "gray.100" }} // subtle hover on the three-dot button
    />
    <MenuList>
      {!userGroups.includes(group?._id) ? (
        <MenuItem
          onClick={() => handleJoinGroup(group._id)}
          color="blue.600"
          _hover={{ bg: "blue.50", color: "blue.700" }}
        >
          Join
        </MenuItem>
      ) : (
        <>
          <MenuItem
            onClick={() => handleLeaveGroup(group._id)}
            color="red.500"
            _hover={{ bg: "red.50", color: "red.600" }}
          >
            Leave
          </MenuItem>
          {isAdmin && (
            <MenuItem
              onClick={() => handleDeleteGroup(group._id)}
              color="red.600"
              _hover={{ bg: "red.100", color: "red.700" }}
            >
              Delete
            </MenuItem>
          )}
        </>
      )}
    </MenuList>
  </Menu>
</Flex>



              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>

      <Box
        p={4}
        borderTop="1px solid"
        borderColor="gray.200"
        bg="gray.50"
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        width="100%"
      >
        <Button
          
          onClick={handleLogout}
          variant="ghost"
          colorScheme="red"
          leftIcon={<Icon as={FiLogOut} />}
          _hover={{
            bg: "red.50",
            transform: "translateY(-2px)",
            shadow: "md",
          }}
          transition="all 0.2s"
        >
          Logout
        </Button>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader>Create New Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Group Name</FormLabel>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                focusBorderColor="blue.400"
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Description</FormLabel>
              <Input
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Enter group description"
                focusBorderColor="blue.400"
              />
            </FormControl>

            <Button
              colorScheme="blue"
              mr={3}
              mt={4}
              width="full"
              onClick={handleCreateGroup}
            >
              Create Group
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Sidebar;
