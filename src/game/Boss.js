export class SandColossus {
  constructor(world){this.world=world;this.x=3890;this.y=100;this.w=100;this.h=84;this.max=90;this.hp=90;this.cd=.5;this.t=0;this.phase=0;this.dead=false}
  hit(n){if(this.dead)return;this.hp-=n;if(this.hp<=0){this.dead=true;this.world.bossDefeated(this)}}
  update(dt){
    if(this.dead)return;this.t+=dt;this.phase=Math.min(3,Math.floor((1-this.hp/this.max)*4));this.cd-=dt;
    if(this.cd>0)return;
    if(this.phase===0)this.world.bossSpread(this);
    if(this.phase===1)this.world.bossMortar(this);
    if(this.phase===2)this.world.bossReinforce(this);
    if(this.phase===3)this.world.bossBeam(this);
    this.cd=[.85,1.1,1.4,.72][this.phase];
  }
}