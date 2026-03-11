import { env } from "@/config/env.config";
import * as Crypto from "crypto";

type QR_DATA = {
  entityName: string; //shop name or table name (format of table name "table_[floor_number]_[table_number]" )
  entityId: string;
  entityType: "TABLE" | "SHOP";
};

function generateSecureToken(length: number) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomArray = new Uint8Array(length);
  Crypto.getRandomValues(randomArray); // Use window.crypto in browsers
  randomArray.forEach((number) => {
    result += chars[number % chars.length];
  });
  return result;
}

export const constructQRURL = (data: QR_DATA) => {
  const randomToken = generateSecureToken(32);

  return `${env.WEB_BASE_URL}?session=${randomToken}&stn=${data.entityName}&sid=${data.entityId}&identifier=${data.entityType}`;
};
