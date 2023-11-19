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
        const collection = db.collection('songs');
        const userCollection = db.collection('users');
        const songId = new ObjectId(req.params.id);

        const existingSong = await collection.findOne({ songstorage_id: songId, userId: req.auth.id });
        if (!existingSong) {
            res.status(401).json({ message: 'Unauthorized access' });
            return;
        }

        if (!existingSong || req.auth.id.toString() != existingSong.userId.toString()) {
            res.status(403).send({ message: "Unauthorized to delete the song" });
            return;
        }

        const updateFields = {
            title: req.body.title,
            thumbnail: req.body.thumbnail,
            publisher: req.body.publisher,
            composer: req.body.composer,
            producer: req.body.producer,
            proddate: req.body.proddate,
        };

        const result = await collection.updateOne({ songstorage_id: songId }, { $set: updateFields });

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
        res.status(200).send({ name: user.firstName +" "+user.lastName, username: user.username, email: user.email });
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
