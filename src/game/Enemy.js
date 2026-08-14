import {StateMachine} from "./StateMachine.js";
export class Enemy {
  constructor(x,{elite=false,type="RAIDER"}={}) {
    Object.assign(this,{x,y:160,w:11,h:24,vx:0,hp:elite?4:2,elite,type,dir:-1,dead:false,cool:Math.random(),surprised:false});
    this.fsm=new StateMachine(this,"RELAXED");
    this.world=null;
  }
  hit(n=1){this.hp-=n;if(this.hp<=0){this.dead=true;this.world?.killEnemy?.(this)}else this.fsm.set("PANIC")}
  onState(state,dt,t){
    const p=this.world?.nearestPlayer?.(this.x); if(!p)return;
    const dx=p.x-this.x, ad=Math.abs(dx); this.dir=Math.sign(dx)||-1; this.cool=Math.max(0,this.cool-dt);
    if(state==="RELAXED"){
      if(ad<115){this.fsm.set("SURPRISED");return}
      if(t>1.4)this.fsm.set(Math.random()<.5?"PATROL":"COOKING");
    } else if(state==="PATROL"){
      this.x+=this.dir*8*dt;if(ad<115)this.fsm.set("SURPRISED");else if(t>1.8)this.fsm.set("RELAXED");
    } else if(state==="COOKING"){
      if(ad<100)this.fsm.set("SURPRISED"); else if(t>1.3)this.fsm.set("RELAXED");
    } else if(state==="SURPRISED"){
      if(t>.28)this.fsm.set(ad<18?"MELEE":"CHASE");
    } else if(state==="CHASE"){
      if(this.world?.grenadeThreat?.(this.x)) {this.fsm.set(Math.random()<.55?"DODGE":"DUCK");return}
      if(ad<16){this.fsm.set("MELEE");return}
      if(ad<72){this.fsm.set("SHOOT");return}
      this.x+=this.dir*(this.elite?23:18)*dt;
    } else if(state==="SHOOT"){
      if(ad<16){this.fsm.set("MELEE");return}
      if(ad>95){this.fsm.set("CHASE");return}
      if(this.cool<=0){this.world.enemyShot(this,p);this.cool=this.elite?.5:.85}
      if(this.world?.grenadeThreat?.(this.x))this.fsm.set("DODGE");
    } else if(state==="MELEE"){
      if(t>.22&&t<.30&&ad<17)p.hurt?.(1);
      if(t>.48)this.fsm.set("CHASE");
    } else if(state==="DODGE"){
      this.x-=this.dir*35*dt;if(t>.42)this.fsm.set("CHASE");
    } else if(state==="DUCK"){
      if(t>.55)this.fsm.set("CHASE");
    } else if(state==="PANIC"){
      this.x-=this.dir*24*dt;if(t>.35)this.fsm.set("RETREAT");
    } else if(state==="RETREAT"){
      this.x-=this.dir*16*dt;if(t>.7)this.fsm.set("CHASE");
    }
  }
  update(dt){if(!this.dead)this.fsm.update(dt)}
}