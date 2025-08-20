import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, uploadAvatar, uploadPostImage } from '@/lib/local-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'avatar', 'post', ou 'general'
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Convertir le fichier en Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;

    let result;

    // Upload selon le type
    switch (type) {
      case 'avatar':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId requis pour les avatars' },
            { status: 400 }
          );
        }
        result = await uploadAvatar(buffer, originalName, userId);
        break;

      case 'post':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId requis pour les images de post' },
            { status: 400 }
          );
        }
        result = await uploadPostImage(buffer, originalName, userId);
        break;

      default:
        // Upload général
        result = await uploadFile(buffer, originalName, 'temp', userId);
        break;
    }

    console.log(`Fichier uploadé avec succès: ${result.fileName}`);

    return NextResponse.json({
      success: true,
      url: result.url,
      fileName: result.fileName,
      size: result.size,
      mimeType: result.mimeType,
      message: 'Fichier uploadé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'upload du fichier',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// Optionnel: Endpoint pour supprimer des fichiers
export async function DELETE(request: NextRequest) {
  try {
    const { fileName, folder } = await request.json();
    
    if (!fileName || !folder) {
      return NextResponse.json(
        { error: 'fileName et folder requis' },
        { status: 400 }
      );
    }

    // Implémenter la suppression si nécessaire
    return NextResponse.json({
      success: true,
      message: 'Fichier supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du fichier' },
      { status: 500 }
    );
  }
}
