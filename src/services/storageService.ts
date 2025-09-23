import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable, StorageReference } from 'firebase/storage';
import { storage } from '../config/firebase';
import { Platform } from 'react-native';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export class StorageService {
  // Upload file with progress tracking
  static async uploadFile(
    file: Blob | Uint8Array | ArrayBuffer,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      
      // For React Native, we need to ensure the blob has proper metadata
      if (file instanceof Blob && Platform.OS !== 'web') {
        // Set proper content type for audio files
        const metadata = {
          contentType: 'audio/m4a',
        };
        
        if (onProgress) {
          const uploadTask = uploadBytesResumable(storageRef, file, metadata);
          
          return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
              (snapshot) => {
                const progress: UploadProgress = {
                  bytesTransferred: snapshot.bytesTransferred,
                  totalBytes: snapshot.totalBytes,
                  progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                };
                onProgress(progress);
              },
              (error) => {
                console.error('Upload error:', error);
                reject(error);
              },
              async () => {
                try {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve(downloadURL);
                } catch (error) {
                  reject(error);
                }
              }
            );
          });
        } else {
          const snapshot = await uploadBytes(storageRef, file, metadata);
          return await getDownloadURL(snapshot.ref);
        }
      } else {
        // Web or non-blob upload
        if (onProgress) {
          const uploadTask = uploadBytesResumable(storageRef, file);
          
          return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
              (snapshot) => {
                const progress: UploadProgress = {
                  bytesTransferred: snapshot.bytesTransferred,
                  totalBytes: snapshot.totalBytes,
                  progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                };
                onProgress(progress);
              },
              (error) => {
                console.error('Upload error:', error);
                reject(error);
              },
              async () => {
                try {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve(downloadURL);
                } catch (error) {
                  reject(error);
                }
              }
            );
          });
        } else {
          const snapshot = await uploadBytes(storageRef, file);
          return await getDownloadURL(snapshot.ref);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Upload audio file
  static async uploadAudio(
    audioFile: Blob | Uint8Array | ArrayBuffer,
    userId: string,
    chapterId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const path = `audio/${userId}/${chapterId}/${Date.now()}.m4a`;
    return this.uploadFile(audioFile, path, onProgress);
  }

  // Upload document/text file
  static async uploadDocument(
    documentFile: Blob | Uint8Array | ArrayBuffer,
    userId: string,
    chapterId: string,
    fileName: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const extension = fileName.split('.').pop() || 'txt';
    const path = `documents/${userId}/${chapterId}/${Date.now()}.${extension}`;
    return this.uploadFile(documentFile, path, onProgress);
  }

  // Upload subject cover image
  static async uploadSubjectImage(
    imageFile: Blob | Uint8Array | ArrayBuffer,
    userId: string,
    subjectId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const path = `images/subjects/${userId}/${subjectId}/${Date.now()}.jpg`;
    return this.uploadFile(imageFile, path, onProgress);
  }

  // Delete file
  static async deleteFile(downloadURL: string): Promise<void> {
    try {
      const fileRef = ref(storage, downloadURL);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Get file from URL
  static async getFileURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }
}

