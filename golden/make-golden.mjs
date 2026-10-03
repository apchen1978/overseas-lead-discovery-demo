// Records what the method returns for every shipped record. Run it to RECORD a deliberate
// behaviour change; golden.test.mjs compares the live code against the recorded file.
// The golden file is the proof that splitting method from scenario data changed no answer.
import { writeFileSync } from "node:fs";
import { snapshot } from "./snapshot.mjs";

writeFileSync(new URL("./before-after.json", import.meta.url), JSON.stringify(snapshot(), null, 2) + "\n");
console.log("golden written");
