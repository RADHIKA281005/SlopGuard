import fs from "fs";
import { performance } from "perf_hooks";
import { analyzePackage } from "../src/analyzer";
import { checkNpmPackage } from "../src/registry";
import { getPackage } from "../src/contract";
const D = process.env.EVAL_DIR!;
const read = (f: string) => fs.readFileSync(`${D}/${f}`, "utf8").split("\n").map(s=>s.trim()).filter(Boolean);
const SUF = ["utils","helper","helpers","lite","pro","plus","ai","kit","wrapper","manager","toolkit"];
const heur = (n: string) => { const t = n.replace(/^@[^/]+\//,"").split("-"); return t.length >= 3 || SUF.includes(t[t.length-1]); };
(async () => {
  const hr = read("hard_real.txt"), hh0 = read("hard_hall.txt"); const hh: string[] = []; const registered: string[] = [];
  for (const n of hh0) ((await checkNpmPackage(n)).exists ? registered : hh).push(n);
  const set = [...hr.map(n=>({n,y:0})), ...hh.map(n=>({n,y:1}))];
  const res: any = {};
  for (const [k,f] of Object.entries({ B1_npm_existence: async (n:string)=>!(await checkNpmPackage(n)).exists, B2_name_heuristic: async (n:string)=>heur(n), SlopGuard_empty_chain: async (n:string)=>(await analyzePackage(n)).verdict!=="SAFE" })) {
    let tp=0,fp=0,tn=0,fn=0; const fps:string[]=[], fns:string[]=[];
    for (const {n,y} of set) { const p = await (f as any)(n); if (y&&p) tp++; else if(!y&&p){fp++;fps.push(n);} else if(!y&&!p) tn++; else {fn++;fns.push(n);} }
    const pr=tp+fp?tp/(tp+fp):0, rc=tp+fn?tp/(tp+fn):0; res[k]={tp,fp,tn,fn,accuracy:(tp+tn)/set.length,precision:pr,recall:rc,f1:pr+rc?2*pr*rc/(pr+rc):0,fps,fns};
  }
  // interleaved, randomized latency: cold npm lookup + chain read for same name
  const names = [...read("real.txt")].sort(()=>Math.random()-.5).slice(0,60); const npm:number[]=[], chain:number[]=[], full:number[]=[];
  for (const n of names) { let t=performance.now(); await getPackage(n); chain.push(performance.now()-t); t=performance.now(); await analyzePackage(n); full.push(performance.now()-t); }
  const st=(a:number[])=>{const s=[...a].sort((x,y)=>x-y);return {n:a.length,mean:a.reduce((x,y)=>x+y)/a.length,median:s[Math.floor(s.length/2)],p95:s[Math.floor(.95*s.length)]}};
  fs.writeFileSync(`${D}/hard.json`, JSON.stringify({n_benign:hr.length,n_hallucinated:hh.length,registered,res,lat:{chain:st(chain),full:st(full)}},null,2)); console.log("ok");
})();
