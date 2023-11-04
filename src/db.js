import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.ATLAS_URI);

let db;

export const connectToServer = async () => {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log("Successfully connected to MongoDB.");
};

const getDb = () => db;

export default getDb;