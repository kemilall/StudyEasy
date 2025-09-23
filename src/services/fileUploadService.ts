import * as FileSystem from 'expo-file-system/legacy';
import { ref, uploadBytesResumable, getDownloadURL, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export class FileUploadService {
  // Alternative upload method for React Native using XMLHttpRequest
  static async uploadFileWithXHR(
    fileUri: string,
    storagePath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      // Create storage reference
      const storageRef = ref(storage, storagePath);
      
      // Create blob from file URI using XMLHttpRequest
      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
          resolve(xhr.response);
        };
        xhr.onerror = function() {
          reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', fileUri, true);
        xhr.send(null);
      });

      // Set metadata based on file type
      const metadata = {
        contentType: 'audio/m4a',
        customMetadata: {
          uploadedAt: new Date().toISOString()
        }
      };

      // Upload with progress
      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            };
            if (onProgress) {
              onProgress(progress);
            }
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
    } catch (error) {
      console.error('Error in uploadFileWithXHR:', error);
      throw error;
    }
  }

  // Alternative method using base64 for smaller files
  static async uploadFileAsBase64(
    fileUri: string,
    storagePath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });

      // Convert base64 to blob
      const blob = await fetch(`data:audio/m4a;base64,${base64}`).then(res => res.blob());

      // Create storage reference
      const storageRef = ref(storage, storagePath);

      // Set metadata
      const metadata = {
        contentType: 'audio/m4a',
      };

      // Upload with progress
      if (onProgress) {
        const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

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
        // Direct upload without progress
        const snapshot = await uploadBytes(storageRef, blob, metadata);
        return await getDownloadURL(snapshot.ref);
      }
    } catch (error) {
      console.error('Error in uploadFileAsBase64:', error);
      throw error;
    }
  }
}
