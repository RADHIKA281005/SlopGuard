import dotenv from "dotenv";

dotenv.config();

export const RPC_URL = process.env.RPC_URL;

export const CONTRACT_ADDRESS =
    process.env.CONTRACT_ADDRESS as `0x${string}`;

export const ANVIL_PRIVATE_KEY =
    process.env.ANVIL_PRIVATE_KEY as `0x${string}`;

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!RPC_URL) {
    throw new Error("RPC_URL is missing in .env file");
}

if (!CONTRACT_ADDRESS) {
    throw new Error("CONTRACT_ADDRESS is missing in .env file");
}

if (!ANVIL_PRIVATE_KEY) {
    throw new Error(
        "ANVIL_PRIVATE_KEY is missing in .env file"
    );
}

if (!GEMINI_API_KEY) {
    throw new Error(
        "GEMINI_API_KEY is missing in .env file"
    );
}

console.log("Loaded contract address:", CONTRACT_ADDRESS);