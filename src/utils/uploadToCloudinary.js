// utils/uploadToCloudinary.js
import cloudinary from "../config/cloudinary.js";

export function uploadToCloudinary(buffer, folder = "thriftcircle/proofs") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" }, // "auto" handles both images and PDFs correctly
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}