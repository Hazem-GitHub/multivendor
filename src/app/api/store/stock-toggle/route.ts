import { prisma } from "@/src/db";
import authSeller from "@/src/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

// Toggle the stock of a product
export async function POST(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        // Check if the product id is provided
        const { productId } = await request.json();
        if (!productId) {
            return NextResponse.json({ error: "Missing product id" }, { status: 400 });
        }
        // Check if the user is a seller
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // Check if the product belongs to the store
        const product = await prisma.product.findFirst({
            where: { id: productId, storeId },
        });
        if (!product) {
            return NextResponse.json({ error: "Product not found or does not belong to the store" }, { status: 404 });
        }
        // Toggle the stock
        await prisma.product.update({
            where: { id: productId },
            data: { inStock: !product.inStock, updatedAt: new Date() },
        });
        return NextResponse.json({ message: product.inStock ? "Product is now out of stock" : "Product is now in stock" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}