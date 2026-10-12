import fs from "fs";
import { performance } from "perf_hooks";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { analyzePackage } from "../src/analyzer";
import { checkNpmPackage } from "../src/registry";
import { getPackage, reportPackage, updatePackageStatus, client, packageRegistryAbi } from "../src/contract";
import { CONTRACT_ADDRESS, RPC_URL } from "../src/config";

const D = process.env.EVAL_DIR!;
const read = (f: string) => fs.readFileSync(`${D}/${f}`, "utf8").split("\n").map(s => s.trim()).filter(Boolean);
const real = [...new Set(read("real.txt"))];
const cand = [...new Set(read("cand.txt"))];
const out: any = {};
const stats = (a: number[]) => { const s=[...a].sort((x,y)=>x-y); const q=(p:number)=>s[Math.min(s.length-1,Math.floor(p*s.length))]; return {n:a.length, mean:a.reduce((x,y)=>x+y,0)/a.length, median:q(.5), p95:q(.95), min:s[0], max:s[s.length-1]}; };
const metrics = (tp:number,fp:number,tn:number,fn:number)=>{ const acc=(tp+tn)/(tp+fp+tn+fn); const pr=tp+fp?tp/(tp+fp):0; const rc=tp+fn?tp/(tp+fn):0; const f1=pr+rc?2*pr*rc/(pr+rc):0; return {tp,fp,tn,fn,accuracy:acc,precision:pr,recall:rc,f1}; };

// naming heuristic fixed a priori (no registry lookup)
const SUF = ["utils","helper","helpers","lite","pro","plus","ai","kit","wrapper","manager","toolkit"];
const heur = (n: string) => { const base = n.replace(/^@[^/]+\//,""); const t = base.split("-"); return t.length >= 3 || SUF.includes(t[t.length-1]); };

(async () => {
  // ---------- Exp 1: real npm lookups ----------
  const npmCache: Record<string, any> = {}; const npmLat: Record<string, number> = {};
  for (const n of [...real, ...cand]) { const t=performance.now(); npmCache[n] = await checkNpmPackage(n); npmLat[n]=performance.now()-t; }
  const H = cand.filter(n => !npmCache[n].exists);
  const registered = cand.filter(n => npmCache[n].exists);
  out.dataset = { real: real.length, candidates: cand.length, hallucinated_404: H.length, candidates_already_registered: registered.length, already_registered_names: registered };
  fs.writeFileSync(`${D}/hallucinated_404.txt`, H.join("\n"));
  // classify
  const sg: Record<string, any> = {}; const sgLat: number[] = []; const chainLat: number[] = [];
  const evalSet = [...real.map(n=>({n,y:0})), ...H.map(n=>({n,y:1}))];
  for (const {n} of evalSet) { const t=performance.now(); sg[n]=await analyzePackage(n); sgLat.push(performance.now()-t); }
  for (const {n} of evalSet.slice(0,60)) { const t=performance.now(); await getPackage(n); chainLat.push(performance.now()-t); }
  const m = (pred:(n:string)=>boolean)=>{ let tp=0,fp=0,tn=0,fn=0; for(const {n,y} of evalSet){const p=pred(n); if(y&&p)tp++; else if(!y&&p)fp++; else if(!y&&!p)tn++; else fn++;} return metrics(tp,fp,tn,fn); };
  out.exp1 = {
    n_benign: real.length, n_hallucinated: H.length,
    B1_npm_existence: m(n=>!npmCache[n].exists),
    B2_name_heuristic: m(heur),
    SlopGuard_empty_chain: m(n=>sg[n].verdict!=="SAFE"),
    heuristic_false_positives: real.filter(heur),
    heuristic_misses: H.filter(n=>!heur(n)),
    latency_ms: { npm_only: stats(evalSet.map(e=>npmLat[e.n])), slopguard_full: stats(sgLat), chain_read_only: stats(chainLat) },
  };

  // ---------- Exp 2: simulated squatting (attacker registers hallucinated names on npm) ----------
  const squat = new Set(H);
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (u: any, i?: any) => { const url = String(u); const nm = decodeURIComponent(url.replace("https://registry.npmjs.org/","")); if (squat.has(nm)) return new Response(JSON.stringify({name:nm,"dist-tags":{latest:"0.0.1"}}),{status:200}); return realFetch(u,i); }) as any;
  const levels = [0,25,50,75,100]; let covered = 0; const exp2: any[] = [];
  for (const lvl of levels) {
    const target = Math.round(H.length*lvl/100);
    while (covered < target) { const n=H[covered]; await reportPackage(n); await updatePackageStatus(n,2); covered++; }
    let tpS=0, tpB=0, fpS=0; const verd: Record<string,number> = {};
    for (const n of H) { const r = await analyzePackage(n); verd[r.verdict]=(verd[r.verdict]||0)+1; if (r.verdict!=="SAFE") tpS++; if (!npmCache[n].exists && false) tpB++; }
    for (const n of real) { const r = await analyzePackage(n); if (r.verdict!=="SAFE") fpS++; }
    exp2.push({ coverage_pct: lvl, names_on_chain: covered, baseline_recall: 0, slopguard_recall: tpS/H.length, benign_false_positives: fpS, verdicts: verd });
  }
  out.exp2 = exp2;
  // reported-only scenario on a fresh slice is not possible (names already confirmed) -> use separate synthetic names
  const synth = Array.from({length:20},(_,i)=>`zz-eval-reported-only-${i}`); synth.forEach(n=>squat.add(n));
  for (const n of synth) await reportPackage(n);
  const vr: Record<string,number> = {}; for (const n of synth) { const r=await analyzePackage(n); vr[r.verdict]=(vr[r.verdict]||0)+1; }
  out.exp2_reported_only = { n: synth.length, verdicts: vr };
  globalThis.fetch = realFetch;

  // ---------- Exp 3: adversarial / edge cases ----------
  const spamAcct = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
  const spamWallet = createWalletClient({ account: spamAcct, chain: foundry, transport: http(RPC_URL) });
  const victims = real.slice(0,10); let spamFP = 0;
  for (const v of victims) { const h = await spamWallet.writeContract({address:CONTRACT_ADDRESS,abi:packageRegistryAbi,functionName:"reportPackage",args:[v],account:spamAcct}); await client.waitForTransactionReceipt({hash:h}); const r=await analyzePackage(v); if (r.verdict==="SUSPICIOUS") spamFP++; }
  // owner clears one by verifying SAFE
  await updatePackageStatus(victims[0],1); const cleared = await analyzePackage(victims[0]);
  // non-owner attempts to verify
  let nonOwnerBlocked = false; try { await spamWallet.writeContract({address:CONTRACT_ADDRESS,abi:packageRegistryAbi,functionName:"updatePackageStatus",args:[victims[1],2],account:spamAcct}); } catch(e:any){ nonOwnerBlocked = /Only owner/.test(String(e)); }
  // duplicate report
  let dupBlocked=false; try { await reportPackage(victims[1]); } catch(e:any){ dupBlocked=/already reported/.test(String(e)); }
  // chain says SAFE but absent from npm
  const priv = "zz-private-internal-pkg-eval"; await reportPackage(priv); await updatePackageStatus(priv,1); const privR = await analyzePackage(priv);
  out.exp3 = { spam_reports: victims.length, spam_false_positives: spamFP, owner_clear_verdict: cleared.verdict, non_owner_verify_blocked: nonOwnerBlocked, duplicate_report_blocked: dupBlocked, safe_onchain_absent_npm: { verdict: privR.verdict, blockchainStatus: privR.blockchainStatus } };

  // ---------- Exp 4: gas vs name length + tx latency ----------
  const lens = [8,16,32,64,128]; const gas: any[] = [];
  for (const L of lens) { const nm = "g"+"x".repeat(L-1)+Date.now()%1000; const nm2 = nm.slice(0,L-3)+"abc"; const t0=performance.now(); const r1 = await reportPackage(nm2+"r"); const t1=performance.now(); const r2 = await updatePackageStatus(nm2+"r",2); const t2=performance.now(); gas.push({ name_len: (nm2+"r").length, report_gas: Number(r1.gasUsed), verify_gas: Number(r2.gasUsed), report_ms: t1-t0, verify_ms: t2-t1 }); }
  out.exp4_gas = gas;
  const txl: number[] = []; for (let i=0;i<20;i++){ const t=performance.now(); await reportPackage(`zz-latency-probe-${Date.now()}-${i}`); txl.push(performance.now()-t); }
  out.exp4_report_latency_ms = stats(txl);
  fs.writeFileSync(`${D}/results.json`, JSON.stringify(out,null,2));
  console.log("DONE");
})().catch(e=>{console.error(e);process.exit(1)});
