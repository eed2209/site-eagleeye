import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    keywords: z.array(z.string()).default([]),
    pilier: z.string().optional(), // page pilier vers laquelle cet article fait le maillage
  }),
});

export const collections = { blog };
