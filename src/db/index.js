import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDb = async () => {
  try {
    const databaseConnection = await mongoose.connect(
      `${process.env.MONGODB_URI}`,
      { dbName: DB_NAME },
    );
    console.log(`Database host: ${databaseConnection.connection.host}`);
  } catch (error) {
    console.error("Error", error);
    process.exit(1);
  }
};

export default connectDb;
