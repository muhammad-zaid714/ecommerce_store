import {z} from 'zod';
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().min(1, { message: 'DATABASE_URL is required' }),

    CLERK_PUBLISHABLE_KEY: z.string().min(1, { message: 'CLERK_PUBLISHABLE_KEY is required' }),
    CLERK_SECRET_KEY: z.string().min(1, { message: 'CLERK_SECRET_KEY is required' }),
    CLERK_WEBHOOK_SECRET: z.string().optional(),

    FRONTEND_URL: z.string().url(),
    
    POLAR_ACCESS_TOKEN: z.string().min(1, { message: 'POLAR_ACCESS_TOKEN is required' }),
    POLAR_WEBHOOK_SECRET: z.string().min(1, { message: 'POLAR_WEBHOOK_SECRET is required' }),
    POLAR_API_BASE: z.string().url({ message: 'POLAR_API_BASE must be a valid URL' }).default('https://api.polar.sh/v1'),    
    POLAR_CHECKOUT_PRODUCT_ID: z.string(),

    STREAM_API_KEY: z.string().min(1, { message: 'STREAM_API_KEY is required' }),
    STREAM_API_SECRET: z.string().min(1, { message: 'STREAM_API_SECRET is required' }),
    IMAGEKIT_PUBLIC_KEY: z.string().min(1, { message: 'IMAGEKIT_PUBLIC_KEY is required' }),
    IMAGEKIT_PRIVATE_KEY: z.string().min(1, { message: 'IMAGEKIT_PRIVATE_KEY is required' }),
    IMAGEKIT_URL_ENDPOINT: z.string().url({ message: 'IMAGEKIT_URL_ENDPOINT must be a valid URL' }),
    SENTRY_DSN: z.string().url({ message: 'SENTRY_DSN must be a valid URL' }).optional(),
});
export type Env = z.infer<typeof envSchema>;
export function loadENV(){
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', parsed.error.format());
        throw new Error('Invalid environment variables');
    }
    return parsed.data;
}

let cachedEnv: Env | null = null;
export function getEnv(): Env {
    if (!cachedEnv) {
        cachedEnv = loadENV();
    }
    return cachedEnv;
}
