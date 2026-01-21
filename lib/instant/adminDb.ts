import { init } from "@instantdb/admin";
import schema from "../../instant.schema";

export const adminDB = init<typeof schema>({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});