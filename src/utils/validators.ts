import * as yup from "yup";

const USER_ROLES = ["CUSTOMER", "OWNER", "MANAGER"] as const;
const SHOP_TYPES = ["STALL", "RESTAURANT"] as const;

const ENTITY_STATUS = ["ACTIVE", "INACTIVE"] as const;
const APP_PLATFORMS = ["ALL", "ANDROID", "IOS", "WEB"] as const;
const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const PHONE_REGEX = /^\+?[0-9\s-]{7,15}$/;

const trimString = (value: unknown) =>
  typeof value === "string" ? value.trim() : value;

const trimLowerString = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const trimUpperString = (value: unknown) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

const typeErrorMessages = {
  userAddress: "userAddress must be an object",
  latitude: "userAddress.latitude must be a number",
  longitude: "userAddress.longitude must be a number",
  forceUpdate: "forceUpdate must be boolean",
  maintenanceMode: "maintenanceMode must be boolean",
  latestBuildNumber: "latestBuildNumber must be a positive number",
};

export const normalizeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const removeUndefinedFields = <T extends Record<string, unknown>>(
  obj: T
) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;

export const toIsoDate = (value: any): string | null => {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (typeof value._seconds === "number") {
    const ms = value._seconds * 1000 + (value._nanoseconds || 0) / 1_000_000;
    return new Date(ms).toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
};

const extractValidationErrors = (error: unknown): string[] => {
  if (error instanceof yup.ValidationError) {
    if (error.inner.length) {
      return Array.from(
        new Set(error.inner.map((item) => item.message).filter(Boolean))
      );
    }
    return [error.message];
  }

  return ["Validation failed"];
};

const userAddressSchema = yup
  .object({
    latitude: yup
      .number()
      .transform((value, originalValue) =>
        originalValue === "" || originalValue === null ? undefined : value
      )
      .typeError(typeErrorMessages.latitude)
      .notRequired(),
    longitude: yup
      .number()
      .transform((value, originalValue) =>
        originalValue === "" || originalValue === null ? undefined : value
      )
      .typeError(typeErrorMessages.longitude)
      .notRequired(),
  })
  .typeError(typeErrorMessages.userAddress)
  .notRequired();

export const userCreateSchema = yup.object({
  // id: yup.string().transform((_, originalValue) => trimString(originalValue)).notRequired(),
  name: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .required("name is required"),
  email: yup
    .string()
    .transform((_, originalValue) => trimLowerString(originalValue))
    .required("email is required")
    .email("email is invalid"),
  password: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .required("password is required")
    .min(6, "password must be at least 6 characters"),
  phone: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired()
    .test("valid-phone", "phone is invalid", (value) => !value || PHONE_REGEX.test(value)),
  role: yup
    .string()
    .transform((_, originalValue) => trimUpperString(originalValue))
    .default("CUSTOMER")
    .oneOf(USER_ROLES, "role must be one of CUSTOMER, OWNER, ADMIN"),
  // language: yup
  //   .string()
  //   .transform((_, originalValue) => trimString(originalValue))
  //   .default("en"),
  // status: yup
  //   .string()
  //   .transform((_, originalValue) => trimUpperString(originalValue))
  //   .default("ACTIVE")
  //   .oneOf(ENTITY_STATUS, "status must be one of ACTIVE, INACTIVE"),
  // photo: yup.mixed().notRequired(),
  // photoURL: yup.mixed().notRequired(),
  // address: yup.mixed().notRequired(),
  // userAddress: userAddressSchema,
  // isEmailVerified: yup.boolean().default(false),
  // isPhoneVerified: yup.boolean().default(false),
  // isActive: yup.boolean().default(true),
  // coins: yup.number().notRequired().default(0),
  // availableCoins: yup.number().notRequired().default(0),
  // walletBalance: yup.number().notRequired().default(0),
});

export const shopCreateSchema = yup.object({
  shopName: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .required("shopName is required"),

  shopType: yup
    .string()
    .transform((_, originalValue) => trimUpperString(originalValue))
    .required("shopType is required")
    .oneOf(SHOP_TYPES, "shopType must be one of RESTAURANT, SHOP, CAFE"),

  hasSeating: yup
    .boolean()
    .required("hasSeating is required"),

  totalFloors: yup
    .number()
    .typeError("totalFloors must be a number")
    .min(0, "totalFloors cannot be negative")
    .required("totalFloors is required"),

  logoURL: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired()
    .url("logoURL must be a valid URL"),

  bannerImageURL: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired()
    .url("bannerImageURL must be a valid URL"),
});

// Used for partial updates (PUT).
export const shopUpdateSchema = yup.object({
  shopName: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired(),
  shopType: yup
    .string()
    .transform((_, originalValue) => trimUpperString(originalValue))
    .notRequired()
    .oneOf(SHOP_TYPES, "shopType must be one of RESTAURANT, SHOP, CAFE"),
  hasSeating: yup.boolean().notRequired(),
  totalFloors: yup
    .number()
    .typeError("totalFloors must be a number")
    .min(0, "totalFloors cannot be negative")
    .notRequired(),
  logoURL: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired()
    .url("logoURL must be a valid URL"),
  bannerImageURL: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired()
    .url("bannerImageURL must be a valid URL"),

  // Common shop metadata fields (some may be optional depending on your data model).
  ownerUID: yup.string().notRequired(),
  ownerId: yup.string().notRequired(),
  shopEmail: yup
    .string()
    .transform((_, originalValue) => trimLowerString(originalValue))
    .notRequired()
    .email("shopEmail is invalid"),
  shopQR: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired(),
  isVerified: yup.boolean().notRequired(),
  isOwnerVerified: yup.boolean().notRequired(),
  isEmailVerified: yup.boolean().notRequired(),
  isActive: yup.boolean().notRequired(),
  status: yup
    .string()
    .transform((_, originalValue) => trimUpperString(originalValue))
    .notRequired()
    .oneOf(ENTITY_STATUS, "status must be one of ACTIVE, INACTIVE"),
  isPrimary: yup.boolean().notRequired(),
  availableWalletBalance: yup.number().notRequired(),
  address: yup.mixed().notRequired(),
});

export const userUpdateSchema = yup.object({
  name: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired(),
  email: yup
    .string()
    .transform((_, originalValue) => trimLowerString(originalValue))
    .notRequired()
    .email("email is invalid"),
  password: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired()
    .test(
      "password-when-present",
      "password is required",
      (_, context) =>
        (context.originalValue as any)?.password === undefined ||
        Boolean(normalizeString((context.originalValue as any)?.password))
    )
    .test(
      "password-min",
      "password must be at least 6 characters",
      (_, context) => {
        const rawPassword = (context.originalValue as any)?.password;
        if (rawPassword === undefined) return true;
        return normalizeString(rawPassword).length >= 6;
      }
    ),
  phone: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired()
    .test("valid-phone", "phone is invalid", (value) => !value || PHONE_REGEX.test(value)),
  role: yup
    .string()
    .transform((_, originalValue) => trimUpperString(originalValue))
    .notRequired()
    .oneOf(USER_ROLES, "role must be one of CUSTOMER, OWNER, ADMIN"),
  language: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired(),
  status: yup
    .string()
    .transform((_, originalValue) => trimUpperString(originalValue))
    .notRequired()
    .oneOf(ENTITY_STATUS, "status must be one of ACTIVE, INACTIVE"),
  photo: yup.mixed().notRequired(),
  photoURL: yup.mixed().notRequired(),
  address: yup.mixed().notRequired(),
  userAddress: userAddressSchema,
  isEmailVerified: yup.boolean().notRequired(),
  isPhoneVerified: yup.boolean().notRequired(),
  isActive: yup.boolean().notRequired(),
  coins: yup.number().notRequired(),
  availableCoins: yup.number().notRequired(),
  walletBalance: yup.number().notRequired(),
});

export const appSettingsCreateSchema = yup.object({
  key: yup
    .string()
    .transform((_, originalValue) => trimUpperString(originalValue))
    .required("key is required"),
  platform: yup
    .string()
    .transform((_, originalValue) => trimUpperString(originalValue))
    .default("ALL")
    .oneOf(APP_PLATFORMS, "platform must be one of ALL, ANDROID, IOS, WEB"),
  version: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .required("version is required")
    .matches(SEMVER_REGEX, "version must be a valid semver like 1.0.0"),
  minSupportedVersion: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired()
    .test(
      "min-supported-semver",
      "minSupportedVersion must be a valid semver like 1.0.0",
      (value) => !value || SEMVER_REGEX.test(value)
    ),
  forceUpdate: yup
    .boolean()
    .typeError(typeErrorMessages.forceUpdate)
    .required("forceUpdate must be boolean"),
  maintenanceMode: yup
    .boolean()
    .typeError(typeErrorMessages.maintenanceMode)
    .default(false),
  latestBuildNumber: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === undefined || originalValue === null || originalValue === ""
        ? undefined
        : value
    )
    .typeError(typeErrorMessages.latestBuildNumber)
    .min(0, typeErrorMessages.latestBuildNumber)
    .default(0),
  title: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired(),
  updateMessage: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired(),
  downloadUrl: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired(),
  status: yup
    .string()
    .transform((_, originalValue) => trimUpperString(originalValue))
    .default("ACTIVE")
    .oneOf(ENTITY_STATUS, "status must be one of ACTIVE, INACTIVE"),
  releaseDate: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired()
    .test(
      "valid-release-date",
      "releaseDate must be a valid date string",
      (value) => !value || !Number.isNaN(new Date(value).getTime())
    ),
});

export const appSettingsUpdateSchema = yup.object({
  key: yup
    .string()
    .transform((_, originalValue) => trimUpperString(originalValue))
    .notRequired(),
  platform: yup
    .string()
    .transform((_, originalValue) => trimUpperString(originalValue))
    .notRequired()
    .oneOf(APP_PLATFORMS, "platform must be one of ALL, ANDROID, IOS, WEB"),
  version: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired()
    .test(
      "version-semver",
      "version must be a valid semver like 1.0.0",
      (value) => !value || SEMVER_REGEX.test(value)
    ),
  minSupportedVersion: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired()
    .test(
      "min-supported-semver",
      "minSupportedVersion must be a valid semver like 1.0.0",
      (value) => !value || SEMVER_REGEX.test(value)
    ),
  forceUpdate: yup.boolean().typeError(typeErrorMessages.forceUpdate).notRequired(),
  maintenanceMode: yup
    .boolean()
    .typeError(typeErrorMessages.maintenanceMode)
    .notRequired(),
  latestBuildNumber: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === undefined || originalValue === null || originalValue === ""
        ? undefined
        : value
    )
    .typeError(typeErrorMessages.latestBuildNumber)
    .min(0, typeErrorMessages.latestBuildNumber)
    .notRequired(),
  title: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired(),
  updateMessage: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired(),
  downloadUrl: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired(),
  status: yup
    .string()
    .transform((_, originalValue) => trimUpperString(originalValue))
    .notRequired()
    .oneOf(ENTITY_STATUS, "status must be one of ACTIVE, INACTIVE"),
  releaseDate: yup
    .string()
    .transform((_, originalValue) => trimString(originalValue))
    .notRequired()
    .test(
      "valid-release-date",
      "releaseDate must be a valid date string",
      (value) => !value || !Number.isNaN(new Date(value).getTime())
    ),
});

export const buildUserPayload = async (body: unknown, isCreate: boolean) => {
  try {
    const validated: any = await (
      isCreate ? userCreateSchema : userUpdateSchema
    ).validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const payload = isCreate
      ? removeUndefinedFields({
          id: validated.id || undefined,
          name: validated.name,
          email: validated.email,
          phone: validated.phone,
          role: validated.role,
          language: validated.language,
          photo: validated.photo,
          photoURL: validated.photoURL,
          address: validated.address,
          userAddress: validated.userAddress,
          isEmailVerified: validated.isEmailVerified,
          isPhoneVerified: validated.isPhoneVerified,
          isActive: validated.isActive,
          status: validated.status,
          coins: validated.coins,
          availableCoins: validated.availableCoins,
          walletBalance: validated.walletBalance,
        })
      : removeUndefinedFields({
          name: validated.name,
          email: validated.email,
          phone: validated.phone,
          role: validated.role,
          language: validated.language,
          photo: validated.photo,
          photoURL: validated.photoURL,
          address: validated.address,
          userAddress: validated.userAddress,
          isEmailVerified: validated.isEmailVerified,
          isPhoneVerified: validated.isPhoneVerified,
          isActive: validated.isActive,
          status: validated.status,
          coins: validated.coins,
          availableCoins: validated.availableCoins,
          walletBalance: validated.walletBalance,
        });

    return { errors: [] as string[], payload };
  } catch (error) {
    return { errors: extractValidationErrors(error), payload: null };
  }
};

export const buildAppSettingsPayload = async (
  body: unknown,
  isCreate: boolean
) => {
  try {
    const validated: any = await (
      isCreate ? appSettingsCreateSchema : appSettingsUpdateSchema
    ).validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const payload = isCreate
      ? removeUndefinedFields({
          key: validated.key,
          platform: validated.platform,
          version: validated.version,
          minSupportedVersion: validated.minSupportedVersion,
          forceUpdate: validated.forceUpdate,
          maintenanceMode: validated.maintenanceMode,
          latestBuildNumber: validated.latestBuildNumber,
          title: validated.title,
          updateMessage: validated.updateMessage,
          downloadUrl: validated.downloadUrl,
          status: validated.status,
          releaseDate: validated.releaseDate,
        })
      : removeUndefinedFields({
          key: validated.key,
          platform: validated.platform,
          version: validated.version,
          minSupportedVersion: validated.minSupportedVersion,
          forceUpdate: validated.forceUpdate,
          maintenanceMode: validated.maintenanceMode,
          latestBuildNumber: validated.latestBuildNumber,
          title: validated.title,
          updateMessage: validated.updateMessage,
          downloadUrl: validated.downloadUrl,
          status: validated.status,
          releaseDate: validated.releaseDate,
        });

    return { errors: [] as string[], payload };
  } catch (error) {
    return { errors: extractValidationErrors(error), payload: null };
  }
};
