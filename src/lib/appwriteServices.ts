import { Account, Client, Databases, ID, Storage, } from "appwrite";
import { env } from "../../config/env.config";

const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT)
  .setProject(env.APPWRITE_PROJECT_ID)
  // .setPlatform('com.rn_showcase');

export const account = new Account(client); 
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID };

