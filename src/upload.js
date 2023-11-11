import multer from "multer";
import { GridFsStorage } from "multer-gridfs-storage";
import getDb from "./db.js";
import { client } from "./db.js";

const db = getDb();


const storage = new GridFsStorage({
    url: process.env.SONGSTORAGE_URI,
    file: (req, file) => {
        return {
            filename: 'file_' + Date.now(),
        };
    }
});

const upload = multer({ storage });

export default upload;