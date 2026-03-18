import { defineCollection, z } from 'astro:content';

const news = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
    context: z.string().optional(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    breakImage1: z.string().optional(),
    breakImage1Alt: z.string().optional(),
    breakImage2: z.string().optional(),
    breakImage2Alt: z.string().optional(),
    internalLinks: z.array(z.object({
      to: z.string(),
      anchor: z.string()
    })).optional(),
    externalLinks: z.array(z.object({
      to: z.string(),
      anchor: z.string(),
      url: z.string()
    })).optional()
  })
});

export const collections = { news };
