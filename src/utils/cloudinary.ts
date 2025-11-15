import * as FileSystem from "expo-file-system";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const uploadToCloudinary = async (fileUri) => {
  if (!fileUri) {
    throw new Error("File URI is missing");
  }

  const mimeType = fileUri.endsWith(".png")
    ? "image/png"
    : fileUri.endsWith(".jpg") || fileUri.endsWith(".jpeg")
    ? "image/jpeg"
    : "image/*";

  const data = new FormData();
  data.append("file", {
    uri: fileUri,
    type: mimeType,
    name: `upload-${Date.now()}.${mimeType.split("/")[1]}`,
  });
  data.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Cloudinary error:", result);
      throw new Error(result.error?.message || "Upload failed");
    }

    console.log("✅ Uploaded successfully:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error);
    throw error;
  }
};
