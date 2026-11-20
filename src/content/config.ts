import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(), // accepte une date YAML ou une chaîne (format écrit par le CMS)
    keywords: z.array(z.string()).default([]),
    pilier: z.string().optional(), // page pilier vers laquelle cet article fait le maillage
    titleBreak: z.boolean().default(false), // couper le H1 après le premier " : " (affichage seulement)
    draft: z.boolean().default(false), // true = brouillon : exclu du site (liste, page, sitemap)
    category: z.string().default(''), // catégorie affichée et filtrable sur /blog
  }),
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    eyebrow: z.string().default(''),
    h1: z.string(),
    lede: z.string().default(''),
  }),
});

export const collections = { blog, pages };
