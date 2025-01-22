const express = require("express")
const zod = require("zod")
const bcrypt = require("bcrypt")
const router = express.Router();
const {User, Account} = require('../db');
const JWT_SECRET = require("../config");
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../middleware");







//zod schema
const signupschema = zod.object({
    username:zod.string(),
    firstname:zod.string(),
    lastname:zod.string(),
    password: zod.string()

})

const signinschema = zod.object({
    username:zod.string(),
    password: zod.string()

})

const updatebody = zod.object({
    password:zod.string().optional(),
    firstname:zod.string().optional(),
    lastname:zod.string().optional()
})


const find = zod.object({
    firstname:zod.string().optional(),
    lastname:zod.string().optional()
})
//signup and signin routes

router.post("/signup", async(req, res)=>{
    const body = req.body;
    const {success, data} = signupschema.safeParse(body);
    if (!success){
        return res.status(400).json({
            message:"Incorrect credentials"
        })
    }

    const existinguser = await User.findOne({
        username: data.username
    })

    if (existinguser){
        return res.status(409).json({
            message:"Username already taken"
        })
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
        username: data.username,
        firstname: data.firstname,
        lastname: data.lastname,
        password: hashedPassword
    });


    await Account.create({
        userId: user._id,
        balance: Math.random() * 10000
    });

    const token = jwt.sign({
        userId:user._id
    }, JWT_SECRET)

    res.json({
        message: "User created successfully",
        token:token
    })
});

router.post("/signin", async (req, res) => { // Changed to POST
    const body = req.body;
    const { success, data } = signinschema.safeParse(body);
    if (!success) {
        return res.status(400).json({ // Changed status code to 400
            message: "Incorrect credentials"
        });
    }

    try {
        const existingUser = await User.findOne({ username: data.username }); // await added

        if (!existingUser) {
            return res.status(401).json({ // Changed status code to 401
                message: "Incorrect username"
            });
        }

        // Add password verification here.  This is crucial for security!
        // Example using bcrypt:
        const passwordMatch = await bcrypt.compare(data.password, existingUser.password);
        if (!passwordMatch) {
            return res.status(401).json({
                message: "Incorrect password"
            });
        }

        const token = jwt.sign({ userId: existingUser._id }, JWT_SECRET);
        res.json({ message: "Sign in successful", token });
    } catch (error) {
        console.error("Sign in error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


router.put("/",authMiddleware,async(req, res)=>{
    const {success, data} =updatebody.safeParse(req.body);
    if(!success){
        return res.status(400).json({
            message:"Error while updating information"
        })
    }
    
    if (data.password){
        data.password = await bcrypt.hash(data.password, 10);
    }

    await User.updateOne({_id:req.userId},data);
    
    res.json({
        message:"Updated successfully"
    })
})

router.get("/find", async (req, res) => {
    const filter = req.query.filter || "";
    
    try {
        const users = await User.find({
            $or: [
                { firstname: { $regex: filter, $options: "i" }},
                { lastname: { $regex: filter, $options: "i" }}
            ]
        });

        res.json({
            users: users.map(user => ({
                userName: user.username,
                firstName: user.firstname,
                lastName: user.lastname,
                _id: user._id
            }))
        });
    } catch (error) {
        console.error("User search error:", error);
        res.status(500).json({
            message: "Error while searching for users"
        });
    }
})

router.get("/account", authMiddleware, async (req, res) => {
    const account = await Account.findOne({ userId: req.userId });
    if (!account) {
        return res.status(404).json({ error: "Account not found" });
    }
    res.json({ account });
});

module.exports = router; 