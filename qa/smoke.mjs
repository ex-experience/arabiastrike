import fs from "node:fs";
const must=["index.html","style.css","src/main.js","src/game/World.js","src/core/GameLoop.js","game-id.json"];
for(const f of must)if(!fs.existsSync(new URL(`../${f}`,import.meta.url)))throw new Error(`Missing ${f}`);
const id=JSON.parse(fs.readFileSync(new URL("../game-id.json",import.meta.url),"utf8"));
if(id.gameId!=="ARABIA_STRIKE")throw new Error("Wrong GAME_ID");
console.log("ARABIA STRIKE smoke: OK");
