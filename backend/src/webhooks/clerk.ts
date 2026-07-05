import type { Request, Response } from 'express';
import { verifyWebhook } from '@clerk/backend/webhooks';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { getEnv } from '../lib/env';
import { parseRole } from './role';

export async function clerkWebhookHandler(req: Request, res: Response) {
    const env = getEnv();

    try {
        if (!env.CLERK_WEBHOOK_SECRET) {
            return res.status(503).send('CLERK_WEBHOOK_SECRET is not set');
        }

        const payload = req.body instanceof Buffer ? req.body.toString('utf-8') : String(req.body);

        const request = new Request('https://internal/webhook/clerk', {
            method: 'POST',
            headers: new Headers(req.headers as HeadersInit),
            body: payload,
        });

        const evt = await verifyWebhook(request, { signingSecret: env.CLERK_WEBHOOK_SECRET });

        if (evt.type === 'user.created' || evt.type === 'user.updated') {
            const user = evt.data;
            const email =
                user.email_addresses?.find((emailAddress) => emailAddress.id === user.primary_email_address_id)?.email_address ??
                user.email_addresses?.[0]?.email_address;

            if (!email) {
                return res.status(400).send('Clerk user is missing an email address');
            }

            const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || null;
            const role = parseRole(user.public_metadata?.role);

            await db
                .insert(users)
                .values({
                    clerkUserId: user.id,
                    email,
                    displayName,
                    role,
                })
                .onConflictDoUpdate({
                    target: users.clerkUserId,
                    set: {
                        email,
                        displayName,
                        role,
                        updatedAt: new Date(),
                    },
                });
        }

        if (evt.type === 'user.deleted' ) {
            const id=evt.data.id;
            if(id){
            await db.delete(users).where(eq(users.clerkUserId,id));
        }
    }

        return res.status(200).send('OK');
    } catch (err) {
        console.error('Error in clerkWebhookHandler:', err);
        return res.status(400).json('Internal Server Error');
    }
}
