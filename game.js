(()=>{"use strict";
const C=document.getElementById("game"),X=C.getContext("2d",{alpha:false});X.imageSmoothingEnabled=false;
const W=304,H=224,FPS=59.18,STEP=1/FPS,GROUND=184,WORLD=4600;
const $=id=>document.getElementById(id);
const K={},T={left:0,right:0,jump:0,shoot:0,grenade:0,interact:0};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
let running=0,paused=0,mode2=0,acc=0,last=performance.now()/1000,time=0,cam=0,score=0,shake=0,flash=0,slowFX=true,heat=0;
let P=[],E=[],B=[],G=[],FX=[],D=[],PU=[],CIV=[],boss=null,truck=null,rescues=0,kills=0,spawnClock=0,missionStart=0;
const pal={sky:"#55c9f2",sky2:"#ffe8a3",sand:"#d79c4b",stone:"#85725a",dark:"#253139",ink:"#111719",cream:"#efe4c9",skin:"#9d6648",cyan:"#4de9df",gold:"#ffd34a",red:"#f14b37",green:"#506b48",black:"#111618"};

function px(x,y,w,h,c){X.fillStyle=c;X.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function toast(s,ms=900){const q=$("toast");q.textContent=s;q.classList.add("show");clearTimeout(q._);q._=setTimeout(()=>q.classList.remove("show"),ms)}
const A={ctx:null,master:null,nextBeat:0,beat:0};
function audio(){try{if(!A.ctx){A.ctx=new(AudioContext||webkitAudioContext)();A.master=A.ctx.createGain();A.master.gain.value=.2;A.master.connect(A.ctx.destination)}if(A.ctx.state==="suspended")A.ctx.resume()}catch{}}
function tone(f=220,d=.04,type="square",g=.03,slide=0){try{audio();let o=A.ctx.createOscillator(),v=A.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,A.ctx.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),A.ctx.currentTime+d);v.gain.setValueAtTime(g,A.ctx.currentTime);v.gain.exponentialRampToValueAtTime(.0001,A.ctx.currentTime+d);o.connect(v);v.connect(A.master);o.start();o.stop(A.ctx.currentTime+d)}catch{}}
function noise(d=.07,g=.025){try{audio();let b=A.ctx.createBuffer(1,A.ctx.sampleRate*d,A.ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;let s=A.ctx.createBufferSource(),v=A.ctx.createGain();s.buffer=b;v.gain.setValueAtTime(g,A.ctx.currentTime);v.gain.exponentialRampToValueAtTime(.0001,A.ctx.currentTime+d);s.connect(v);v.connect(A.master);s.start()}catch{}}
function music(dt){if(!running||paused)return;A.nextBeat-=dt;if(A.nextBeat<=0){let seq=[55,55,73,55,82,73,49,55],f=seq[A.beat++%seq.length];tone(f,.13,"sawtooth",.012,-6);if(A.beat%4===0)noise(.035,.012);A.nextBeat=.215}}
function announce(s){try{if("speechSynthesis"in window){let u=new SpeechSynthesisUtterance(s);u.rate=1.2;u.pitch=.72;u.volume=.42;u.lang="en-US";speechSynthesis.cancel();speechSynthesis.speak(u)}}catch{}}
function boom(big=0){noise(big?.2:.1,big?.07:.04);tone(big?58:90,big?.18:.1,"sawtooth",big?.05:.03,-20)}

class Hero{
 constructor(x,i=0){Object.assign(this,{x,y:GROUND-29,w:12,h:29,vx:0,vy:0,dir:1,on:1,hp:3,ifr:0,i,weapon:"PULSE MG",ammo:999,gren:5,shot:0,bomb:0,inTruck:0,alive:1,anim:0,state:"idle",land:0})}
 ctrl(){return this.i?{L:K.ArrowLeft,R:K.ArrowRight,J:K.ArrowUp,S:K.Slash||K.Numpad1,G:K.Period||K.Numpad2,E:K.Enter}:{L:K.KeyA||T.left,R:K.KeyD||T.right,J:K.KeyW||K.Space||T.jump,S:K.KeyJ||K.KeyF||T.shoot,G:K.KeyK||T.grenade,E:K.KeyE||T.interact}}
 hurt(){if(this.ifr>0||this.inTruck)return;this.hp--;this.ifr=1.05;flash=.18;shake=5;tone(72,.09,"sawtooth",.04,-25);if(this.hp<=0){this.alive=0;setTimeout(checkDeath,450)}}
 shoot(){if(this.shot>0)return;let cfg={v:190,d:1,c:1,sp:0,cd:.11,name:"PULSE MG"};
  if(this.weapon==="SCATTER-12")cfg={v:165,d:1,c:6,sp:.34,cd:.42};
  if(this.weapon==="ARC CANNON")cfg={v:120,d:5,c:1,sp:0,cd:.58};
  if(this.weapon==="VOLT LASER")cfg={v:280,d:2,c:1,sp:0,cd:.065};
  if(this.weapon==="EMBER JET")cfg={v:120,d:2,c:4,sp:.18,cd:.16};
  for(let i=0;i<cfg.c;i++){let a=(i-(cfg.c-1)/2)*cfg.sp/Math.max(1,cfg.c-1);B.push({x:this.x+6+this.dir*7,y:this.y+11,vx:Math.cos(a)*cfg.v*this.dir,vy:Math.sin(a)*cfg.v,life:this.weapon==="EMBER JET"?.45:1.7,d:cfg.d,team:0,kind:this.weapon})}
  this.shot=cfg.cd;FX.push({type:"muzzle",x:this.x+6+this.dir*10,y:this.y+10,life:.06,dir:this.dir});FX.push({type:"shell",x:this.x+5,y:this.y+13,vx:-this.dir*rnd(18,30),vy:rnd(-44,-22),life:.55});tone(this.weapon==="VOLT LASER"?680:this.weapon==="ARC CANNON"?110:270,.025,"square",.018,this.weapon==="VOLT LASER"?180:0)
 }
 update(dt){if(!this.alive)return;let c=this.ctrl();
  if(this.inTruck){truck.vx=((c.R?1:0)-(c.L?1:0))*78;truck.x=clamp(truck.x+truck.vx*dt,0,WORLD-50);this.x=truck.x+10;this.y=GROUND-38;if(c.S&&this.shot<=0){B.push({x:truck.x+(this.dir>0?37:-2),y:GROUND-31,vx:245*this.dir,vy:0,life:1.6,d:4,team:0,kind:"HMV"});this.shot=.17;tone(95,.04,"square",.035)}if(c.E){this.inTruck=0;truck.used=0;T.interact=0}this.cool(dt);return}
  let mv=(c.R?1:0)-(c.L?1:0);this.vx=mv*62;if(mv)this.dir=Math.sign(mv);this.state=mv?"run":"idle";
  if(c.J&&this.on){this.vy=-132;this.on=0;this.state="jump";tone(350,.025)}this.vy+=350*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;
  if(this.y+this.h>=GROUND){if(!this.on&&this.vy>75){FX.push({type:"dust",x:this.x+6,y:GROUND,life:.35});this.land=.1;shake=Math.max(shake,1.5)}this.y=GROUND-this.h;this.vy=0;this.on=1}
  this.x=clamp(this.x,0,WORLD);if(c.S)this.shoot();
  if(c.G&&this.gren>0&&this.bomb<=0){G.push({x:this.x+6,y:this.y+7,vx:78*this.dir,vy:-108,t:.9,team:0});this.gren--;this.bomb=.34;tone(180,.03)}
  if(c.E&&truck&&!truck.used&&Math.abs(this.x-truck.x)<30){this.inTruck=1;truck.used=1;toast("EX‑HMV ONLINE");announce("Vehicle online");T.interact=0}
  this.anim+=dt*(mv?14:5);this.land=Math.max(0,this.land-dt);this.cool(dt)
 }
 cool(dt){this.ifr=Math.max(0,this.ifr-dt);this.shot=Math.max(0,this.shot-dt);this.bomb=Math.max(0,this.bomb-dt)}
 draw(){if(!this.alive||(this.ifr>0&&Math.floor(this.ifr*20)%2))return;if(this.inTruck)return;let x=this.x-cam,y=this.y,f=Math.floor(this.anim)%12,bob=this.state==="run"?Math.sin(f/12*Math.PI*2)*1.2:0,sx=this.land?1.15:1,sy=this.land?.86:1;X.save();X.translate(Math.round(x+6),Math.round(y+29));X.scale(this.dir*sx,sy);X.translate(0,-29+bob);
  px(-5,18,4,10,pal.cream);px(1,18,4,10,pal.cream);px(-6,8,12,13,"#eee9df");px(-8,9,3,13,pal.cream);px(5,9,3,13,pal.cream);px(-9,11,2,11,pal.skin);px(7,11,2,11,pal.skin);px(-4,0,8,8,pal.skin);px(-5,-4,10,5,"#151515");px(-4,5,8,3,"#1c1513");px(-4,2,3,2,"#080a0b");px(1,2,3,2,"#080a0b");px(5,13,11,3,"#171e20");px(9,14,5,1,pal.cyan);X.restore()
 }
}

class Enemy{
 constructor(x,type="grunt",elite=0){Object.assign(this,{x,y:GROUND-24,w:11,h:24,type,elite,hp:type==="shield"?4:2,state:Math.random()<.35?"idle":"patrol",timer:rnd(.4,1.6),dir:-1,dead:0,anim:rnd(0,10),seen:0,civilian:false})}
 hurt(n){this.hp-=n;this.state="panic";this.timer=.22;if(this.hp<=0){this.dead=1;kills++;score+=this.elite?220:110;burst(this.x+5,this.y+12,9,this.elite?pal.red:pal.gold);if(Math.random()<.28)drop(this.x,this.y)}}
 update(dt){if(this.dead)return;let p=nearest(this.x);if(!p)return;let dx=p.x-this.x,ad=Math.abs(dx);this.dir=Math.sign(dx)||-1;this.timer-=dt;this.anim+=dt*6;
  if(!this.seen&&ad<115){this.seen=1;this.state="surprise";this.timer=.32;tone(520,.025)}
  if(!this.seen){if(this.timer<0){this.state=Math.random()<.4?"cook":Math.random()<.5?"idle":"patrol";this.timer=rnd(.8,1.8);if(this.state==="patrol")this.dir=Math.random()<.5?-1:1}if(this.state==="patrol")this.x+=this.dir*9*dt;return}
  let incoming=G.some(g=>!g.team&&Math.abs(g.x-this.x)<31&&g.y<this.y+18);
  if(incoming&&this.state!=="duck"){this.state=Math.random()<.55?"duck":"dodge";this.timer=.45}
  if(this.state==="dodge"){this.x-=this.dir*32*dt}
  if(this.timer>0)return;
  if(ad<16){this.state="melee";this.timer=.48;if(hit({x:this.x+this.dir*8,y:this.y+5,w:12,h:14},p))p.hurt();return}
  if(ad>72){this.state="chase";this.x+=this.dir*(this.type==="shield"?13:20)*dt}else{this.state="shoot";enemyShot(this);this.timer=this.elite?.48:rnd(.75,1.18)}
 }
 draw(){if(this.dead)return;let x=this.x-cam,y=this.y,c=this.elite?"#9d3d33":this.type==="shield"?"#536d52":"#596443";X.save();X.translate(Math.round(x+5),Math.round(y+24));X.scale(this.dir,1);let duck=this.state==="duck"?5:0;px(-4,-20+duck,8,7,pal.skin);px(-5,-24+duck,10,5,"#3f4932");px(-5,-13+duck,10,10,c);px(-4,-3,3,3,"#343128");px(1,-3,3,3,"#343128");if(this.state==="surprise"){X.fillStyle=pal.gold;X.font="9px monospace";X.fillText("!",-2,-28)}if(this.state==="cook")px(6,-11,4,4,"#d17d2f");px(5,-12+duck,11,2,"#151b1e");X.restore()}
}

function nearest(x){return P.filter(p=>p.alive).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0]}
function enemyShot(e){let p=nearest(e.x);if(!p)return;let dx=p.x-e.x,dy=(p.y+10)-(e.y+10),m=Math.hypot(dx,dy)||1;B.push({x:e.x+5,y:e.y+11,vx:dx/m*112,vy:dy/m*112,life:2,d:1,team:1,kind:"enemy"});tone(145,.02,"square",.009)}
function burst(x,y,n,c){for(let i=0;i<n;i++)FX.push({type:"spark",x,y,vx:rnd(-60,60),vy:rnd(-85,20),life:rnd(.24,.62),c})}
function explode(x,y,big=0,enemy=0){burst(x,y,big?28:14,big?"#ff7137":"#ffd35a");boom(big);shake=big?7:4;flash=big?.12:.05;if(!enemy){E.forEach(e=>{if(!e.dead&&Math.hypot(e.x-x,e.y-y)<(big?38:25))e.hurt(big?4:2)});D.forEach(d=>{if(!d.bg&&d.hp>0&&Math.abs(d.x-x)<42){d.hp-=big?3:1;damageProp(d)}});if(boss&&Math.hypot(boss.x-x,boss.y-y)<75)boss.hp-=big?5:2}else P.forEach(p=>{if(p.alive&&Math.hypot(p.x-x,p.y-y)<30)p.hurt()})}
function damageProp(d){if(d.hp<=0&&d.stage!==3){d.stage=3;burst(d.x,d.y,14,pal.stone);score+=70;if(d.rescue){d.rescue=0;rescues++;score+=500;toast("CIVILIAN RESCUED +500");CIV.push({x:d.x+8,y:GROUND-20,t:3});drop(d.x+8,d.y)}}else if(d.hp===1)d.stage=2;else if(d.hp===2)d.stage=1}
function drop(x,y){let a=["SCATTER-12","ARC CANNON","VOLT LASER","EMBER JET","DATES"],type=a[Math.floor(Math.random()*a.length)];PU.push({x,y:y-10,w:8,h:8,type,t:rnd(0,6)})}
function spawnWave(x){for(let i=0;i<3+(x>2000?2:0);i++)E.push(new Enemy(x+i*45,i%4===2?"shield":"grunt",i%5===4))}
function build(){
 P=[new Hero(35,0)];if(mode2)P.push(new Hero(20,1));E=[];B=[];G=[];FX=[];D=[];PU=[];CIV=[];boss=null;rescues=0;kills=0;score=0;cam=0;time=0;heat=0;spawnClock=0;missionStart=performance.now();
 truck={x:1170,y:GROUND-25,w:40,h:25,hp:14,used:0,vx:0};
 [170,250,330,425,515,610,725,830,930,1030,1320,1450,1580,1710,1840,1970,2130,2280,2440,2620,2800,2980,3160].forEach((x,i)=>E.push(new Enemy(x,i%6===2?"shield":"grunt",i%5===4)));
 [220,535,820,1390,1890,2380,3020].forEach(x=>D.push({x,y:GROUND-17,w:19,h:17,hp:3,stage:0}));
 [690,1680,2730].forEach(x=>D.push({x,y:GROUND-29,w:21,h:29,hp:3,stage:0,rescue:1}));
 for(let x=0;x<WORLD;x+=58)if(Math.random()<.78)D.push({x:x+rnd(0,32),y:GROUND,type:Math.random()<.55?"rock":"palm",bg:1});
 toast("MISSION 001 // RED COAST",1100)
}
function update(dt){
 if(paused)return;let count=B.length+G.length+FX.length+E.length,scale=slowFX&&count>105?.72:count>78?.86:1;dt*=scale;time+=dt;music(dt);
 P.forEach(p=>p.update(dt));E.forEach(e=>e.update(dt));projectiles(dt);pickups();CIV.forEach(c=>c.t-=dt);CIV=CIV.filter(c=>c.t>0);
 let lead=Math.max(...P.filter(p=>p.alive).map(p=>p.x),0);cam=clamp(lead-92,0,WORLD-W);heat=clamp(heat+dt*.7,0,100);
 if(lead>3450&&!boss)spawnBoss();
 spawnClock-=dt;if(lead>900&&spawnClock<=0&&E.filter(e=>!e.dead&&Math.abs(e.x-lead)<320).length<4){spawnWave(lead+rnd(240,360));spawnClock=rnd(5,8)}
 if(boss)updateBoss(dt);
 if(truck&&truck.used)P.forEach(p=>{if(p.inTruck)p.dir=truck.vx?Math.sign(truck.vx):p.dir})
 let prog=clamp(lead/WORLD*100,0,100);$("progress").style.width=prog+"%";$("objective").textContent=boss?"DESTROY SAND COLOSSUS":lead<1100?"REACH EX‑HMV":lead<2600?"RESCUE & BREAK THE LINE":"PUSH TO THE FORTRESS";
}
function projectiles(dt){
 B.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
  if(!b.team){E.forEach(e=>{if(!e.dead&&hit({x:b.x,y:b.y,w:3,h:3},e)){e.hurt(b.d);b.life=0}});D.filter(d=>!d.bg&&d.hp>0).forEach(d=>{if(hit({x:b.x,y:b.y,w:3,h:3},d)){d.hp--;damageProp(d);b.life=0}});if(boss&&hit({x:b.x,y:b.y,w:4,h:4},boss)){boss.hp-=b.d;b.life=0}}
  else P.forEach(p=>{if(p.alive&&hit({x:b.x,y:b.y,w:3,h:3},{x:p.x+2,y:p.y+3,w:8,h:21})){p.hurt();b.life=0}})
 });B=B.filter(b=>b.life>0&&b.y>-20&&b.y<H+20);
 G.forEach(g=>{g.vy+=260*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;if(g.y>GROUND-3){g.y=GROUND-3;g.vy*=-.38;g.vx*=.72}g.t-=dt;if(g.t<=0)explode(g.x,g.y,1,g.team)});G=G.filter(g=>g.t>0);
 FX.forEach(f=>{if(f.vx!=null){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=190*dt}f.life-=dt});FX=FX.filter(f=>f.life>0)
}
function pickups(){PU.forEach(u=>P.forEach(p=>{if(p.alive&&hit(p,u)){if(u.type==="DATES"){p.hp=Math.min(3,p.hp+1);toast("DATE BOOST")}else{p.weapon=u.type;p.ammo=u.type==="ARC CANNON"?20:u.type==="SCATTER-12"?55:u.type==="EMBER JET"?80:140;toast(u.type);announce(u.type)}u.dead=1;tone(540,.06)}}));PU=PU.filter(u=>!u.dead)}
function spawnBoss(){boss={x:3890,y:GROUND-84,w:102,h:84,hp:85,max:85,cd:.45,phase:0};$("bossHud").classList.remove("hidden");toast("SAND COLOSSUS",1200);announce("Boss incoming");boom(1)}
function updateBoss(dt){if(boss.hp<=0){$("bossHud").classList.add("hidden");explode(boss.x+50,boss.y+40,1);boss=null;score+=5000;setTimeout(win,1000);return}boss.cd-=dt;boss.phase=Math.floor(time/4)%4;if(boss.cd<=0){if(boss.phase===0)for(let i=-3;i<=3;i++)B.push({x:boss.x,y:boss.y+28,vx:-110,vy:i*16,life:2.8,d:1,team:1,kind:"boss"});if(boss.phase===1)for(let i=0;i<4;i++)G.push({x:boss.x+25,y:boss.y+20,vx:rnd(-90,-55),vy:rnd(-120,-78),t:rnd(.7,1.2),team:1});if(boss.phase===2){E.push(new Enemy(boss.x-110,"grunt",1));E.push(new Enemy(boss.x-70,"shield",0))}if(boss.phase===3){B.push({x:boss.x,y:boss.y+48,vx:-175,vy:0,life:2.5,d:1,team:1,kind:"beam"});shake=3}boss.cd=boss.phase===0?.85:1.18}$("bossBar").style.transform=`scaleX(${clamp(boss.hp/boss.max,0,1)})`}
function bg(){
 let g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,pal.sky);g.addColorStop(.55,pal.sky2);g.addColorStop(1,"#e58c43");X.fillStyle=g;X.fillRect(0,0,W,H);
 px(28-cam*.018,26,18,18,"#fff0a9");mountains(.05,91,"#718178",42);mountains(.11,111,"#8c7254",32);city(.21,128,"#936a42");city(.38,146,"#b47f49");
 px(0,153,W,23,"#31a8c1");for(let i=0;i<16;i++)px(((i*29-cam*.62)%350+350)%350,156+(i%3)*4,13,1,"#77e6e8");px(0,GROUND,W,H-GROUND,"#d19a52");px(0,GROUND,W,5,"#795438")
}
function mountains(sp,y,c,amp){X.fillStyle=c;X.beginPath();X.moveTo(0,H);X.lineTo(0,y);for(let x=0;x<=W;x+=12){let wx=x+cam*sp;X.lineTo(x,y-Math.abs(Math.sin(wx*.025))*amp-Math.abs(Math.sin(wx*.071))*8)}X.lineTo(W,H);X.fill()}
function city(sp,base,c){X.fillStyle=c;for(let i=0;i<19;i++){let x=((i*38-cam*sp)%730+730)%730-40,h=18+(i*13%34);X.fillRect(x,base-h,26,h);X.fillStyle="#6e5038";for(let yy=base-h+5;yy<base-4;yy+=8)for(let xx=x+5;xx<x+22;xx+=8)X.fillRect(xx,yy,2,4);X.fillStyle=c}}
function props(){D.filter(d=>d.bg).forEach(d=>{let x=d.x-cam;if(x<-30||x>W+30)return;if(d.type==="rock"){px(x,GROUND-6,13,6,"#6f6454");px(x+3,GROUND-9,7,4,"#8e816a")}else{px(x+3,GROUND-23,2,23,"#745030");for(let a=0;a<5;a++){X.save();X.translate(Math.round(x+4),GROUND-22);X.rotate(a*1.22);px(0,0,13,2,"#4f8b55");X.restore()}}});D.filter(d=>!d.bg&&d.hp>0).forEach(d=>{let x=d.x-cam,c=d.stage===0?"#987249":d.stage===1?"#80603e":"#694b32";px(x,d.y,d.w,d.h,c);if(d.rescue){X.strokeStyle="#d6c59e";X.strokeRect(Math.round(x),d.y,d.w,d.h);for(let i=4;i<d.w;i+=5){X.beginPath();X.moveTo(x+i,d.y);X.lineTo(x+i,d.y+d.h);X.stroke()}}else{X.strokeStyle="#d3ad70";X.strokeRect(Math.round(x),d.y,d.w,d.h)}})}
function drawTruck(){if(!truck)return;let x=truck.x-cam,y=GROUND-26;px(x,y+7,40,14,"#454c3d");px(x+6,y,23,11,"#5a614d");px(x+8,y+2,7,5,"#7fb5b2");px(x+17,y+2,7,5,"#7fb5b2");px(x+30,y+8,10,6,"#3b4135");[7,33].forEach(q=>{X.fillStyle="#101313";X.beginPath();X.arc(Math.round(x+q),GROUND-3,5,0,7);X.fill();X.strokeStyle="#9a8b6b";X.stroke()});px(x+24,y+4,13,2,"#171c1d");px(x+29,y+4,5,1,pal.gold)}
function drawBoss(){if(!boss)return;let x=boss.x-cam,y=boss.y;px(x+10,y+18,78,52,"#48545a");px(x+24,y+1,42,25,"#59686f");px(x-14,y+31,30,8,"#2c3539");px(x-21,y+33,10,3,pal.red);[18,39,60,81].forEach(q=>{X.fillStyle="#101617";X.beginPath();X.arc(Math.round(x+q),Math.round(y+69),9,0,7);X.fill();X.strokeStyle="#8b9895";X.stroke()});px(x+62,y+20,10,5,pal.red);px(x+66,y+21,3,2,"#ffcc45")}
function drawPU(){PU.forEach(u=>{let x=u.x-cam,y=u.y+Math.sin(time*5+u.t)*2;px(x,y,9,9,u.type==="DATES"?"#c78136":pal.cyan);X.fillStyle=pal.ink;X.font="5px monospace";X.fillText(u.type==="DATES"?"D":u.type[0],Math.round(x+2),Math.round(y+7))})}
function drawFX(){FX.forEach(f=>{let x=f.x-cam;if(f.type==="muzzle"){px(x,f.y,6*f.dir,3,pal.gold);return}if(f.type==="dust"){X.globalAlpha=clamp(f.life*3,0,1);px(x-6,f.y-3,12,3,"#f0c27b")}if(f.type==="shell")px(x,f.y,2,1,"#e2b553");if(f.type==="spark"){X.globalAlpha=clamp(f.life*3,0,1);px(x,f.y,2,2,f.c)}X.globalAlpha=1})}
function render(){X.save();if(shake){X.translate(rnd(-shake,shake),rnd(-shake,shake));shake*=.82;if(shake<.2)shake=0}bg();props();drawTruck();drawPU();E.forEach(e=>e.draw());drawBoss();P.forEach(p=>p.draw());B.forEach(b=>px(b.x-cam,b.y,b.kind==="VOLT LASER"?6:3,b.kind==="VOLT LASER"?1:2,b.team?pal.red:b.kind==="VOLT LASER"?pal.cyan:pal.gold));G.forEach(g=>{X.fillStyle="#243128";X.beginPath();X.arc(Math.round(g.x-cam),Math.round(g.y),3,0,7);X.fill()});drawFX();CIV.forEach(c=>{let x=c.x-cam;px(x,c.y,6,17,"#6b5238");px(x+1,c.y-5,4,6,pal.skin)});if(flash>0){X.fillStyle=`rgba(255,95,55,${flash})`;X.fillRect(0,0,W,H);flash=Math.max(0,flash-.025)}X.restore()}
function hud(){let p=P[0];if(!p)return;$("score").textContent=String(Math.floor(score)).padStart(6,"0");$("lives").textContent="●".repeat(Math.max(0,p.hp))+"○".repeat(Math.max(0,3-p.hp));$("weapon").textContent=p.inTruck?"EX‑HMV":p.weapon;$("ammo").textContent=p.ammo>900?"∞":p.ammo;$("grenades").textContent="G×"+p.gren}
function checkDeath(){if(P.every(p=>!p.alive)){running=0;$("gameover").classList.remove("hidden");$("hud").classList.add("hidden");$("mobile").classList.add("hidden");$("endScore").textContent=Math.floor(score)}}
function win(){running=0;$("win").classList.remove("hidden");$("hud").classList.add("hidden");$("mobile").classList.add("hidden");$("winScore").textContent=Math.floor(score);announce("Mission complete")}
function start(){audio();build();running=1;paused=0;$("brief").classList.add("hidden");$("gameover").classList.add("hidden");$("win").classList.add("hidden");$("hud").classList.remove("hidden");if(matchMedia("(pointer:coarse)").matches)$("mobile").classList.remove("hidden")}
function loop(n){n/=1000;let frame=Math.min(.05,n-last);last=n;acc+=frame;while(acc>=STEP){if(running)update(STEP);acc-=STEP}render();hud();requestAnimationFrame(loop)}requestAnimationFrame(loop);

addEventListener("keydown",e=>{K[e.code]=1;if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();if(e.code==="KeyP"&&running){paused=!paused;toast(paused?"PAUSED":"RESUME")}});
addEventListener("keyup",e=>K[e.code]=0);
document.querySelectorAll("#mobile button").forEach(b=>{let k=b.dataset.k;b.onpointerdown=e=>{e.preventDefault();T[k]=1};b.onpointerup=b.onpointercancel=b.onpointerleave=e=>{e.preventDefault();T[k]=0}});
$("play1").onclick=()=>{mode2=0;$("menu").classList.add("hidden");$("brief").classList.remove("hidden");tone(480,.04)};
$("play2").onclick=()=>{mode2=1;$("menu").classList.add("hidden");$("brief").classList.remove("hidden");tone(540,.04)};
$("howBtn").onclick=()=>{$("menu").classList.add("hidden");$("how").classList.remove("hidden")};$("closeHow").onclick=()=>{$("how").classList.add("hidden");$("menu").classList.remove("hidden")};
$("deploy").onclick=start;$("retry").onclick=start;$("again").onclick=start;
})();