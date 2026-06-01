import { clerkClient } from "@clerk/nextjs/server";

const authAdmin = async (userId: string): Promise<boolean> => { 
    try {
        if (!userId) return false;
        
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        if (!user) return false;

        const email = user.emailAddresses[0].emailAddress;
        if (!email) return false;

        const adminEmails = process.env.ADMIN_EMAIL?.split(',') || [];
        if (adminEmails.includes(email)) return true; else return false;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export default authAdmin;