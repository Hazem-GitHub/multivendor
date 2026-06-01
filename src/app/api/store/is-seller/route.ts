import { prisma } from "@/src/db";
import authSeller from "@/src/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

// Check if the user is a seller
export async function GET(request: NextRequest) {
    try {
        const { userId } = await getAuth(request);
        // Check if the user is a seller
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // Check if the store is active
        const store = await prisma.store.findUnique({
            where: { userId }
        });
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }
        return NextResponse.json({ isSeller, store  }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}