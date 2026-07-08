import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error("Unbalanced braces");
}

function parseObjectLiteral(source) {
  return new Function(`return ${source}`)();
}

const bundle = await fetch("https://fir-33991959-5a411.web.app/bundle.js");
const componentStart = bundle.indexOf("I_=()=>{const{id:e}=de(),t=ue(),[n,r]=(0,l.useState)({}");
const rolesStart = bundle.indexOf("i={Initiator:", componentStart);
const rolesEnd = bundle.indexOf("},s={", rolesStart);
const domainsStart = bundle.indexOf('s={"COMMUNICATION-INFRASTRUCTURE-TRANSPORTATION":', rolesEnd);
const domainsOpen = domainsStart + "s=".length;
const domainsClose = findMatchingBrace(bundle, domainsOpen);
const functionsStart = bundle.indexOf("const S_={Selling:");
const functionsOpen = functionsStart + "const S_=".length;
const functionsClose = findMatchingBrace(bundle, functionsOpen);
const skillsMarker = bundle.indexOf('},k_={"Structuring Skills":', functionsStart);
const skillsOpen = skillsMarker + "},k_=".length;
const skillsClose = findMatchingBrace(bundle, skillsOpen);

const rolesObject = bundle.slice(rolesStart + "i=".length, rolesEnd + 1);
const domainsObject = bundle.slice(domainsOpen, domainsClose + 1);
const functionsObject = bundle.slice(functionsOpen, functionsClose + 1);
const skillsObject = bundle.slice(skillsOpen, skillsClose + 1);

const outDir = path.join(__dirname, "..", "lib", "constants", "job-form-data");
fs.mkdirSync(outDir, { recursive: true });

for (const [filename, source] of Object.entries({
  "roles.json": rolesObject,
  "domains.json": domainsObject,
  "functions.json": functionsObject,
  "structural-skills.json": skillsObject,
})) {
  fs.writeFileSync(path.join(outDir, filename), JSON.stringify(parseObjectLiteral(source), null, 2));
  console.log(`Wrote ${filename}`);
}
