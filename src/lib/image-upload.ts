/**
 * Utility for uploading images to ImgBB.
 * Used across the platform for profile pictures, listing photos, and policy content.
 * 
 * @param imageFile The File object to upload.
 * @returns The direct URL of the hosted image or null if the upload fails.
 */
export async function uploadImage(imageFile: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  // Use ImgBB API key from environment variable
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY!;

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data.url;
    } else {
      console.error("ImgBB Error:", result.error?.message || "Unknown error");
      return null;
    }
  } catch (error) {
    console.error("Network error during image upload:", error);
    return null;
  }
}
