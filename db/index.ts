import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Pooled connection: prepared statements must be off.
const client = postgres(process.env.POSTGRES_URL!, { prepare: false });
export const db = drizzle(client, { schema });
