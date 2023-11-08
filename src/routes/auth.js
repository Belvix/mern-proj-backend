import express from "express";
import getDb from "../db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/register", async (req, res) => {
    const db = getDb();
    const users = db.collection("users");

    const encryptedPassword = await bcrypt.hash(req.body.password, 10);
    try{
        const result = await users.insertOne({
            password: encryptedPassword,
            username: req.body.username,
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            userType: req.body.userType
        });
        console.log(`Result is ${result.acknowledged}`)
        res.status(200).json({ message: "Registered successfully" });
    }
    catch(err){
        console.log(err);
        res.status(400).json({message: "Email or username duplicate"});
    }

    
});

router.post("/login", async (req, res) => {
    const db = getDb();
    const users = db.collection("users");

    const user = await users.findOne({
        email: req.body.email,
    });

    const passwordValid = await bcrypt.compare(
        req.body.password,
        user.password
    );

    if (user === null || !passwordValid) {
        return res.status(401).json({
            accessToken: null,
            message: "Username or password is incorrect",
        });
    }

    let tokenExpiry = Date.now()/1000 + 24 * 60 * 60; //expires one day from creation

    if(req.body.longterm){
        tokenExpiry = Date.now()/1000 + 30 * 24 * 60 * 60; //expires one month from creation
    }

    const accessToken = jwt.sign({
        id: user._id,
        exp: tokenExpiry,
        usr: user.username
    },
        process.env.JWT_SECRET);

    res.status(200).json({ accessToken, userType: user.userType });

});

export default router;