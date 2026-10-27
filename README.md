# SlopGuard

**Stopping Slopsquatting with a Blockchain-Anchored Package Registry**

AI coding assistants sometimes recommend npm packages that do not exist. Attackers can register those names with malicious code ("slopsquatting"). A plain registry check cannot catch this: once the attacker publishes, npm answers "exists".

SlopGuard combines a **live npm lookup** with a **persistent on-chain verdict** (a Solidity smart contract), so suspicious names can be reported, verified and re-checked by anyone, with a tamper-evident history.

> BCSE329 Blockchain and Distributed Ledger Technology: course project (demo).
> Team: Sujal Agarwal (23BKT0109), Radhika Agarwal (23BKT0078), Pritom Saha(23BCE2313). Guide: Dr. Sivaranjani A.

---

## How it works

For every package name, SlopGuard asks two sources and merges the answers:

| Source | Question |
|---|---|
| npm registry (`registry.npmjs.org`) | Does the package exist? Latest version? |
| `PackageRegistry` smart contract | Has this name been reported or verified? Status? |

| On-chain status | npm | Verdict |
|---|---|---|
| `CONFIRMED_HALLUCINATED` | any | **CONFIRMED_HALLUCINATED** |
| `UNVERIFIED` (reported) | any | **SUSPICIOUS** |
| none / `SAFE` | exists | **SAFE** |
| none | does not exist | **SUSPICIOUS** |

The order matters: a confirmed on-chain verdict wins even if the name now exists on npm, which is exactly the slopsquatting case.

**Report → verify → re-check**

1. Anyone runs `report <name>`: a transaction records the name as `UNVERIFIED`.
2. The contract owner runs `verify <name> safe|hallucinated`: the status changes and an event logs old and new status.
3. Every later `check` or `scan`, on any machine, reads the same record.

---

## Tech stack

| Layer | Technology |
|---|---|
| Smart contract | Solidity ^0.8.24 (compiled with Solc 0.8.33) |
| Contract tooling | Foundry (Forge for tests and deploy, Anvil for the local chain), forge-std |
| CLI | TypeScript, Node.js (tested on v22), `commander`, `viem`, `dotenv`, run with `tsx` |
| GenAI helper | Google Gemini via `@google/genai` (only for `suggest`) |
| Blockchain / network | EVM; local Anvil chain (chain id 31337). Any EVM RPC works through `RPC_URL`. |

---

## Repository layout

```
SlopGuard/
├── slopguard-contracts/        # Foundry project
│   ├── src/PackageRegistry.sol          # the smart contract
│   ├── test/PackageRegistry.t.sol       # 8 unit tests
│   └── script/DeployPackageRegistry.s.sol
└── slopguard-cli/              # TypeScript command-line tool
    └── src/
        ├── index.ts            # commands: check, scan, report, verify, suggest
        ├── analyzer.ts         # verdict engine (npm + chain)
        ├── scanner.ts          # package.json dependency scan
        ├── registry.ts         # npm registry lookup
        ├── contract.ts         # viem client + contract calls
        ├── config.ts           # reads .env
        └── ai/                 # Gemini suggester + verifier
```

---

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `anvil`)
- Node.js 20 or newer and npm
- A Gemini API key (only needed for `suggest`; see the note in step 4)

---

## Setup and installation

```bash
git clone https://github.com/RADHIKA281005/SlopGuard.git
cd SlopGuard

# 1. Contracts: install the test library and run the tests
cd slopguard-contracts
forge install foundry-rs/forge-std
forge test --gas-report            # expect: 8 passed, 0 failed

# 2. CLI dependencies
cd ../slopguard-cli
npm ci
```

---

## Run the project

### 1. Start a local chain

```bash
anvil                              # leave running; prints funded dev accounts + private keys
```

### 2. Deploy the smart contract

In a second terminal:

```bash
cd slopguard-contracts
forge script script/DeployPackageRegistry.s.sol:DeployPackageRegistry \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <ANVIL_ACCOUNT_0_PRIVATE_KEY> \
  --broadcast
```

Copy the printed contract address. The account that deploys becomes the **owner**, the only account that can verify packages.

### 3. Configure the CLI

Create `slopguard-cli/.env` (this file is git-ignored; never commit real keys):

```env
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=<address printed by the deploy script>
ANVIL_PRIVATE_KEY=<the same Anvil dev key you deployed with>
GEMINI_API_KEY=<your Gemini key, or any placeholder if you will not use `suggest`>
```

### 4. Use the CLI

```bash
cd slopguard-cli
npm run dev -- check express                       # real package -> SAFE
npm run dev -- check some-made-up-package-name     # not on npm -> SUSPICIOUS
npm run dev -- report some-made-up-package-name    # records it on-chain (UNVERIFIED)
npm run dev -- verify some-made-up-package-name hallucinated   # owner only
npm run dev -- check some-made-up-package-name     # -> CONFIRMED_HALLUCINATED
npm run dev -- scan ../path/to/a/project           # scans package.json
npm run dev -- suggest some-made-up-package-name   # AI alternatives, each verified
```

(`npm run dev -- <command>` is the same as `npx tsx src/index.ts <command>`.)

> Note: `config.ts` currently requires `GEMINI_API_KEY` to be set even for commands that do not use it, so use any placeholder value if you are not running `suggest`.

---

## CLI commands

| Command | What it does |
|---|---|
| `check <package>` | Verdict for one package: npm result, on-chain status, message |
| `scan <projectPath>` | Reads `dependencies` + `devDependencies` from `package.json`, analyses each, prints a summary, security score and risk level |
| `report <package>` | Anyone: records a suspicious name on-chain as `UNVERIFIED` (prints tx hash and block) |
| `verify <package> <safe\|hallucinated>` | Owner only: sets the status to `SAFE` or `CONFIRMED_HALLUCINATED` |
| `suggest <package>` | Gemini proposes up to 5 alternatives; SlopGuard verifies each one and sorts them into verified / suspicious / confirmed-hallucinated. The AI only proposes; it never decides. |

**Security score (for `scan`):** `score = max(0, 100 − 25 × suspicious − 50 × confirmed_hallucinated)`.
Risk level: LOW (≥ 90), MEDIUM (≥ 60), HIGH (≥ 30), CRITICAL (< 30).

---

## Smart contract: `PackageRegistry`

Statuses: `UNVERIFIED (0)`, `SAFE (1)`, `CONFIRMED_HALLUCINATED (2)`.

| Function | Who | Purpose |
|---|---|---|
| `reportPackage(name)` | anyone | Creates a record with status `UNVERIFIED`; reverts if the name already exists |
| `updatePackageStatus(name, status)` | owner | Changes the status of an existing record; emits old and new status |
| `registerPackage(name, status)` | owner | Inserts a record directly with a chosen status |
| `getPackage(name)` | view | Returns name, status, reported-at, reporter, exists |
| `getPackageStatus(name)` | view | Returns the status; reverts if not found |

Events: `PackageRegistered`, `PackageReported`, `PackageStatusUpdated` (the audit trail).
Measured on Foundry: deployment ≈ 1.14 M gas; `reportPackage` ≈ 96 k gas for a short name; `updatePackageStatus` ≈ 54 k gas.

---

## Contract deployment details

| Item | Value |
|---|---|
| Network | Local Anvil, chain id 31337 (public testnet not deployed) |
| Deployer / owner | Account that runs the deploy script |
| Contract address | Printed by the deploy script (a fresh Anvil node's first deployment from account 0 is `0x5FbDB2315678afecb367f032d93F642f64180aa3`) |
| Deploy script | `slopguard-contracts/script/DeployPackageRegistry.s.sol` |

To use a public testnet, deploy with that network's `--rpc-url` and a funded key, and set `RPC_URL` and `CONTRACT_ADDRESS` in `.env` (the CLI currently uses viem's `foundry` chain definition, so change the chain in `src/contract.ts` for other networks).

---

## Known limitations

- Anyone can report any name, so reporting a real package makes it show as SUSPICIOUS until the owner clears it.
- A single owner key verifies everything.
- A name marked SAFE on-chain but absent from npm (for example a private package) is still reported as SUSPICIOUS.
- Evaluated on a local chain; real block times and gas prices were not measured.

---

## Dependencies

Foundry, forge-std, Node.js ≥ 20, `viem`, `commander`, `dotenv`, `@google/genai`, `tsx`, `typescript` (see `slopguard-cli/package.json`).

## License

Course project; no license specified.
