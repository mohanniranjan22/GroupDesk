const express= require("express");
const Group= require("../models/GroupModel");
const {protect,isAdmin}= require("../middleware/authMiddleware");

const groupRouter= express.Router();

// Create a new group

groupRouter.post('/',protect,isAdmin,async(req,res)=>{
    console.log(req.user);
    try{
        const{name,description}=req.body;
        const group= await Group.create({
            name,
            description,
            admin:req.user._id,
            members:[req.user._id]
        });
        const populatedGroup= await Group.findById(group._id)
        .populate("admin","username email")
        .populate("members","username email");
        res.status(201).json({populatedGroup});

    }
    catch(err){
        res.status(400).json({message:err.message});
    }
})


// Delete group
groupRouter.delete("/:groupId", protect, isAdmin, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    await Group.deleteOne({ _id: req.params.groupId }); // FIXED

    res.json({ message: "Group deleted successfully", groupId: req.params.groupId });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



// get all groups
groupRouter.get("/",protect, async(req,res)=>{
    try{
        const groups= await Group.find().populate("admin","username email")
        .populate("members","username email");
        res.json(groups);

    }
    catch(error){
        res.status(400).json({message:error.message});

    }
});

// Join group

groupRouter.post("/:groupId/join",protect,async(req,res)=>{
   try{
     const group= await Group.findById(req.params.groupId);
    console.log(group);
    if(!group){
        return res.status(404).json({message:"Group not found"});
    }
   if (group.members.some(memberId => memberId.toString() === req.user._id.toString())){
        return res.status(400).json({
            message:"Already a member of this group"
        })
    }
    group.members.push(req.user._id);
    await group.save();
    res.json({message:"Successfully joined the group"})
   }
   catch(error){
    res.status(400).json({message:error.message});
   }

});

// Leave group
groupRouter.post("/:groupId/leave",protect,async(req,res)=>{
    try{
        // find the group by ID
        const group= await Group.findById(req.params.groupId);
        if(!group){
            return res.status(404).json({message:"Group not found"});

        }
        // Check if user is part of the group
        if(!group.members.includes(req.user._id)){
            return res.status(400).json({message:"Not a member of this group"});
        }

        // remove user from members array
        group.members= group.members.filter(
            (memberId) => memberId.toString() !== req.user._id.toString()
        );

        await group.save();

        res.json({message:"Successfully left the group"});
    }
    catch(error){

    }
})
module.exports=groupRouter;