import express from "express";
import getDb from "../db.js";
import { Collection, ObjectId } from "mongodb";
import verifyAuth from "../middlewares/verifyAuths.js";
import expressAsyncHandler from "express-async-handler";

const router = express.Router();

router.post("/email", async (req, res) => {
    try {
        const db = getDb();

        /**@type {Collection} */
        const users = db.collection("users");

        const fields = await users.find({ email: req.body.email }).toArray();

        res.json(fields); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/usernames", async (req, res) => {
    try {
        const db = getDb();

        const users = db.collection("users");

        const fields = await users.find({ username: req.body.username }).toArray();
        res.json(fields); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.patch(
    '/update/:id',
    verifyAuth(),
    expressAsyncHandler(async (req, res) => {
        const db = getDb();
        const userCollection = db.collection('users');
        const userId = new ObjectId(req.params.id);

        console.log("update called");
        const existingUser = await userCollection.findOne({ _id: userId});
        if (!existingUser) {
            res.status(401).json({ message: 'Unauthorized access' });
            return;
        }

        if (!existingUser || req.auth.id.toString() != existingUser._id.toString()) {
            res.status(403).send({ message: "Unauthorized to update the user" });
            return;
        }

        const updateFields = {
            username: req.body.username,
            profilePic: req.body.profilePic,
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            nationality: req.body.nationality,
            contactNo: req.body.contactNo,
            bio: req.body.bio
        };
        console.log("reached here1");
        const result = await userCollection.updateOne({ _id: userId }, { $set: updateFields });
        console.log("reached here2");
        console.log(result);

        res.status(200).json({ message: "Song updated successfully!" });
    })
);

router.get('/:id/details',
    expressAsyncHandler(async (req, res) => {
        const db = getDb();
        const collection = db.collection("users");
        const id = new ObjectId(req.params.id);
        const user = await collection.findOne({ _id: id });
        console.log(user.uploadSongs);
        res.status(200).send({ 
            name: user.firstName +" "+user.lastName, 
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username, 
            email: user.email,
            bio: user.bio,
            contactNo: user.contactNo,
            nationality: user.nationality,
            profilePic: user.profilePic
             });
    }))

router.delete('/delete/:id',
    verifyAuth(),
    expressAsyncHandler(async (req, res) => {
        const db = getDb();
        const usersCollection = db.collection("users");

        try {
            const id = new ObjectId(req.params.id);

            const user = await usersCollection.findOne({_id:id});

            if (!user || req.auth.id.toString() != user._id.toString()) {
                res.status(403).send({ message: "Unauthorized to delete the user" });
                return;
            }

            const result = await usersCollection.findOneAndDelete({ _id: id });

            res.status(200).send({ message: `Deleted successfully!. User name: ${result.value.username}` });
        } catch (error) {
            console.error("Error deleting user:", error);
            res.status(500).send({ message: "Internal Server Error" });
        }
    })
);

export default router;
