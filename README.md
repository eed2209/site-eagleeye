# Site Eagle Eye Digital

Site complet (Astro) : accueil avec Scanner sur-mesure, pages méthode/offres/à-propos/témoignages, blog SEO en Markdown, sitemap, llms.txt.

## Commandes

```
npm install      # première fois
npm run dev      # développement → http://localhost:4321
npm run build    # génère le site statique dans dist/
```

## Ajouter un article de blog

Créer un fichier `.md` dans `src/content/blog/` avec l'entête :

```
---
title: "Titre de l'article"
description: "Méta-description SEO (150-160 caractères)"
date: 2026-07-20
keywords: ["mot-clé principal", "secondaire"]
pilier: "/offres/accompagnement-prospection/"
---
```

## Déploiement

- Test : GitHub Actions → GitHub Pages (workflow inclus). Nécessite un sous-domaine
  custom (ex. test.eagleeye.digital) car les chemins du site sont absolus.
- Production : `npm run build` puis servir `dist/` (VPS nginx ou GitHub Pages + domaine).
