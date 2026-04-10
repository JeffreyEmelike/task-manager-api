import mongoose from "mongoose";
export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not seen in .env");
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("DB connection failed: ", error);
    process.exit(1); // crash the server - cannot run without DB
  }
};
