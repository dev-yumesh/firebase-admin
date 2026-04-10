import { NextRequest, NextResponse } from "next/server";
import {
  formatRegistrationError,
  registerUserWithOptionalShop,
} from "@/lib/userRegistrationService";
import { USER_ROLES } from "@/constants/enums";
import { shopOwnerRegistrationSchema, userCreateSchema } from "@/utils/validators";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = await shopOwnerRegistrationSchema.validate(json);

    const userValidationResult = await userCreateSchema.validate({
      ...body.userData,
      role: USER_ROLES.OWNER,
    });

    const result = await registerUserWithOptionalShop(
      userValidationResult,
      body.shopData,
      {
        logoURL: null,
        bannerImageURL: null,
      },
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("shop owner register error", error);
    const { status, body } = formatRegistrationError(error);
    return NextResponse.json(body, { status });
  }
}
