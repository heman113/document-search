import "dotenv/config";
import { Pool } from "pg";

if(!process.env.DATABASE_URL){
    throw new Error("Database url is required");
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
    console.error("Unexpected idle PostgreSQL client error", error);
});