import { defineCollection, z } from "astro:content";

const news = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
    context: z.string().optional(),
    heroImage: z.string().optional().default(""),
    heroImageAlt: z.string().optional().default(""),
    heroPrompt: z.string().optional(),
    heroAspectRatio: z.string().optional().default("16:9"),
    heroImageSize: z.string().optional().default("2K"),
    breakImage1: z.string().optional().default(""),
    breakImage1Alt: z.string().optional().default(""),
    breakPrompt1: z.string().optional(),
    breakAspectRatio1: z.string().optional().default("21:9"),
    breakImageSize1: z.string().optional().default("2K"),
    breakImage2: z.string().optional().default(""),
    breakImage2Alt: z.string().optional().default(""),
    breakPrompt2: z.string().optional(),
    breakAspectRatio2: z.string().optional().default("21:9"),
    breakImageSize2: z.string().optional().default("2K"),
    imagesPending: z.boolean().optional().default(false),
    internalLinks: z.array(z.object({ to: z.string(), anchor: z.string() })).optional(),
    externalLinks: z.array(z.object({ to: z.string(), anchor: z.string(), url: z.string() })).optional()
  })
});

const learn = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
    type: z.enum(["article", "guide", "video", "tip"]).default("article"),
    youtubeId: z.string().optional(),
    context: z.string().optional(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    heroPrompt: z.string().optional(),
    breakImage1: z.string().optional(),
    breakImage1Alt: z.string().optional(),
    breakPrompt1: z.string().optional(),
    breakImage2: z.string().optional(),
    breakImage2Alt: z.string().optional(),
    breakPrompt2: z.string().optional(),
    internalLinks: z.array(z.object({ to: z.string(), anchor: z.string() })).optional(),
    externalLinks: z.array(z.object({ to: z.string(), anchor: z.string(), url: z.string() })).optional()
  })
});

export const collections = { news, learn };

