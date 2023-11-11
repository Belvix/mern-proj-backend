import express from "express";
import verifyAuth from "../middlewares/verifyAuths.js";
import upload from "../upload.js";
import getDb from "../db.js";
import expressAsyncHandler from "express-async-handler";
import { Db } from "mongodb";

const router = express.Router();

router.use(verifyAuth());

router.post(
    "/upload",
    upload.single('songfile'),
    expressAsyncHandler(async (req, res) => {
        /**@type {Db} */
        const db = getDb();

        const collection = db.collection("songs");
        const userCollection = db.collection("users");

        if (!req.file?.filename) {
            res.status(400).json({ message: "File not uploaded" });
            return;
        }

        if (!req.auth.isArtist) {
            res.status(401).json({ message: "Unauthorized access" });
            return;
        }

        const result = await collection.insertOne({
            userId: req.auth.id,
            filename: req.file.filename,
            songstorage_id: req.file.id,
            mimeType: req.file.mimetype,
            title: req.body.songtitle,
            thumbnail: req.body.songimage,
            publisher: req.body.songpublisher,
            producer: req.body.songproducer,
            composer: req.body.songcomposer,
            proddate: req.body.songdate,
            uploaded: new Date(),
        });
        console.log(req.user.id);
        userCollection.findOne({ _id: req.auth.id }).then((document) => {
            document.username;
        })
        userCollection.updateOne({ _id: req.auth.id }, { $push: { uploadSongs: result.insertedId } });

        res.status(200).json({ result });
    })
);

export default router;
