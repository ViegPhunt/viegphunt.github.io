import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
    type: 'content',
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string(),
        url: z.string().url(),
        updated: z.string(),
        topics: z.string().optional(),
        banner: image().optional(),
    }),
});

const writeups = defineCollection({
    type: 'content',
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string(),
        updated: z.string(),
        banner: image().optional(),
    }),
});

export const collections = { projects, writeups };