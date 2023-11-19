import dotenv from "dotenv";
import express from "express";
import { connectToServer } from "./db.js";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";
import songRouter from "./routes/songs.js";
import cors from 'cors';

dotenv.config();

const app = express();
const port = 2900;

// Common middlewares
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(cors({
    origin: ['http://localhost:3000','https://rhythmix-mern.vercel.app'],
    allowedHeaders: '*',
})); // Enable CORS

// Define your routes here (e.g., authRouter)
app.use("/auth", authRouter);
app.use("/user",userRouter);
app.use("/song",songRouter);

app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});

app.get("/", (req, res) => {
    res.send("Rhythmix backend is running! v1.5.0");
});


connectToServer().then(async () => {
    app.listen(port, () => {
        return console.log(`Express is listening at port: ${port}`);
    });
});
