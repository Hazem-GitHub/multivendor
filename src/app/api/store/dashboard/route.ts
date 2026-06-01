// Get dashboard data for a store(seller) 
// ( total orders, total earnings, total products )

import { prisma } from "@/src/db";
import authSeller from "@/src/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) { 
    try {
        const { userId } = await getAuth(request);
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all orders for the store(seller)
        const orders = await prisma.order.findMany({
            where: { storeId }
        });

        // Get all products with ratings for the store(seller)
        const products = await prisma.product.findMany({
            where: { storeId }
        });

        const ratings = await prisma.rating.findMany({
            where: { productId: { in: products.map(product => product.id) } },
            include: {user: true, product: true}
        });

        const totalOrders = orders.length;
        const totalProducts = products.length;
        const totalEarnings = Math.round(orders.reduce((acc, order) => acc + order.total, 0));

        const dashboardData = {
            totalOrders,
            totalProducts,
            totalEarnings,
            ratings
        }

        return NextResponse.json({ dashboardData }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}