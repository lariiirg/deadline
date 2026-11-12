import dotenv from "dotenv";

// Resolve relative to this file, regardless of the terminal's working directory.
dotenv.config({ path: new URL("../.env", import.meta.url), quiet: true });
