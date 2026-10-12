# SlopGuard evaluation kit (reproduces the numbers in DA-9 / DA-10)

Contents
- harness/run_eval.ts   main set, simulated squatting, misuse tests, gas, latency
- harness/run_hard.ts   stress set + interleaved latency
- data/                 package-name lists (real / drafted candidates / confirmed-404 list on 12/10/2026)
- results/              raw JSON outputs, forge test + gas report, CLI transcripts

How to run (from the SlopGuard repo)
1. cd slopguard-contracts && forge install foundry-rs/forge-std && forge test --gas-report
2. anvil &   then deploy:  forge script script/DeployPackageRegistry.s.sol:DeployPackageRegistry --rpc-url http://127.0.0.1:8545 --private-key <anvil dev key> --broadcast
3. cd ../slopguard-cli && npm ci && mkdir eval && cp <kit>/harness/*.ts eval/
4. .env: RPC_URL, CONTRACT_ADDRESS, ANVIL_PRIVATE_KEY (Anvil development key only), GEMINI_API_KEY (any value; config.ts requires it)
5. cp <kit>/data/*.txt to a folder X, then:  EVAL_DIR=X npx tsx eval/run_eval.ts && EVAL_DIR=X npx tsx eval/run_hard.ts
   Results are written to X/results.json and X/hard.json.

Notes
- Run on a fresh Anvil deployment: run_eval.ts writes to the chain (reports/verifies names).
- npm results depend on the day you run it; names may have been registered since 12/10/2026.
- Hallucinated names were drafted with a GenAI assistant and filtered by npm 404; regenerate them with your own LLM runs for stronger evidence.
- Squatting is simulated by patching fetch; nothing is published to npm.
