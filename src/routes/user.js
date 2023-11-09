import express from "express";
import getDb from "../db.js";
import { Collection } from "mongodb";

const router = express.Router();

router.post("/email", async (req, res) => {
    try {
        const db = getDb();

        /**@type {Collection} */
        const users = db.collection("users");

        const fields = await users.find({ email: req.body.email }).toArray();
        console.log(fields);

        res.json(fields); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/usernames", async (req, res) => {
    try {
        const db = getDb();

        /**@type {Collection} */
        const users = db.collection("users");

        const fields = await users.find({ username: req.body.username }).toArray();
        console.log(fields);
        res.json(fields); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
