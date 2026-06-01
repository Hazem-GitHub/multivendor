// Add a new coupon

import { prisma } from "@/src/db";
import { inngest } from "@/src/inngest/client";
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
        const { coupon } = await request.json();
        const { code, description, discount, expiresAt } = coupon
        if (!code || !description || !discount || !expiresAt) {
            return NextResponse.json({ error: "Missing coupon information" }, { status: 400 });
        }
        await prisma.coupon.create({
            data: {...coupon, code: code.toUpperCase()},
        }).then(async () => {
            // Trigger the inngest function to delete the coupon after it's expired
            await inngest.send({
                name: "app/coupon.expired",
                data: {
                    code: code.toUpperCase(),
                    expires_at: expiresAt,
                },
            });
        });
        return NextResponse.json({ message: "Coupon created successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}


// Get all coupons
export async function GET(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const coupons = await prisma.coupon.findMany({});
        return NextResponse.json({ coupons }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}

// Delete a coupon /api/admin/coupon?id=couponId
export async function DELETE(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        if (!code) {
            return NextResponse.json({ error: "Missing coupon code" }, { status: 400 });
        }
        await prisma.coupon.delete({
            where: { code },
        });
        return NextResponse.json({ message: "Coupon deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}