import express from "express";
import verifyAuth from "../middlewares/verifyAuths.js";
import upload from "../upload.js";
import getDb, { getBucket } from "../db.js";
import { ObjectId } from "mongodb";
import expressAsyncHandler from "express-async-handler";

const router = express.Router();

router.post(
    "/upload",
    verifyAuth(),
    upload.single('songfile'),
    expressAsyncHandler(async (req, res) => {
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
            artist: req.body.songartist,
            publisher: req.body.songpublisher,
            producer: req.body.songproducer,
            composer: req.body.songcomposer,
            proddate: req.body.songdate,
            uploaded: new Date(),
        });
        userCollection.findOne({ _id: req.auth.id }).then((document) => {
            document.username;
        })
        userCollection.updateOne({ _id: req.auth.id }, { $push: { uploadSongs: result.insertedId } });

        res.status(200).json({ result });
    })
);

router.get('/artist_uploaded',
    verifyAuth(),
    expressAsyncHandler(async (req,res)=>{
        if (!req.auth.isArtist) {
            res.status(401).json({ message: "Unauthorized access" });
            return;
        }

        const db = getDb();

        const songsCollection = db.collection("songs");
        const userCollection = db.collection("users");

        const user = await userCollection.findOne({ _id: req.auth.id });

        if (user && user.uploadSongs) {
            const songsArray = await Promise.all(
                user.uploadSongs.map(async (songId) => {
                    const individualSong = await songsCollection.findOne({ _id: songId });
                    return individualSong;
                })
            );

            res.status(200).json({songs: songsArray});
        } else {
            res.status(404).json({ error: "User not found or no uploaded songs" });
        }
    })
)

router.get('/:id/download',
    expressAsyncHandler(async (req, res) => {
        const bucket = getBucket();
        const db = getDb();
        const songCollection = db.collection("songs");
        const files = await bucket.find().toArray();
        const id = new ObjectId(req.params.id);
        const downloadStream = bucket.openDownloadStream(id);
        const song = await songCollection.findOne({ songstorage_id: id });
        res.status(200);
        res.set({
            "Content-Type": song.mimeType,
            "Content-Disposition": `attachment; filename=${song.title}.mp3`,
            "Transfer-Encoding": "chunked"
        });
        downloadStream.pipe(res);
    }))

export default router;
