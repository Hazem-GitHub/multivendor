import { prisma } from "@/src/db";
import authSeller from "@/src/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

// Update seller's store order status
export async function POST(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // Get the order id and status from the request body
        const { orderId, status } = await request.json();
        if (!orderId || !status) {
            return NextResponse.json({ error: "Missing order id or status" }, { status: 400 });
        }
        // Check if the order belongs to the store
        const order = await prisma.order.findUnique({
            where: { id: orderId, storeId },
        });
        if (!order) {
            return NextResponse.json({ error: "Order not found or does not belong to the store" }, { status: 404 });
        }
        // Update the order status
        await prisma.order.update({
            where: { id: orderId, storeId },
            data: { status },
        });
        return NextResponse.json({ message: "Order status updated successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}

// Get all orders for a seller's store
export async function GET(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const orders = await prisma.order.findMany({
            where: { storeId },
            include: {
                user: true,
                address: true,
                orderItems: {include: {product: true}},
            },
            orderBy: {createdAt: "desc"},
        });
        return NextResponse.json({ orders }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}