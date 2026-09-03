import {
    createPublicClient,
    createWalletClient,
    http
} from "viem";

import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

import {
    RPC_URL,
    CONTRACT_ADDRESS,
    ANVIL_PRIVATE_KEY
} from "./config.js";


export const client = createPublicClient({
    chain: foundry,
    transport: http(RPC_URL)
});


const account = privateKeyToAccount(
    ANVIL_PRIVATE_KEY
);


export const walletClient = createWalletClient({
    account,
    chain: foundry,
    transport: http(RPC_URL)
});


export const packageRegistryAbi = [
    {
        type: "function",
        name: "getPackage",
        stateMutability: "view",
        inputs: [
            {
                name: "_packageName",
                type: "string"
            }
        ],
        outputs: [
            {
                name: "",
                type: "string"
            },
            {
                name: "",
                type: "uint8"
            },
            {
                name: "",
                type: "uint256"
            },
            {
                name: "",
                type: "address"
            },
            {
                name: "",
                type: "bool"
            }
        ]
    },
    {
        type: "function",
        name: "reportPackage",
        stateMutability: "nonpayable",
        inputs: [
            {
                name: "_packageName",
                type: "string"
            }
        ],
        outputs: []
    },
    {
        type: "function",
        name: "updatePackageStatus",
        stateMutability: "nonpayable",
        inputs: [
            {
                name: "_packageName",
                type: "string"
            },
            {
                name: "_newStatus",
                type: "uint8"
            }
        ],
        outputs: []
    }
] as const;


// ================= READ PACKAGE =================

export async function getPackage(packageName: string) {

    const result = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: packageRegistryAbi,
        functionName: "getPackage",
        args: [packageName]
    });

    return result;
}


// ================= REPORT PACKAGE =================

export async function reportPackage(packageName: string) {

    const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: packageRegistryAbi,
        functionName: "reportPackage",
        args: [packageName],
        account
    });

    const receipt = await client.waitForTransactionReceipt({
        hash
    });

    return receipt;
}


// ================= UPDATE PACKAGE STATUS =================

export async function updatePackageStatus(
    packageName: string,
    status: number
) {

    const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: packageRegistryAbi,
        functionName: "updatePackageStatus",
        args: [packageName, status],
        account
    });

    const receipt = await client.waitForTransactionReceipt({
        hash
    });

    return receipt;
}