import {Player} from "./Player.js";import {Enemy} from "./Enemy.js";import {SandColossus} from "./Boss.js";import {WEAPONS} from "./Weapons.js";
export class World {
  constructor({input,audio,renderer,analytics,replay,coop=false}){Object.assign(this,{input,audio,renderer,analytics,replay,coop});this.reset()}
  reset(){
    this.width=4600;this.cam=0;this.score=0;this.time=0;this.progress=0;this.kills=0;this.rescues=0;this.active=true;
    this.players=[new Player(this,this.input,0)];if(this.coop)this.players.push(new Player(this,this.input,1));
    this.enemies=[];for(let x=190,i=0;x<3300;x+=145,i++)this.enemies.push(this.bind(new Enemy(x,{elite:i%6===5,type:i%4===2?"SHIELD":"RAIDER"})));
    this.bullets=[];this.grenades=[];this.fxList=[];this.props=[];for(let x=260;x<3100;x+=310)this.props.push({x,y:167,w:20,h:17,hp:3,stage:0,rescue:(x%620<50)});
    this.vehicle={x:1180,y:160,w:42,h:24,hp:14,used:false};this.boss=null;this.bossTriggered=false;
    this.analytics.track("mission_start",{mission:"RED_COAST"});this.replay.begin({mission:"RED_COAST"});
  }
  bind(e){e.world=this;return e}
  nearestPlayer(x){return this.players.filter(p=>p.hp>0).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0]}
  grenadeThreat(x){return this.grenades.some(g=>Math.abs(g.x-x)<34)}
  fx(type,x,y,color){this.fxList.push({type,x,y,life:type==="land"?.35:.1,color});if(type==="hit"){this.audio.noise(.08,.04);this.renderer.flash=.12}if(type==="muzzle")this.audio.tone(250,.025,"square",.016)}
  enemyShot(e,p){const dx=p.x-e.x,dy=(p.y+10)-(e.y+10),m=Math.hypot(dx,dy)||1;this.bullets.push({x:e.x,y:e.y+10,vx:dx/m*115,vy:dy/m*115,d:1,team:1,life:2,color:"#ff5a45"})}
  spawnPlayerBullet(p,w,a){this.bullets.push({x:p.x+6+p.dir*7,y:p.y+11,vx:Math.cos(a)*w.speed*p.dir,vy:Math.sin(a)*w.speed,d:w.damage,team:0,life:w.ttl||1.8,kind:w.id==="VOLT_LASER"?"laser":"shot",color:w.color,explosive:w.explosive,pierce:w.pierce||0});this.audio.tone(w.id==="VOLT_LASER"?680:w.id==="ARC_CANNON"?110:290,.025,"square",.015)}
  spawnGrenade(p){this.grenades.push({x:p.x+6,y:p.y+8,vx:75*p.dir,vy:-110,t:.95,bounce:.38,friction:.72});this.audio.tone(160,.03)}
  tryInteract(p){if(!this.vehicle.used&&Math.abs(p.x-this.vehicle.x)<28){p.inVehicle=true;this.vehicle.used=true}}
  vehicleControl(p,dt){const ax=this.input.axisX(p.index);this.vehicle.x=Math.max(0,Math.min(this.width-50,this.vehicle.x+ax*82*dt));p.x=this.vehicle.x+10;p.y=150;if(this.input.fire(p.index)&&p.shotCd<=0){p.shotCd=.16;this.bullets.push({x:this.vehicle.x+38,y:164,vx:250*(ax<0?-1:p.dir),vy:0,d:4,team:0,life:1.8,color:"#ffd452"})}}
  playerDown(p){this.analytics.track("player_death",{score:Math.floor(this.score)});if(this.players.every(x=>x.hp<=0)){this.active=false;this.analytics.track("game_end",{result:"loss",score:Math.floor(this.score)})}}
  killEnemy(e){this.score+=e.elite?220:110;this.kills++;this.fx("boom",e.x,e.y)}
  bossDefeated(){this.score+=5000;this.active=false;this.analytics.track("boss_complete",{boss:"SAND_COLOSSUS",score:Math.floor(this.score)});this.analytics.track("mission_complete",{mission:"RED_COAST",score:Math.floor(this.score),kills:this.kills,rescues:this.rescues})}
  bossSpread(b){for(let i=-3;i<=3;i++)this.bullets.push({x:b.x,y:b.y+28,vx:-120,vy:i*16,d:1,team:1,life:2.5,color:"#ff5a45"})}
  bossMortar(b){for(let i=0;i<4;i++)this.grenades.push({x:b.x+20,y:b.y+18,vx:-70-Math.random()*30,vy:-80-Math.random()*35,t:.8+Math.random()*.4,bounce:.2,friction:.7,enemy:true})}
  bossReinforce(){this.enemies.push(this.bind(new Enemy(this.cam+330,{elite:true})),this.bind(new Enemy(this.cam+370,{type:"SHIELD"})))}
  bossBeam(b){this.bullets.push({x:b.x,y:b.y+46,vx:-205,vy:0,d:1,team:1,life:2.2,color:"#ff2d31",kind:"laser"})}
  _hit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
  update(dt){
    this.time+=dt;for(const p of this.players)p.update(dt);for(const e of this.enemies)e.update(dt);
    for(const b of this.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      if(b.team===0){for(const e of this.enemies){if(!e.dead&&this._hit({x:b.x,y:b.y,w:3,h:3},e)){e.hit(b.d);if(b.pierce>0)b.pierce--;else b.life=0;break}}if(this.boss&&this._hit({x:b.x,y:b.y,w:4,h:4},this.boss)){this.boss.hit(b.d);b.life=0}
        for(const p of this.props){if(p.hp>0&&this._hit({x:b.x,y:b.y,w:3,h:3},p)){p.hp-=b.d;p.stage=Math.min(3,3-p.hp);if(p.hp<=0){this.score+=80;if(p.rescue){this.rescues++;this.score+=500}}b.life=0}}
      } else for(const p of this.players){if(p.hp>0&&this._hit({x:b.x,y:b.y,w:3,h:3},p)){p.hurt(b.d);b.life=0}}
    }
    this.bullets=this.bullets.filter(b=>b.life>0&&b.y>-20&&b.y<244);
    for(const g of this.grenades){g.vy+=260*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;if(g.y>181){g.y=181;g.vy*=-g.bounce;g.vx*=g.friction}g.t-=dt;if(g.t<=0){if(g.enemy){for(const p of this.players)if(Math.hypot(p.x-g.x,p.y-g.y)<28)p.hurt(1)}else{for(const e of this.enemies)if(!e.dead&&Math.abs(e.x-g.x)<30)e.hit(3);if(this.boss&&Math.abs(this.boss.x-g.x)<65)this.boss.hit(4)}this.audio.noise(.14,.05)}}
    this.grenades=this.grenades.filter(g=>g.t>0);
    for(const f of this.fxList)f.life-=dt;this.fxList=this.fxList.filter(f=>f.life>0);
    const lead=Math.max(...this.players.map(p=>p.x));this.cam=Math.max(0,Math.min(this.width-304,lead-92));this.progress=Math.min(1,lead/this.width);
    if(lead>3450&&!this.bossTriggered){this.bossTriggered=true;this.boss=new SandColossus(this);this.analytics.track("boss_start",{boss:"SAND_COLOSSUS"})}
    this.boss?.update(dt);
    const active=this.enemies.filter(e=>!e.dead&&Math.abs(e.x-lead)<360).length+this.bullets.length+this.grenades.length+this.fxList.length;
    this.timeScale=active>110?.72:active>82?.84:active>58?.92:1;
    this.score+=dt*(4+active*.02);this.replay.push({t:+this.time.toFixed(3),x:+lead.toFixed(2),score:Math.floor(this.score)})
  }
  render(){
    const r=this.renderer;r.clear();r.worldBackground(this.cam);
    for(const p of this.props){if(p.hp<=0)continue;r.rect(p.x-this.cam,p.y,p.w,p.h,p.stage===0?"#99734c":p.stage===1?"#7f5f3f":"#684a31")}
    r.rect(this.vehicle.x-this.cam,this.vehicle.y,this.vehicle.w,this.vehicle.h,"#4b5445");
    for(const e of this.enemies)r.drawEnemy(e,this.cam);
    for(const p of this.players)r.drawPlayer(p,this.cam);
    for(const b of this.bullets)r.drawBullet(b,this.cam);
    for(const g of this.grenades){r.x.fillStyle="#233029";r.x.beginPath();r.x.arc(Math.round(g.x-this.cam),Math.round(g.y),3,0,7);r.x.fill()}
    if(this.boss&&!this.boss.dead){r.rect(this.boss.x-this.cam,this.boss.y,100,84,"#46535a");r.rect(this.boss.x-this.cam+65,this.boss.y+20,11,5,"#ff4d3c")}
  }
}