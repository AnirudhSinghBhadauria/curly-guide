import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));

// Routes Import
import userRouter from "./routes/user.routes.js";

// http://localhost:8080/users - all the requsts to /users will reach this router
app.use("/users", userRouter);

export { app };
