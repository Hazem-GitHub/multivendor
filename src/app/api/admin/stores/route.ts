// Get all approved stores

import { prisma } from "@/src/db";
import authAdmin from "@/src/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const stores = await prisma.store.findMany({
            where: { status: "approved" },
            include: {
                user: true,
            },
        });
        return NextResponse.json({ stores }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}