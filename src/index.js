import dotenv from "dotenv";
import express from "express";
import { connectToServer } from "./db.js";
import authRouter from "./routes/auth.js";
import cors from 'cors';


dotenv.config();

console.log(process.env.DB_NAME);
const app = express();
const port = 2900;


app.use(express.json());
app.use(cors());
app.use("/auth", authRouter);
app.use(express.urlencoded({ extended: true }));
app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});


app.get("/", (req, res) => {
    res.send("Hello World!");
});


connectToServer().then(async () => {
    app.listen(port, () => {
        return console.log(`Express is listening at http://localhost:${port}`);
    });
});