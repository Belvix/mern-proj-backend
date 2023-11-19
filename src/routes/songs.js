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

router.get('/all',
    expressAsyncHandler(async (req, res) => {
        const db = getDb();

        const songsCollection = db.collection("songs");

        const songsArray = await songsCollection.find().toArray();

        res.status(200).json({ songs: songsArray });
    })
)

router.get('/artist_uploaded',
    verifyAuth(),
    expressAsyncHandler(async (req, res) => {
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

            res.status(200).json({ songs: songsArray });
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

router.get('/:id/details',
    expressAsyncHandler(async (req, res) => {
        const db = getDb();
        const songCollection = db.collection("songs");
        const id = new ObjectId(req.params.id);
        const song = await songCollection.findOne({ songstorage_id: id });
        res.status(200).send({ title: song.title, artist: song.artist, thumbnail: song.thumbnail, publisher: song.publisher, composer: song.composer, producer: song.producer, proddate: song.proddate });
    }))

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
            res.status(403).send({ message: "Unauthorized to update the song" });
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

router.delete('/delete/:id',
    verifyAuth(),
    expressAsyncHandler(async (req, res) => {
        const bucket = getBucket();
        const db = getDb();
        const songCollection = db.collection("songs");
        const usersCollection = db.collection("users");

        try {
            const id = new ObjectId(req.params.id);

            const song = await songCollection.findOne({ songstorage_id: id });

            if (!song || req.auth.id.toString() != song.userId.toString()) {
                res.status(403).send({ message: "Unauthorized to delete the song" });
                return;
            }

            await bucket.delete(id);

            await songCollection.findOneAndDelete({ songstorage_id: id });

            const userId = song.userId;
            await usersCollection.updateOne(
                { _id: new ObjectId(userId) },
                { $pull: { uploadSongs: song._id } }
            );

            res.status(200).send({ message: `Deleted successfully!. Song name: ${song.title}` });
        } catch (error) {
            console.error("Error deleting song:", error);
            res.status(500).send({ message: "Internal Server Error" });
        }
    })
);

export default router;
