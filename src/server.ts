import "dotenv/config";
import { pool } from "./db";
import app from "./app"

const PORT = Number(process.env.PORT ?? 3000);

async function startServer(){
    if(!Number.isInteger(PORT) || PORT < 1 || PORT > 65535){
        throw new Error("Port must be a valid TCP port");
    }

    await pool.query("SELECT 1");

    const server = app.listen(PORT, () => {
        console.log(`Document search API listening on port ${PORT}`);
    })

    let shuttingDown = false;

    async function shutdown(signal: string){
        if(shuttingDown) return;
        shuttingDown = true;

        console.log(`${signal} received, Shutting down gracefully...`);

        server.close(async (error) => {
            try{
                await pool.end();
            } catch (poolError) {
                console.error("Failed to close database pool");
                process.exitCode = 1;
            }

            if (error) {
                console.error("Failed to close HTTP server", error);
            } else {
                console.log("HTTP server and database pool closed");
            }
        });
    }
    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

startServer().catch(async (error: unknown) => {
    console.error("Failed to start Document search api", error);
    try {
        await pool.end();
    } catch (poolError) {
        console.error("Failed to close database pool", poolError)
    }

    process.exitCode = 1;
})




// The index-creation endpoint is convenient for local learning, but production systems should usually manage indexes through controlled database migrations or deployment jobs. DDL endpoints should not be exposed to ordinary application users.
// Also note that the API currently accepts tenantId from the request body. That's acceptable for a local experiment, but a production multi-tenant service must derive the tenant identity from authenticated user credentials and enforce authorization server-side.