import { prisma } from "../db";

const authSeller = async (userId: string): Promise<string | false> => { 
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                store: true,
            }
        });

        if (user.store) {
            if (user.store.status === "approved") { 
                return user.store.id;
            }
        } else {
            return false
        }
    } catch (error) {
        console.error(error);
        return false;
    }
}

export default authSeller;