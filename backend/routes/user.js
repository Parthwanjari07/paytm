const express = require("express")
const zod = require("zod")
const router = express.Router();
const {User} = require('../db');
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

router.get("/signup", async(req, res)=>{
    const body = req.body;
    const {success} = signupschema.safeParse(body);
    if (!success){
        return res.status(411).json({
            message:"Incorrect credentials"
        })
    }

    const existinguser = User.findOne({
        username: body.username
    })

    if  (existinguser._id){
        return res.status(411).json({
            message:"Email already taken / incorrect inputs"
        })
    }

    const user = await User.create(body);

    const token = jwt.sign({
        userId:user._id
    }, JWT_SECRET)

    res.json({
        message: "user created successfully",
        token:token
    })
});

router.post("/signin", async (req, res) => { // Changed to POST
    const body = req.body;
    const { success } = signinschema.safeParse(body);
    if (!success) {
        return res.status(400).json({ // Changed status code to 400
            message: "Incorrect credentials"
        });
    }

    try {
        const existingUser = await User.findOne({ username: body.username }); // await added

        if (!existingUser) {
            return res.status(401).json({ // Changed status code to 401
                message: "Incorrect username"
            });
        }

        // Add password verification here.  This is crucial for security!
        // Example using bcrypt:
        const passwordMatch = await bcrypt.compare(body.password, existingUser.password);
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
    const {success} =updatebody.safeParse(req.body);
    if(!success){
        res.status(411)({
            message:"Error while updating information"
        })
    }
    

    await User.updateOne({_id:req.userId},req.body);
    
    res.json({
        message:"updated successfully"
    })
})

router.get("/find", async (req, res) => {
    const filter = req.query.filter || "";
    
    try {
        const users = await User.find({
            $or: [
                { firstName: { $regex: filter, $options: "i" }},
                { lastName: { $regex: filter, $options: "i" }}
            ]
        });

        res.json({
            users: users.map(user => ({
                firstName: user.firstName,
                lastName: user.lastName,
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

module.exports = router; 