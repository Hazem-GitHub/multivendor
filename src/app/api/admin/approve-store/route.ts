// Approve seller store

import { prisma } from "@/src/db";
import authAdmin from "@/src/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { storeId, status } = await request.json();
        if (status === 'approved') {
            await prisma.store.update({
                where: { id: storeId },
                data: { status: "approved", isActive: true },
            });
        } else if (status === 'rejected') {
            await prisma.store.update({
                where: { id: storeId },
                data: { status: "rejected", isActive: false },
            });
        }
        
        return NextResponse.json({ message:  `${status.charAt(0).toUpperCase() + status.slice(1)} successfully` }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}

// Get all pending and rejected stores
export async function GET(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const stores = await prisma.store.findMany({
            where: { status: { in: ["pending", "rejected"] } },
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