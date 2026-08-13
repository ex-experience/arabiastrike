(()=>{
"use strict";
const cv=document.getElementById('game'),ctx=cv.getContext('2d',{alpha:false});
ctx.imageSmoothingEnabled=false;
const W=1280,H=720,GROUND=590;
let mode2=false, running=false, paused=false, won=false, gameOver=false;
let cameraX=0, score=0, waveStarted=false, bossActive=false, secretOpen=false, rescued=false;
let t=0,last=performance.now();
const keys={}, touch={left:false,right:false,jump:false,shoot:false,grenade:false,interact:false};
const $=id=>document.getElementById(id);
const hud=$('hud'), bossHud=$('bossHud'), toastEl=$('toast'), mobile=$('mobile');

function toast(s,ms=900){toastEl.textContent=s;toastEl.classList.add('show');clearTimeout(toastEl._t);toastEl._t=setTimeout(()=>toastEl.classList.remove('show'),ms)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function rand(a,b){return a+Math.random()*(b-a)}
function aabb(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}

const audio={ctx:null};
function beep(freq=220,dur=.06,type='square',gain=.025){
  try{
    if(!audio.ctx) audio.ctx=new (AudioContext||webkitAudioContext)();
    const ac=audio.ctx,o=ac.createOscillator(),g=ac.createGain();
    o.type=type;o.frequency.value=freq;g.gain.value=gain;o.connect(g);g.connect(ac.destination);
    o.start();g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.stop(ac.currentTime+dur);
  }catch{}
}
function boom(big=false){beep(big?65:90,big?.28:.16,'sawtooth',big?.07:.04)}

const colors={sky:'#70b9c6',sky2:'#d7c68f',sand:'#c79652',sand2:'#8b5d32',rock:'#4e463e',cyan:'#63eadc',ink:'#111718',red:'#c9362b',cream:'#eadfc8'};
let players=[],enemies=[],bullets=[],grenades=[],particles=[],pickups=[],crates=[],decor=[],boss=null,vehicle=null;

class Player{
  constructor(x,idx=0){Object.assign(this,{x,y:GROUND-76,w:34,h:76,vx:0,vy:0,dir:1,on:false,hp:100,inv:0,idx,weapon:'PULSE MG',ammo:Infinity,gren:5,shootCd:0,grenCd:0,inVehicle:false,dates:0,over:0,alive:true});}
  ctrl(){
    if(this.idx===0)return {L:keys.KeyA||touch.left,R:keys.KeyD||touch.right,J:keys.KeyW||keys.Space||touch.jump,S:keys.KeyJ||keys.KeyF||touch.shoot,G:keys.KeyK||touch.grenade,E:keys.KeyE||touch.interact};
    return {L:keys.ArrowLeft,R:keys.ArrowRight,J:keys.ArrowUp,S:keys.Numpad1||keys.Slash,G:keys.Numpad2||keys.Period,E:keys.Enter};
  }
  update(dt){
    if(!this.alive)return;
    const c=this.ctrl(), sp=this.over>0?280:220;
    if(this.inVehicle){this.updateVehicle(dt,c);return}
    this.vx=((c.R?1:0)-(c.L?1:0))*sp;if(this.vx)this.dir=Math.sign(this.vx);
    if(c.J&&this.on){this.vy=-470;this.on=false;beep(330,.04,'square',.02)}
    this.vy+=1150*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;
    if(this.y+this.h>=GROUND){this.y=GROUND-this.h;this.vy=0;this.on=true}
    if(this.x<0)this.x=0;
    if(this.inv>0)this.inv-=dt;if(this.shootCd>0)this.shootCd-=dt;if(this.grenCd>0)this.grenCd-=dt;if(this.over>0)this.over-=dt;
    if(c.S&&this.shootCd<=0)this.shoot();
    if(c.G&&this.grenCd<=0&&this.gren>0)this.throwGrenade();
    if(c.E&&vehicle&&!vehicle.used&&Math.abs(this.x-vehicle.x)<95){this.inVehicle=true;vehicle.used=true;toast('EX‑HMV ONLINE',900);beep(120,.12,'sawtooth',.04)}
  }
  shoot(){
    const w=this.weapon;
    if(this.ammo!==Infinity&&this.ammo<=0){beep(90,.03);this.shootCd=.18;return}
    if(this.ammo!==Infinity)this.ammo--;
    let speed=640,dmg=18,spread=0,sz=7,rate=.13,count=1;
    if(w==='SCATTER'){rate=.42;count=5;spread=.20;dmg=15;sz=5}
    if(w==='ARC ROCKET'){rate=.58;speed=470;dmg=70;sz=11}
    if(w==='PRISM LASER'){rate=.08;speed=920;dmg=25;sz=4}
    for(let i=0;i<count;i++){let a=(Math.random()-.5)*spread;bullets.push({x:this.x+this.w/2+this.dir*20,y:this.y+29,vx:Math.cos(a)*speed*this.dir,vy:Math.sin(a)*speed,life:1.6,dmg,owner:'p',sz,w})}
    this.shootCd=rate;beep(w==='ARC ROCKET'?120:w==='PRISM LASER'?520:260,.035,w==='PRISM LASER'?'sine':'square',.018)
  }
  throwGrenade(){grenades.push({x:this.x+18,y:this.y+25,vx:260*this.dir,vy:-350,t:1.1});this.gren--;this.grenCd=.45;toast('ARC BOMB',450);beep(180,.04)}
  hurt(n){if(this.inv>0||this.inVehicle)return;this.hp=Math.max(0,this.hp-n);this.inv=.65;shake=8;beep(70,.08,'sawtooth',.04);if(this.hp<=0){this.alive=false;setTimeout(()=>checkDeath(),500)}}
  updateVehicle(dt,c){
    vehicle.vx=((c.R?1:0)-(c.L?1:0))*300;if(vehicle.vx)this.dir=Math.sign(vehicle.vx);vehicle.x+=vehicle.vx*dt;this.x=vehicle.x+34;this.y=GROUND-94;
    if(this.shootCd>0)this.shootCd-=dt;if(c.S&&this.shootCd<=0){bullets.push({x:vehicle.x+(this.dir>0?112:-12),y:GROUND-80,vx:720*this.dir,vy:0,life:1.4,dmg:55,owner:'p',sz:12,w:'HMV'});this.shootCd=.22;beep(105,.045,'square',.035)}
    if(c.E){this.inVehicle=false;vehicle.used=false;this.x=vehicle.x+130*this.dir;touch.interact=false}
  }
  draw(){
    if(!this.alive)return;if(this.inv>0&&Math.floor(this.inv*14)%2)return;
    if(this.inVehicle)return;
    const x=Math.round(this.x-cameraX),y=Math.round(this.y);
    ctx.save();ctx.translate(x+this.w/2,y);ctx.scale(this.dir,1);
    // legs / trousers
    px(-12,47,11,27,'#e9dfc8');px(2,47,11,27,'#e9dfc8');px(-15,70,15,5,'#5b4b3e');px(1,70,15,5,'#5b4b3e');
    // torso: white tank + cream vest
    px(-13,22,27,31,'#f2efe7');px(-17,19,8,34,'#e8dbc1');px(10,19,8,34,'#e8dbc1');
    // arms
    px(-22,24,7,28,'#a96945');px(16,24,7,28,'#a96945');
    // head/skin
    px(-11,0,22,22,'#a96945');px(-12,-7,24,10,'#151616');px(-10,-12,20,6,'#111');
    // beard
    px(-9,14,18,8,'#1a1512');
    // glasses
    px(-10,7,8,4,'#080b0c');px(2,7,8,4,'#080b0c');px(-2,8,4,2,'#333');
    // weapon
    ctx.fillStyle='#161c1d';ctx.fillRect(15,28,31,7);ctx.fillStyle=colors.cyan;ctx.fillRect(24,30,10,2);
    if(this.over>0){ctx.strokeStyle=colors.cyan;ctx.strokeRect(-20,-15,42,92)}
    ctx.restore();
  }
}
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}

class Enemy{
  constructor(x,type='grunt'){this.x=x;this.y=GROUND-62;this.w=32;this.h=62;this.type=type;this.hp=type==='shield'?85:type==='jet'?50:45;this.cd=rand(.3,1.2);this.dir=-1;this.dead=false;this.vy=0}
  update(dt){
    if(this.dead)return;let p=closestPlayer(this.x);if(!p)return;
    let dx=p.x-this.x;this.dir=Math.sign(dx)||-1;this.cd-=dt;
    if(this.type==='jet'){this.y=GROUND-160+Math.sin(t*3+this.x*.01)*35;if(Math.abs(dx)<620&&this.cd<0){enemyShot(this,430,9);this.cd=1.1}}
    else{
      if(Math.abs(dx)>210)this.x+=this.dir*(this.type==='shield'?45:68)*dt;
      if(Math.abs(dx)<520&&this.cd<0){enemyShot(this,this.type==='shield'?320:380,this.type==='shield'?10:8);this.cd=rand(.85,1.4)}
    }
  }
  hurt(n){this.hp-=n;if(this.hp<=0){this.dead=true;score+=120;burst(this.x+16,this.y+25,12,'#d58a46');if(Math.random()<.18)dropPickup(this.x,this.y)}}
  draw(){
    if(this.dead)return;let x=Math.round(this.x-cameraX),y=Math.round(this.y);ctx.save();ctx.translate(x+16,y);ctx.scale(this.dir,1);
    if(this.type==='jet'){px(-12,0,24,18,'#5b6260');px(-16,16,32,10,'#343b3a');px(-5,26,10,13,'#d47b37');ctx.restore();return}
    px(-9,0,18,18,'#9b6a4d');px(-10,-6,20,8,'#242a27');px(-12,18,24,25,this.type==='shield'?'#485649':'#635943');px(-10,43,8,19,'#34322d');px(2,43,8,19,'#34322d');
    px(10,25,25,6,'#161d1e');if(this.type==='shield'){px(-22,19,10,34,'#303a38');ctx.strokeStyle='#9cb0a8';ctx.strokeRect(-22,19,10,34)}
    ctx.restore();
  }
}
function enemyShot(e,speed=380,dmg=8){let p=closestPlayer(e.x);if(!p)return;let dx=p.x-e.x,dy=(p.y+25)-(e.y+25),m=Math.hypot(dx,dy)||1;bullets.push({x:e.x+16,y:e.y+25,vx:dx/m*speed,vy:dy/m*speed,life:2.3,dmg,owner:'e',sz:6,w:'enemy'});beep(145,.025,'square',.01)}

function closestPlayer(x){return players.filter(p=>p.alive).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0]}

function dropPickup(x,y){
  const r=Math.random();let type=r<.28?'dates':r<.55?'SCATTER':r<.78?'ARC ROCKET':'PRISM LASER';
  pickups.push({x,y:y-25,w:22,h:22,type,bob:Math.random()*6.28})
}
function makeLevel(){
  enemies=[];bullets=[];grenades=[];particles=[];pickups=[];crates=[];decor=[];boss=null;vehicle={x:3260,y:GROUND-74,w:122,h:74,hp:260,used:false,destroyed:false,vx:0};
  [820,1120,1480,2060,2460,2750,3720,3980,4290,4630,4950,5280].forEach((x,i)=>enemies.push(new Enemy(x,i%5===2?'shield':i%6===3?'jet':'grunt')));
  crates.push({x:980,y:GROUND-36,w:36,h:36,hp:25},{x:1720,y:GROUND-36,w:36,h:36,hp:25},{x:3530,y:GROUND-36,w:36,h:36,hp:25});
  // cage = destructible rescue point
  crates.push({x:1870,y:GROUND-72,w:56,h:72,hp:45,cage:true});
  // secret wall
  crates.push({x:2380,y:GROUND-130,w:46,h:130,hp:160,secret:true});
  for(let x=0;x<7600;x+=160) if(Math.random()<.7) decor.push({x:x+rand(0,120),type:Math.random()<.5?'palm':'rock',s:rand(.7,1.25)});
  waveStarted=false;bossActive=false;secretOpen=false;rescued=false;score=0;cameraX=0;
}

function burst(x,y,n=8,c='#f2a348'){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-180,180),vy:rand(-260,60),life:rand(.35,.85),c,sz:rand(2,7)})}
function explosion(x,y,big=false){
  burst(x,y,big?32:16,big?'#ff9b34':'#f7c26b');boom(big);shake=big?15:8;
  enemies.forEach(e=>{if(!e.dead&&Math.hypot(e.x-x,e.y-y)<(big?135:85))e.hurt(big?100:65)});
  if(boss&&Math.hypot(boss.x-x,boss.y-y)<180)boss.hp-=big?110:70;
}

function bossSpawn(){
  bossActive=true;boss={x:6450,y:GROUND-250,w:390,h:250,hp:1400,max:1400,cd:.4,phase:0};bossHud.classList.remove('hidden');toast('DUNE HARVESTER',1200);boom(true)
}
function updateBoss(dt){
  if(!boss||boss.hp<=0)return;
  boss.cd-=dt;let p=closestPlayer(boss.x);if(!p)return;
  boss.phase=t>0?Math.floor(t/5)%3:0;
  if(boss.cd<=0){
    if(boss.phase===0){for(let i=-2;i<=2;i++)bullets.push({x:boss.x+40,y:boss.y+80,vx:-360,vy:i*80,life:3,dmg:10,owner:'e',sz:9,w:'boss'})}
    if(boss.phase===1){for(let i=0;i<4;i++)grenades.push({x:boss.x+60,y:boss.y+30,vx:rand(-320,-160),vy:rand(-430,-250),t:rand(.8,1.35),enemy:true})}
    if(boss.phase===2){enemies.push(new Enemy(boss.x-250,'jet'));enemies.push(new Enemy(boss.x-120,'grunt'))}
    boss.cd=boss.phase===0?.85:1.45;
  }
  if(boss.hp<=0){boss.hp=0;bossHud.classList.add('hidden');explosion(boss.x+180,boss.y+120,true);setTimeout(()=>finish(),1800)}
}
function drawBoss(){
  if(!boss||boss.hp<=0)return;let x=Math.round(boss.x-cameraX),y=Math.round(boss.y);
  // enormous original crawler
  px(x+30,y+60,300,160,'#424b48');px(x+10,y+92,350,94,'#2b3231');px(x+68,y+20,170,70,'#58635f');
  px(x+70,y+40,38,22,'#111819');px(x+125,y+40,38,22,'#111819');px(x+180,y+40,38,22,'#111819');
  for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(x+55+i*55,y+210,25,0,Math.PI*2);ctx.fillStyle='#151918';ctx.fill();ctx.strokeStyle='#7f8b84';ctx.stroke()}
  px(x-60,y+110,110,22,'#2f3735');px(x-95,y+116,48,10,colors.red);
  ctx.fillStyle=colors.cyan;ctx.fillRect(x+285,y+85,32,9);
}
function drawVehicle(){
  if(!vehicle||vehicle.destroyed)return;let x=Math.round(vehicle.x-cameraX),y=Math.round(GROUND-74);
  px(x,y+20,116,42,'#1d2524');px(x+20,y,68,30,'#283230');px(x+12,y+8,22,13,'#4b6565');px(x+45,y+8,22,13,'#4b6565');px(x+94,y+26,28,20,'#202725');
  for(let xx of [18,92]){ctx.beginPath();ctx.arc(x+xx,y+62,17,0,Math.PI*2);ctx.fillStyle='#0c1010';ctx.fill();ctx.strokeStyle='#68726e';ctx.stroke()}
  px(x+82,y+15,34,6,'#151b1b');px(x+95,y+16,15,2,colors.cyan);
}
function drawBackground(){
  let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,colors.sky);g.addColorStop(.58,colors.sky2);g.addColorStop(1,'#b8793f');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // sun
  ctx.fillStyle='#ffe3a1';ctx.beginPath();ctx.arc(180-cameraX*.03,135,54,0,Math.PI*2);ctx.fill();
  // hijaz mountains parallax
  ctx.fillStyle='#6d6958';ctx.beginPath();ctx.moveTo(0,390);
  for(let x=0;x<=W+80;x+=80){let wx=x+cameraX*.16;ctx.lineTo(x,330-Math.abs(Math.sin(wx*.003))*100-Math.abs(Math.sin(wx*.009))*30)}
  ctx.lineTo(W,520);ctx.lineTo(0,520);ctx.fill();
  // old city silhouettes
  for(let i=0;i<18;i++){let wx=(i*190-cameraX*.35)%3600;if(wx<-250)wx+=3600;let hh=randSeed(i)*130+70;ctx.fillStyle=i%3?'#82633f':'#6c5237';ctx.fillRect(wx,420-hh,100,hh);ctx.fillStyle='#bb9a61';for(let yy=435-hh;yy<400;yy+=22)for(let xx=wx+12;xx<wx+90;xx+=25)ctx.fillRect(xx,yy,7,11)}
  // sea band
  ctx.fillStyle='#2b9cac';ctx.fillRect(0,485,W,85);ctx.fillStyle='#57cad0';for(let x=0;x<W;x+=55)ctx.fillRect((x-cameraX*.6)%W,500+(x%3)*12,28,2);
  // ground
  ctx.fillStyle='#987046';ctx.fillRect(0,GROUND,W,H-GROUND);ctx.fillStyle='#5c4934';ctx.fillRect(0,GROUND,W,16);
}
function randSeed(i){return (Math.sin(i*9283.33)*43758.5453%1+1)%1}
function drawDecor(){
  decor.forEach(d=>{let x=d.x-cameraX;if(x<-100||x>W+100)return;let y=GROUND;
    if(d.type==='rock'){px(x,y-22*d.s,38*d.s,22*d.s,'#5f594e');px(x+8*d.s,y-29*d.s,20*d.s,10*d.s,'#7a7160')}
    else {ctx.strokeStyle='#6f4d2e';ctx.lineWidth=6*d.s;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+5*d.s,y-72*d.s);ctx.stroke();ctx.fillStyle='#507047';for(let a=0;a<7;a++){ctx.save();ctx.translate(x+5*d.s,y-73*d.s);ctx.rotate(a*.85);ctx.fillRect(0,0,38*d.s,7*d.s);ctx.restore()}}
  })
}
function drawCrates(){
  crates.forEach(c=>{if(c.hp<=0)return;let x=c.x-cameraX;
    if(c.cage){ctx.strokeStyle='#b7b1a0';ctx.lineWidth=3;ctx.strokeRect(x,c.y,c.w,c.h);for(let q=8;q<c.w;q+=12){ctx.beginPath();ctx.moveTo(x+q,c.y);ctx.lineTo(x+q,c.y+c.h);ctx.stroke()};return}
    px(x,c.y,c.w,c.h,c.secret?'#5b5141':'#6b4b2d');ctx.strokeStyle='#ad895b';ctx.strokeRect(x,c.y,c.w,c.h);ctx.beginPath();ctx.moveTo(x,c.y);ctx.lineTo(x+c.w,c.y+c.h);ctx.moveTo(x+c.w,c.y);ctx.lineTo(x,c.y+c.h);ctx.stroke()
  })
}
function drawPickups(){pickups.forEach(p=>{let x=p.x-cameraX,y=p.y+Math.sin(t*5+p.bob)*5;ctx.fillStyle=p.type==='dates'?'#d39a45':colors.cyan;ctx.fillRect(x,y,22,22);ctx.fillStyle='#071012';ctx.font='10px monospace';ctx.fillText(p.type==='dates'?'D':p.type[0],x+7,y+15)})}
function drawBullets(){bullets.forEach(b=>{ctx.fillStyle=b.owner==='p'?(b.w==='PRISM LASER'?colors.cyan:'#ffe4a2'):'#f05f4e';ctx.fillRect(b.x-cameraX,b.y,b.sz,b.sz)})}
function drawParticles(){particles.forEach(p=>{ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle=p.c;ctx.fillRect(p.x-cameraX,p.y,p.sz,p.sz)});ctx.globalAlpha=1}
function drawPrisoner(){
  if(rescued)return;let c=crates.find(x=>x.cage);if(!c||c.hp<=0)return;let x=c.x-cameraX+18,y=c.y+20;px(x,y,18,20,'#b87955');px(x-3,y-10,24,14,'#e6e1d0');px(x,y+20,18,28,'#ddd5bf')
}

function updateProjectiles(dt){
  bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
    if(b.owner==='p'){
      enemies.forEach(e=>{if(!e.dead&&aabb({x:b.x,y:b.y,w:b.sz,h:b.sz},e)){e.hurt(b.dmg);b.life=0}})
      crates.forEach(c=>{if(c.hp>0&&aabb({x:b.x,y:b.y,w:b.sz,h:b.sz},c)){c.hp-=b.dmg;b.life=0;burst(b.x,b.y,4,'#d1a36c');if(c.hp<=0){if(c.cage){rescued=true;score+=500;toast('RESCUED // +500',900);dropPickup(c.x,c.y)}if(c.secret){secretOpen=true;toast('SECRET ROUTE OPEN',1100);pickups.push({x:c.x+90,y:GROUND-80,w:22,h:22,type:'PRISM LASER',bob:0})}else dropPickup(c.x,c.y)}}})
      if(boss&&boss.hp>0&&aabb({x:b.x,y:b.y,w:b.sz,h:b.sz},boss)){boss.hp-=b.dmg;b.life=0;shake=3}
    }else players.forEach(p=>{if(p.alive&&!p.inVehicle&&aabb({x:b.x,y:b.y,w:b.sz,h:b.sz},p)){p.hurt(b.dmg);b.life=0}})
  });bullets=bullets.filter(b=>b.life>0&&b.x>cameraX-200&&b.x<cameraX+W+300&&b.y>-100&&b.y<H+100);
  grenades.forEach(g=>{g.vy+=900*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;if(g.y>GROUND-8){g.y=GROUND-8;g.vy*=-.35;g.vx*=.7}g.t-=dt;if(g.t<=0){if(g.enemy){players.forEach(p=>{if(p.alive&&Math.hypot(p.x-g.x,p.y-g.y)<105)p.hurt(24)});burst(g.x,g.y,18,'#f2763e');boom()}else explosion(g.x,g.y,true)}});grenades=grenades.filter(g=>g.t>0);
  particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=600*dt;p.life-=dt});particles=particles.filter(p=>p.life>0);
}
function updatePickups(){
  pickups.forEach(p=>players.forEach(pl=>{if(pl.alive&&aabb(pl,p)){if(p.type==='dates'){pl.dates++;pl.hp=Math.min(100,pl.hp+20);if(pl.dates>=3){pl.over=10;pl.dates=0;toast('DATE OVERDRIVE // 10s',1000)}}else{pl.weapon=p.type;pl.ammo=p.type==='SCATTER'?48:p.type==='ARC ROCKET'?18:110;toast(p.type,900);beep(500,.08,'square',.03)}p.dead=true}}));pickups=pickups.filter(p=>!p.dead)
}
function updateWorld(dt){
  players.forEach(p=>p.update(dt));enemies.forEach(e=>e.update(dt));enemies=enemies.filter(e=>!e.dead||Math.abs(e.x-cameraX)<W+200);
  updateProjectiles(dt);updatePickups();updateBoss(dt);
  let lead=players.filter(p=>p.alive).reduce((m,p)=>Math.max(m,p.x),0);
  cameraX=clamp(lead-320,0,6650);
  if(!waveStarted&&lead>5250){waveStarted=true;toast('BLACK NODE // LAST LINE',1000);for(let i=0;i<8;i++)enemies.push(new Enemy(5480+i*95,i%3===0?'shield':'grunt'))}
  if(!bossActive&&lead>6050)bossSpawn();
  if(vehicle&&vehicle.used&&vehicle.hp<=0&&!vehicle.destroyed){vehicle.destroyed=true;players.forEach(p=>{if(p.inVehicle){p.inVehicle=false;p.hurt(35)}});explosion(vehicle.x+55,GROUND-40,true)}
}
let shake=0;
function render(){
  ctx.save();let sx=shake?rand(-shake,shake):0,sy=shake?rand(-shake,shake):0;if(shake)shake*=.82;if(shake<.2)shake=0;ctx.translate(sx,sy);
  drawBackground();drawDecor();
  // hidden tunnel hint
  if(secretOpen){ctx.fillStyle='#1c2625';ctx.fillRect(2380-cameraX,GROUND-108,420,108);ctx.fillStyle=colors.cyan;ctx.fillRect(2460-cameraX,GROUND-55,70,3)}
  drawCrates();drawPrisoner();drawVehicle();drawPickups();enemies.forEach(e=>e.draw());drawBoss();players.forEach(p=>p.draw());drawBullets();drawParticles();
  ctx.restore();
}
function hudUpdate(){
  let p=players[0];if(!p)return;
  $('hpBar').style.transform=`scaleX(${clamp(p.hp/100,0,1)})`;
  $('score').textContent=String(score).padStart(6,'0');
  $('weapon').textContent=p.inVehicle?'EX‑HMV CANNON':p.weapon;
  $('ammo').textContent=p.inVehicle?'∞':p.ammo===Infinity?'∞':p.ammo;
  $('grenades').textContent=`G × ${p.gren}`;
  if(boss)$('bossBar').style.transform=`scaleX(${clamp(boss.hp/boss.max,0,1)})`;
}
function checkDeath(){if(players.every(p=>!p.alive)){running=false;$('gameover').classList.remove('hidden');hud.classList.add('hidden');mobile.classList.add('hidden')}}
function finish(){won=true;running=false;$('win').classList.remove('hidden');hud.classList.add('hidden');mobile.classList.add('hidden')}
function startGame(){
  makeLevel();players=[new Player(180,0)];if(mode2)players.push(new Player(120,1));
  running=true;gameOver=false;won=false;$('story').classList.add('hidden');$('gameover').classList.add('hidden');$('win').classList.add('hidden');hud.classList.remove('hidden');
  if(matchMedia('(pointer:coarse)').matches)mobile.classList.remove('hidden');
  toast('MISSION 001 // RED COAST',1000)
}
function loop(now){
  let dt=Math.min(.033,(now-last)/1000);last=now;t+=dt;
  if(running&&!paused){updateWorld(dt);hudUpdate()}
  render();requestAnimationFrame(loop)
}
requestAnimationFrame(loop);

addEventListener('keydown',e=>{keys[e.code]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault()});
addEventListener('keyup',e=>keys[e.code]=false);
document.querySelectorAll('#mobile button').forEach(b=>{
  const k=b.dataset.k;
  const on=e=>{e.preventDefault();touch[k]=true;if(k==='jump'||k==='grenade'||k==='interact')setTimeout(()=>touch[k]=false,80)};
  const off=e=>{e.preventDefault();touch[k]=false};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off)
});
$('play1').onclick=()=>{mode2=false;$('menu').classList.add('hidden');$('story').classList.remove('hidden');beep(440,.05)};
$('play2').onclick=()=>{mode2=true;$('menu').classList.add('hidden');$('story').classList.remove('hidden');beep(520,.05)};
$('deploy').onclick=startGame;$('retry').onclick=startGame;$('again').onclick=startGame;

addEventListener('load',()=>{if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{})});

// Pixel-art splash scene under the menu
function splash(){
  drawBackground();
  cameraX=360;drawBackground();cameraX=0;
  // giant title-machine silhouette
  ctx.fillStyle='#25302e';ctx.fillRect(850,250,300,210);ctx.fillStyle='#101616';ctx.fillRect(880,285,220,145);
  for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(900+i*50,470,28,0,6.3);ctx.fillStyle='#101414';ctx.fill()}
  // hero on ridge
  const p=new Player(620);p.y=GROUND-90;p.draw();
}
splash();
})();