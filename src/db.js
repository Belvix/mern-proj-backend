import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.ATLAS_URI);

let db;

export const connectToServer = async () => {
    await client.connect();
    db = client.db(process.env.DB_NAME);
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

export default getDb;