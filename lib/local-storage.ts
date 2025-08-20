import { writeFile, mkdir, unlink, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configuration des dossiers de stockage
const STORAGE_CONFIG = {
  baseDir: 'public',
  uploads: 'uploads',
  avatars: 'avatars',
  posts: 'posts',
  temp: 'temp'
};

// Créer la structure des dossiers
async function ensureDirectories() {
  const dirs = [
    path.join(process.cwd(), STORAGE_CONFIG.baseDir, STORAGE_CONFIG.uploads),
    path.join(process.cwd(), STORAGE_CONFIG.baseDir, STORAGE_CONFIG.uploads, STORAGE_CONFIG.avatars),
    path.join(process.cwd(), STORAGE_CONFIG.baseDir, STORAGE_CONFIG.uploads, STORAGE_CONFIG.posts),
    path.join(process.cwd(), STORAGE_CONFIG.baseDir, STORAGE_CONFIG.uploads, STORAGE_CONFIG.temp)
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

// Initialiser les dossiers au démarrage
ensureDirectories().catch(console.error);

export interface UploadResult {
  url: string;
  fileName: string;
  filePath: string;
  size: number;
  mimeType: string;
}

export interface FileInfo {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  url: string;
}

/**
 * Upload un fichier vers le stockage local
 */
export async function uploadFile(
  file: Buffer,
  originalName: string,
  folder: 'avatars' | 'posts' | 'temp' = 'temp',
  userId?: string
): Promise<UploadResult> {
  try {
    // Générer un nom de fichier unique
    const fileName = generateFileName(originalName, userId);
    
    // Déterminer le dossier de destination
    const uploadDir = path.join(
      process.cwd(), 
      STORAGE_CONFIG.baseDir, 
      STORAGE_CONFIG.uploads, 
      folder
    );
    
    // Créer le dossier s'il n'existe pas
    await mkdir(uploadDir, { recursive: true });
    
    // Chemin complet du fichier
    const filePath = path.join(uploadDir, fileName);
    
    // Écrire le fichier
    await writeFile(filePath, file);
    
    // Générer l'URL publique
    const url = `/uploads/${folder}/${fileName}`;
    
    return {
      url,
      fileName,
      filePath,
      size: file.length,
      mimeType: getMimeType(originalName)
    };
  } catch (error) {
    console.error('Erreur lors de l\'upload local:', error);
    throw new Error(`Échec de l'upload du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Upload d'un avatar utilisateur
 */
export async function uploadAvatar(
  file: Buffer,
  originalName: string,
  userId: string
): Promise<UploadResult> {
  return uploadFile(file, originalName, 'avatars', userId);
}

/**
 * Upload d'une image de post
 */
export async function uploadPostImage(
  file: Buffer,
  originalName: string,
  userId: string
): Promise<UploadResult> {
  return uploadFile(file, originalName, 'posts', userId);
}

/**
 * Supprimer un fichier
 */
export async function deleteFile(fileName: string, folder: 'avatars' | 'posts' | 'temp'): Promise<boolean> {
  try {
    const filePath = path.join(
      process.cwd(),
      STORAGE_CONFIG.baseDir,
      STORAGE_CONFIG.uploads,
      folder,
      fileName
    );
    
    if (existsSync(filePath)) {
      await unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
    return false;
  }
}

/**
 * Obtenir les informations d'un fichier
 */
export async function getFileInfo(fileName: string, folder: 'avatars' | 'posts' | 'temp'): Promise<FileInfo | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      STORAGE_CONFIG.baseDir,
      STORAGE_CONFIG.uploads,
      folder,
      fileName
    );
    
    if (!existsSync(filePath)) {
      return null;
    }
    
    const stats = await readFile(filePath);
    const url = `/uploads/${folder}/${fileName}`;
    
    return {
      fileName,
      originalName: fileName,
      mimeType: getMimeType(fileName),
      size: stats.length,
      uploadedAt: new Date(),
      url
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des infos du fichier:', error);
    return null;
  }
}

/**
 * Lister tous les fichiers d'un dossier
 */
export async function listFiles(folder: 'avatars' | 'posts' | 'temp'): Promise<string[]> {
  try {
    const dirPath = path.join(
      process.cwd(),
      STORAGE_CONFIG.baseDir,
      STORAGE_CONFIG.uploads,
      folder
    );
    
    if (!existsSync(dirPath)) {
      return [];
    }
    
    // Pour simplifier, on retourne un tableau vide
    // En production, vous pourriez utiliser fs.readdir
    return [];
  } catch (error) {
    console.error('Erreur lors du listing des fichiers:', error);
    return [];
  }
}

/**
 * Générer un nom de fichier unique
 */
function generateFileName(originalName: string, userId?: string): string {
  const timestamp = Date.now();
  const randomId = uuidv4().substring(0, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'bin';
  
  if (userId) {
    return `${userId}_${timestamp}_${randomId}.${extension}`;
  }
  
  return `${timestamp}_${randomId}.${extension}`;
}

/**
 * Déterminer le type MIME basé sur l'extension
 */
function getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (!extension) {
    return 'application/octet-stream';
  }
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Nettoyer les fichiers temporaires (optionnel)
 */
export async function cleanupTempFiles(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
  // Implémentation pour nettoyer les fichiers temporaires
  // maxAge en millisecondes (par défaut 24h)
  return 0;
}

/**
 * Obtenir l'URL publique d'un fichier
 */
export function getPublicUrl(fileName: string, folder: 'avatars' | 'posts' | 'temp'): string {
  return `/uploads/${folder}/${fileName}`;
}

/**
 * Vérifier si un fichier existe
 */
export function fileExists(fileName: string, folder: 'avatars' | 'posts' | 'temp'): boolean {
  const filePath = path.join(
    process.cwd(),
    STORAGE_CONFIG.baseDir,
    STORAGE_CONFIG.uploads,
    folder,
    fileName
  );
  
  return existsSync(filePath);
}
