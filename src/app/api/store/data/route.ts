// Get store information & store products

import { prisma } from "@/src/db";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username').toLowerCase();

        if (!username) {
            return NextResponse.json({ error: "Missing username" }, { status: 400 });
        }

        // Get store information and isStock products with ratings
        const store = await prisma.store.findUnique({
            where: { username, isActive: true },
            include: {Product: {include: {rating: true}}}
        });
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }
        return NextResponse.json({ store }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}