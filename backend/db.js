const mongoose = require("mongoose");
const { string } = require("zod");

mongoose.connect("mongodb://localhost:27017/paytm");

const userschema = new mongoose.Schema({
    username:{
        type:String,
        requirement:true,
        unique:true,
        trim:true,
        lowercase:true,
        minLength:3,
        maxLength:10

    },
    password:{
        type:String,
        required:true,
        unique:true,
        minLength:4
    },
    firstname:{
        type:String,
        required:true,
        trim:true,
        maxlength:10
    },
    lastname:{
        type:String,
        required:true,
        trim:true,
        maxlength:10
    }
});

const User = mongoose.model('users', userschema);

module.exports={
    User
}