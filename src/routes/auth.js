import express from "express";
import getDb from "../db.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/register", async (req, res) => {
    const db = getDb();
    const users = db.collection("users");

    const password = await bcrypt.hash(req.body.password, 10);

    await users.insertOne({
        password,
        username: req.body.username,
    });

    res.status(200).json({ message: "Registered successfully" });
});

router.post("/login", async (req, res) => {
    const db = getDb();
    const users = db.collection("users");

    const user = await users.findOne({
        username: req.body.username,
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

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.status(200).json({ accessToken });

});

export default router;