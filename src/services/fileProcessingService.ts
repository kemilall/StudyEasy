import * as FileSystem from 'expo-file-system/legacy';

export interface FileProcessingResult {
  text: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export class FileProcessingService {
  /**
   * Process a file and extract text content based on its type
   */
  static async processFile(fileUri: string, fileName: string): Promise<FileProcessingResult> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('Fichier introuvable');
      }

      const fileExtension = this.getFileExtension(fileName);

      switch (fileExtension.toLowerCase()) {
        case 'txt':
          return await this.processTextFile(fileUri, fileName, fileInfo.size || 0);

        case 'pdf':
          return await this.processPDFFile(fileUri, fileName, fileInfo.size || 0);

        case 'doc':
        case 'docx':
          return await this.processWordFile(fileUri, fileName, fileInfo.size || 0);

        default:
          throw new Error(`Format de fichier non supporté: ${fileExtension}`);
      }
    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
      throw error;
    }
  }

  /**
   * Process plain text files
   */
  private static async processTextFile(fileUri: string, fileName: string, fileSize: number): Promise<FileProcessingResult> {
    try {
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8
      });

      return {
        text: content,
        fileName,
        fileType: 'text/plain',
        fileSize
      };
    } catch (error) {
      throw new Error('Erreur lors de la lecture du fichier texte');
    }
  }

  /**
   * Process PDF files (placeholder - would need a PDF parsing library)
   */
  private static async processPDFFile(fileUri: string, fileName: string, fileSize: number): Promise<FileProcessingResult> {
    try {
      // For now, we'll return a placeholder since PDF parsing requires additional libraries
      // In a real implementation, you would use a library like react-native-pdf-lib or similar

      // Read file as base64 for potential future processing
      const base64Content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64
      });

      return {
        text: `[Contenu PDF - ${fileName}]\n\nLe traitement automatique des fichiers PDF nécessite l'installation de bibliothèques spécialisées. Pour le moment, veuillez copier-coller le contenu du PDF dans la zone de texte.\n\nTaille du fichier: ${this.formatFileSize(fileSize)}\nNom du fichier: ${fileName}`,
        fileName,
        fileType: 'application/pdf',
        fileSize
      };
    } catch (error) {
      throw new Error('Erreur lors du traitement du fichier PDF');
    }
  }

  /**
   * Process Word documents (placeholder - would need a DOCX parsing library)
   */
  private static async processWordFile(fileUri: string, fileName: string, fileSize: number): Promise<FileProcessingResult> {
    try {
      // For now, we'll return a placeholder since DOCX parsing requires additional libraries
      // In a real implementation, you would use a library like mammoth.js or similar

      return {
        text: `[Contenu Word - ${fileName}]\n\nLe traitement automatique des fichiers Word nécessite l'installation de bibliothèques spécialisées. Pour le moment, veuillez copier-coller le contenu du document dans la zone de texte.\n\nTaille du fichier: ${this.formatFileSize(fileSize)}\nNom du fichier: ${fileName}`,
        fileName,
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize
      };
    } catch (error) {
      throw new Error('Erreur lors du traitement du fichier Word');
    }
  }

  /**
   * Extract file extension from filename
   */
  private static getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  /**
   * Format file size in human readable format
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate if file type is supported
   */
  static isFileTypeSupported(fileName: string): boolean {
    const extension = this.getFileExtension(fileName).toLowerCase();
    const supportedExtensions = ['txt', 'pdf', 'doc', 'docx'];

    return supportedExtensions.includes(extension);
  }

  /**
   * Get MIME type for file
   */
  static getMimeType(fileName: string): string {
    const extension = this.getFileExtension(fileName).toLowerCase();

    switch (extension) {
      case 'txt':
        return 'text/plain';
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/octet-stream';
    }
  }
}

