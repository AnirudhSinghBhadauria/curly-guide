import dotenv from "dotenv";
import connectDb from "./db/index.js";
import { app } from "./app.js";
const port = process.env.PORT || 3001;

dotenv.config();
console.log("anirudh");

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDb connection failed - ", err);
  });

// Another way of connecting to the mongodb: https://gist.github.com/AnirudhSinghBhadauria/589ce687ed20e89c78e74df1e39224fc
