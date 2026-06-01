import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/src/db";
import imageKit from "@/src/configs/imageKit";
// import { toFile } from "@imagekit/nodejs";

// Create the store
export async function POST(request: NextRequest) { 
    try {
        const { userId } = await getAuth(request);

        // Get the data from the form
        const formData = await request.formData();
        const name = formData.get("name") as string;
        const username = formData.get("username") as string;
        const description = formData.get("description") as string;
        const email = formData.get("email") as string;
        const contact = formData.get("contact") as string;
        const address = formData.get("address") as string;
        const image = formData.get("image") as File;

        // Validate the data
        if (!name || !username || !description || !email || !contact || !address || !image) {
            return NextResponse.json({ error: "Missing store information" }, { status: 400 });
        }

        // Check if the user has already registered a store
        const existingStore = await prisma.store.findFirst({
            where: { userId }
        });
        // Then return the status if so
        if (existingStore) {
            return NextResponse.json({ status: existingStore.status }, { status: 209 }); // 209 is a custom status code for already registered store
        }

        // Check if the username is already taken
        const isUsernameTaken = await prisma.store.findFirst({
            where: { username: { equals: username, mode: "insensitive" } }
        });
        if (isUsernameTaken) {
            return NextResponse.json({ error: "Username already taken" }, { status: 400 });
        }

        // Optimize the image
        const uploadedImageResponse = await imageKit.files.upload({
            file: image,
            fileName: `${username}-${Date.now()}.${image.name}`,
            folder: "Logos/Store",
        });

        const optimizedImage = await imageKit.helper.buildSrc({
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
            src: uploadedImageResponse.filePath,
            transformation: [
                {
                    quality: 80,
                    format: "webp",
                    width: 512,
                }
            ]
        });


        // Create the store
        const newStore = await prisma.store.create({
            data: {
                userId,
                name,
                username: username.toLowerCase(),
                description,
                email,
                contact,
                address,
                logo: optimizedImage,
            }
        });

        // Link store to user
        await prisma.user.update({
            where: { id: userId },
            data: { store: { connect: { id: newStore.id } } }
        });

        return NextResponse.json({ message: "Store created successfully, please wait for admin approval", success: true }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}


// Check if user has already registered a store if yes then sen the status to the client
export async function GET(request: NextRequest) {
    try {
        const { userId } = await getAuth(request);

        // Check if the user has already registered a store
        const store = await prisma.store.findFirst({
            where: { userId }
        });
        // Then return the status if so
        if (store) {
            return NextResponse.json({ status: store.status }, { status: 209 }); // 209 is a custom status code for already registered store
        }
        return NextResponse.json({ status: "not registered yet" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: error instanceof Error ? 400 : 500 });
    }
}
