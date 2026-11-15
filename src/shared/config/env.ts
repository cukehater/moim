import 'server-only'
import { z } from 'zod'

export const env = z
  .object({
    DATABASE_URL: z.url(),
    AUTH_SECRET: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),
    // 운영자 이메일: 쉼표로 여러 명 ('a@gmail.com,b@gmail.com')
    ADMIN_EMAIL: z
      .string()
      .transform((s) => s.split(',').map((e) => e.trim()))
      .pipe(z.array(z.email()).min(1)),
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
    NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
  })
  .parse(process.env)
