const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/paytm", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB connected successfully");
}).catch((err) => {
    console.error("MongoDB connection error:", err);
});

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 10
    },
    password:{
        type: String,
        required: true,
        minlength: 4
    },
    firstname:{
        type: String,
        required: true,
        trim: true,
        maxlength: 10
    },
    lastname:{
        type: String,
        required: true,
        trim: true,
        maxlength: 10
    }
});

const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    }
});

const User = mongoose.model('User', userSchema);
const Account = mongoose.model('Account', accountSchema);

module.exports = {
    User,
    Account
}