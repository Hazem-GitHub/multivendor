import { prisma } from "../db";
import { inngest } from "./client";

export const userFunctions = [
    // Inngest function to create user data in database
    inngest.createFunction(
        {
            id: "sync-user-create",
            name: "Sync User Create",
            triggers: { event:'clerk/user.created'},
        },
        async ({ event }) => {
                const { data } = event;
                const { id, email_addresses, image_url, first_name, last_name } = data;
                await prisma.user.create({
                    data: {
                        id,
                        email: email_addresses[0].email_address,
                        name: `${first_name} ${last_name}`,
                        image: image_url,
                    }
                })
            }
    ),
    // Inngest function to update user data in database
    inngest.createFunction(
        {
            id: "sync-user-update",
            name: "Sync User Update",
            triggers: { event:'clerk/user.updated'},
        },
        async ({ event }) => {
                const { data } = event;
                const { id, email_addresses, image_url, first_name, last_name } = data;
                await prisma.user.update({
                    where: { id },
                    data: {
                        email: email_addresses[0].email_address,
                        name: `${first_name} ${last_name}`,
                        image: image_url,
                    }
                })
            }
    ),
    // Inngest function to delete user data in database
    inngest.createFunction(
        {
            id: "sync-user-delete",
            name: "Sync User Delete",
            triggers: { event:'clerk/user.deleted'},
        },
        async ({ event }) => {
            const { data } = event;
            const { id } = data;
            await prisma.user.delete({ where: { id } });
        }
    ),
];


// Inngest function to delete coupon after it's expired
export const couponFunctions = [
    inngest.createFunction(
        {
            id: "delete-expired-coupon",
            name: "Delete Expired Coupon",
            triggers: { event:'coupon.expired'},
        },
        async ({ event, step }) => {
            const { data } = event;
            const expiryDate = new Date(data.expires_at);
            await step.sleepUntil(`wait-for-coupon-expiry`, expiryDate)

            await step.run('delete-coupon', async () => {
                await prisma.coupon.delete({ where: { code: data.code } });
            })
        }
    )
];