import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    author: z.string().default('The Electric Bike Superstore'),
    category: z.string().default('General'),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    slug: z.string(),
  }),
});

export const collections = { blog };
