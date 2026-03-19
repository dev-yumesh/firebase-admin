import { env } from "@/config/env.config";
import { db } from "@/lib/firebaseAdmin";
import { toIsoDate } from "@/utils/validators";
import { NextRequest, NextResponse } from "next/server";

const COLLECTION = env.FIREBASE_MENU_ITEMS_COLLECTION_ID;


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const newItem = {
            ...body,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await db.collection(COLLECTION).add(newItem);

        return NextResponse.json({
            success: true,
            data: {
                id: docRef.id,
                ...newItem,
                createdAt: toIsoDate(newItem.createdAt),
                updatedAt: toIsoDate(newItem.updatedAt),
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Create failed",
            },
            { status: 500 }
        );
    }
}