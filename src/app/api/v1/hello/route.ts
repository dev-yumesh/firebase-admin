import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
       
      return NextResponse.json({
        message: "Hello, User!"
      }, { status: 200 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }