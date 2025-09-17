const mongoose= require("mongoose");
const bcrypt= require("bcryptjs");

// Schems
const messageSchema= new mongoose.Schema({

    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
       
    },
    // email:{
    //     type:String,
    //     required:true,
    //     trim:true,
    //     lowercase: true
    // },
    // password:{
    //     type:String,
    //     required:true
    // },
    content:{
        type:String,
        required:true
    },group:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Group"
    },
    // isAdmin:{
    //     type:Boolean,
    //     default:false
    // }
},{timestamps:true});

const Message= mongoose.model("Message",messageSchema);
module.exports= Message;