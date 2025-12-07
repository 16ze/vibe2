# Icônes PWA pour Vibe

Ce dossier doit contenir les icônes de l'application pour le PWA.

## Tailles requises (Production)

- `icon-192.png` - 192x192px (Android, favicon)
- `icon-512.png` - 512x512px (Splash screen, Android)

## Génération des icônes

Vous pouvez utiliser un outil en ligne comme :
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- https://www.pwabuilder.com/imageGenerator

Ou créer une icône source (1024x1024px) et la redimensionner pour chaque taille.

## Format

- Format : PNG
- Fond : Transparent ou couleur de thème (#000000)
- Style : Adapté au design de l'application Vibe

## Instructions

1. Créez une icône source de 1024x1024px avec le logo "VIBE"
2. Redimensionnez-la aux tailles requises (192x192 et 512x512)
3. Placez les fichiers dans ce dossier (`public/icons/`)
4. Les icônes seront automatiquement référencées par le manifest.json
