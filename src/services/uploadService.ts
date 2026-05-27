import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary with credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Takes a file buffer and uploads it to cloudinary
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      },
    );
    Readable.from(buffer).pipe(stream);
  });
