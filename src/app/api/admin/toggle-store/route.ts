import { prisma } from "@/src/db";
import authAdmin from "@/src/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

// Toggle store active status
export async function POST(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { storeId } = await request.json();
        if (!storeId) {
            return NextResponse.json({ error: "Missing store ID" }, { status: 404 });
        }
        // Find the store
        const store = await prisma.store.findUnique({
            where: { id: storeId },
        });
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }
        await prisma.store.update({
            where: { id: storeId },
            data: { isActive: !store.isActive },
        });
        return NextResponse.json({ message: `Store ${!store.isActive ? "activated" : "deactivated"} successfully` }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}