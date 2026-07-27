import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import imageCompression from 'browser-image-compression'

// ── AWS S3 Client Initialization ──────────────────────────────────────────
const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
})

// ── Image Compression Configuration ──────────────────────────────────────
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.2, // 200KB
  maxWidthOrHeight: 1024,
  useWebWorker: true,
}

/**
 * Compresses an image file using browser-image-compression
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} - The compressed image file
 * @throws {Error} - If compression fails
 */
export const compressImage = async (file) => {
  try {
    console.log(`Compressing image: ${file.name} (${file.size} bytes)`)

    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS)

    console.log(`Compressed image: ${compressedFile.name} (${compressedFile.size} bytes)`)

    return compressedFile
  } catch (error) {
    console.error('Error compressing image:', error)
    throw new Error(`Image compression failed: ${error.message}`)
  }
}

/**
 * Uploads a compressed image to AWS S3
 * @param {File} compressedFile - The compressed image file
 * @param {string} s3Path - The S3 path/key for the file (e.g., 'profile-pictures/user-123.jpg')
 * @returns {Promise<string>} - The public S3 URL of the uploaded file
 * @throws {Error} - If upload fails
 */
export const uploadToS3 = async (compressedFile, s3Path) => {
  try {
    const bucketName = import.meta.env.VITE_AWS_S3_BUCKET_NAME
    const region = import.meta.env.VITE_AWS_REGION

    // Ensure path doesn't start with /
    const normalizedPath = s3Path.startsWith('/') ? s3Path.slice(1) : s3Path

    console.log(`Uploading to S3: s3://${bucketName}/${normalizedPath}`)

    // Convert File/Blob to ArrayBuffer, then to Uint8Array for AWS SDK compatibility
    const arrayBuffer = await compressedFile.arrayBuffer()
    const fileBody = new Uint8Array(arrayBuffer)

    // Prepare upload command
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: normalizedPath,
      Body: fileBody,
      ContentType: compressedFile.type || 'image/jpeg',
    })

    // Execute upload
    const response = await s3Client.send(uploadCommand)

    // Construct public S3 URL
    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${normalizedPath}`

    console.log(`Upload successful: ${s3Url}`)
    console.log('S3 Response:', response)

    return s3Url
  } catch (error) {
    console.error('Error uploading to S3:', error)
    throw new Error(`S3 upload failed: ${error.message}`)
  }
}

/**
 * Complete workflow: compress and upload image to S3
 * @param {File} file - The original image file
 * @param {string} s3Path - The S3 path/key for the file
 * @returns {Promise<{success: boolean, url?: string, error?: string}>} - Upload result object
 */
export const uploadProfilePictureToS3 = async (file, s3Path) => {
  try {
    // Validate input
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    if (!s3Path) {
      return { success: false, error: 'No S3 path provided' }
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' }
    }

    // Step 1: Compress the image
    console.log('Step 1: Compressing image...')
    const compressedFile = await compressImage(file)

    // Step 2: Upload to S3
    console.log('Step 2: Uploading to S3...')
    const s3Url = await uploadToS3(compressedFile, s3Path)

    // Step 3: Return success
    console.log('Step 3: Upload complete')
    return {
      success: true,
      url: s3Url,
    }
  } catch (error) {
    console.error('Error in uploadProfilePictureToS3:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during upload',
    }
  }
}

/**
 * Generates a unique S3 path for profile pictures
 * @param {string} userId - The user ID
 * @param {string} fileExtension - The file extension (e.g., 'jpg', 'png')
 * @returns {string} - The S3 path
 */
export const generateProfilePicturePath = (userId, fileExtension = 'jpg') => {
  const timestamp = Date.now()
  return `profile-pictures/${userId}-${timestamp}.${fileExtension}`
}

/**
 * Generates a unique S3 path for event cover images
 * @param {string} eventId - The event ID
 * @param {string} fileExtension - The file extension (e.g., 'jpg', 'png')
 * @returns {string} - The S3 path
 */
export const generateEventCoverPath = (eventId, fileExtension = 'jpg') => {
  const timestamp = Date.now()
  return `event-covers/${eventId}-${timestamp}.${fileExtension}`
}

/**
 * Generates a unique S3 path for media files
 * @param {string} category - The category (e.g., 'speaker-photos', 'event-documents')
 * @param {string} fileExtension - The file extension
 * @returns {string} - The S3 path
 */
export const generateMediaPath = (category, fileExtension = 'jpg') => {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 9)
  return `${category}/${randomId}-${timestamp}.${fileExtension}`
}
