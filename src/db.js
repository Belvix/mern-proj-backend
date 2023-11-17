import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";
import { GridFSBucket } from "mongodb";

dotenv.config();

export const client = new MongoClient(process.env.ATLAS_URI);

/**@type {Db} */
let db;
let songStorageDb;
/**@type {GridFSBucket} */
let songStorageBucket;

export const connectToServer = async () => {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    songStorageDb = client.db("songstorage");
    songStorageBucket = new GridFSBucket(songStorageDb, {bucketName: "fs"});
    db.collection("users").createIndex({username:1},{unique:true});
    db.collection("users").createIndex({email:1}, {unique:true});
    console.log("Successfully connected to MongoDB.");
};

process.on('exit', () => {
    console.log('Closing MongoDB connection...');
    client.close()
        .then(() => {
            console.log('MongoDB connection closed.');
        })
        .catch(err => {
            console.error('Error closing MongoDB connection:', err);
        });
});

const getDb = () => db;

export const getBucket = () => songStorageBucket;

export default getDb;