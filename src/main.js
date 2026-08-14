import {GameLoop} from "./core/GameLoop.js";
import {Input} from "./core/Input.js";
import {AudioBus} from "./core/AudioBus.js";
import {ReplayRecorder} from "./core/Replay.js";
import {PixelRenderer} from "./render/PixelRenderer.js";
import {World} from "./game/World.js";
import {AnalyticsAdapter} from "./core/AnalyticsAdapter.js";

const $=s=>document.querySelector(s),canvas=$("#game"),renderer=new PixelRenderer(canvas),input=new Input(),audio=new AudioBus();
const analytics=new AnalyticsAdapter({gameId:"ARABIA_STRIKE"}),replay=new ReplayRecorder();
let world=null,loop=null,coop=false;

function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),900)}
function begin(){
  audio.unlock();$("#menu").classList.add("hidden");$("#hud").classList.remove("hidden");
  world=new World({input,audio,renderer,analytics,replay,coop});
  analytics.track("game_start",{coop});
  loop=new GameLoop({hz:59.18,update:dt=>{if(!world?.active)return;world.update(dt);loop.timeScale=world.timeScale||1},render:()=>{world?.render();hud()}});
  loop.start();toast("MISSION 001 // RED COAST")
}
function hud(){
  if(!world)return;$("#score").textContent=String(Math.floor(world.score)).padStart(6,"0");$("#progress").style.transform=`scaleX(${world.progress})`;
  const p=world.players[0];$("#lives").textContent="●".repeat(Math.max(0,p.hp))+"○".repeat(Math.max(0,3-p.hp));$("#weapon").textContent=p.weapon;$("#ammo").textContent=p.grenades+"G";
  if(world.boss&&!world.boss.dead){$("#boss").classList.remove("hidden");$("#bossbar").style.transform=`scaleX(${Math.max(0,world.boss.hp/world.boss.max)})`}else $("#boss").classList.add("hidden");
}
$("#play").onclick=()=>{coop=false;begin()};$("#coop").onclick=()=>{coop=true;begin()};$("#settings").onclick=()=>{const crt=$("#crt");crt.style.display=crt.style.display==="none"?"block":"none"};
analytics.track("game_visit");
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
