import { init } from "@instantdb/react";
import schema from "../../instant.schema";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;

if (!APP_ID) {
  throw new Error("NEXT_PUBLIC_INSTANT_APP_ID is not defined in environment variables");
}

// Initialize InstantDB with type-safe schema and Clerk authentication
export const db = init<typeof schema>({
  appId: APP_ID,
  schema
});

// Export types for use throughout the app
export type Schema = typeof schema;
export type DB = typeof db;
