import {WEAPONS} from "./Weapons.js";
export class Player {
  constructor(world,input,index=0){
    Object.assign(this,{world,input,index,x:index?20:38,y:155,w:12,h:29,vx:0,vy:0,dir:1,on:true,hp:3,ifr:0,weapon:"PULSE_MG",shotCd:0,grenCd:0,grenades:5,inVehicle:false});
  }
  hurt(n=1){if(this.ifr>0||this.inVehicle)return;this.hp-=n;this.ifr=1.0;this.world.fx("hit",this.x,this.y);if(this.hp<=0)this.world.playerDown(this)}
  update(dt){
    const ax=this.input.axisX(this.index);this.vx=ax*62;if(ax)this.dir=Math.sign(ax);
    if(this.inVehicle){this.world.vehicleControl(this,dt);this.cool(dt);return}
    if(this.input.jump(this.index)&&this.on){this.vy=-132;this.on=false;this.world.fx("jump",this.x,this.y)}
    this.vy+=350*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;
    if(this.y+this.h>=184){if(!this.on&&this.vy>80)this.world.fx("land",this.x,this.y);this.y=184-this.h;this.vy=0;this.on=true}
    if(this.input.fire(this.index))this.fire();
    if(this.input.grenade(this.index)&&this.grenades>0&&this.grenCd<=0){this.world.spawnGrenade(this);this.grenades--;this.grenCd=.35}
    if(this.input.interact(this.index))this.world.tryInteract(this);
    this.cool(dt)
  }
  cool(dt){this.ifr=Math.max(0,this.ifr-dt);this.shotCd=Math.max(0,this.shotCd-dt);this.grenCd=Math.max(0,this.grenCd-dt)}
  fire(){
    if(this.shotCd>0)return;const w=WEAPONS[this.weapon];this.shotCd=w.rate;
    for(let i=0;i<w.count;i++){const a=(i-(w.count-1)/2)*(w.spread/Math.max(1,w.count-1));this.world.spawnPlayerBullet(this,w,a)}
    this.world.fx("muzzle",this.x+this.dir*9,this.y+10,w.color);
  }
}