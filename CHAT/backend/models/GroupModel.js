const bcrypt= require("bcryptjs");
const { default: mongoose, mongo } = require("mongoose");

// Schema

const groupSchema = new mongoose.Schema({
    name :{
        type:String,
        required:true,
        trim:true,
         unique: true
    },
   
   description:{
    type:String,
    required: true
   },
   members:[
    {type: mongoose.Schema.Types.ObjectId, 
    ref:"User"}],
   admin:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
   }

},{timestamps:true});

const Group= mongoose.model("Group", groupSchema);
module.exports=Group;