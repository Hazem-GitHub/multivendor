
import { prisma } from "@/src/db";
import authAdmin from "@/src/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

// Get dashboard data for admin 
// (total orders, total stores, total products, total revenue)
export async function GET(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // Get total orders
        const totalOrders = await prisma.order.count();
        // Get total stores
        const totalStores = await prisma.store.count();
        // Get total products
        const totalProducts = await prisma.product.count();
        // Get all orders include createdAt and total & calculate total revenue
        const allOrders = await prisma.order.findMany({
            select: {
                createdAt: true,
                total: true,
            },
        });
        // Get total revenue
        // const totalRevenue = await prisma.order.aggregate({ _sum: { total: true } });
        let revenue = 0;
        allOrders.forEach(order => {
            revenue += order.total;
        });
        const totalRevenue = revenue.toFixed(2);

        const dashboardData = {
            orders:totalOrders,
            stores: totalStores,
            products: totalProducts,
            revenue: totalRevenue,
            allOrders,
        }

        return NextResponse.json({
            dashboardData
        }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}