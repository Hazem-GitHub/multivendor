import imageKit from "@/src/configs/imageKit";
import { prisma } from "@/src/db";
import authSeller from "@/src/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

// Create a product for a store
export async function POST(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the data from the form
        const formData = await request.formData();
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const mrp = parseFloat(formData.get("mrp") as string);
        const price = parseFloat(formData.get("price") as string);
        const category = formData.get("category") as string;
        const images = formData.getAll("images") as File[];

        // Validate the data
        if (!name || !description || !mrp || !price || !category || !images) {
            return NextResponse.json({ error: "Missing product information" }, { status: 400 });
        }

        const uploadedImagesResponses = await Promise.all(images.map(async (image) => {
            return await imageKit.files.upload({
                file: image,
                fileName: `${name}-${Date.now()}.${image.name}`,
                folder: `Products/Store/${storeId}`,
            });
        }));

        const optimizedImages = await Promise.all(uploadedImagesResponses.map(async (response) => {
            return await imageKit.helper.buildSrc({
                urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
                src: response.filePath,
                transformation: [
                    {
                        quality: 80,
                        format: "webp",
                        width: 1024,
                    }
                ]
            });
        }));

        // Create the product
        await prisma.product.create({
            data: {
                storeId,
                name,
                description,
                mrp,
                price,
                category,
                images: optimizedImages,
            }
        });

        return NextResponse.json({ message: "Product created successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}

// Get all products for a seller
export async function GET(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const products = await prisma.product.findMany({
            where: { storeId },
            orderBy: {
                createdAt: "desc",
            },
        });
        if (!products) {
            return NextResponse.json({ error: "No products found" }, { status: 404 });
        }

        return NextResponse.json({ products, message: "Products fetched successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}