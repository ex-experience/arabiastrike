export class PixelRenderer {
  constructor(canvas){this.c=canvas;this.x=canvas.getContext("2d",{alpha:false});this.x.imageSmoothingEnabled=false;this.shake=0;this.flash=0}
  clear(){
    const g=this.x.createLinearGradient(0,0,0,224);g.addColorStop(0,"#58c5eb");g.addColorStop(.55,"#ffe19b");g.addColorStop(1,"#db8742");this.x.fillStyle=g;this.x.fillRect(0,0,304,224)
  }
  rect(x,y,w,h,c){this.x.fillStyle=c;this.x.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
  worldBackground(cam){
    const X=this.x;
    const layer=(factor,base,color,amp,step=18)=>{
      X.fillStyle=color;X.beginPath();X.moveTo(0,224);X.lineTo(0,base);
      for(let sx=0;sx<=304;sx+=step){let wx=sx+cam*factor;X.lineTo(sx,base-Math.abs(Math.sin(wx*.026))*amp-Math.abs(Math.sin(wx*.071))*5)}
      X.lineTo(304,224);X.fill();
    };
    layer(.03,95,"#70817a",30);layer(.09,117,"#9d7954",24);
    for(const [factor,base,color] of [[.18,132,"#997146"],[.34,149,"#b98653"]]){
      X.fillStyle=color;
      for(let i=0;i<18;i++){let sx=((i*42-cam*factor)%790+790)%790-45,h=18+(i*17%35);X.fillRect(Math.round(sx),base-h,28,h)}
    }
    this.rect(0,154,304,30,"#2d9fb6");this.rect(0,184,304,40,"#d09b55");this.rect(0,184,304,5,"#755035");
  }
  drawPlayer(p,cam){if(p.hp<=0||(p.ifr>0&&Math.floor(p.ifr*20)%2))return;let x=p.x-cam,y=p.y;this.rect(x+2,y+18,4,10,"#eee8dd");this.rect(x+7,y+18,4,10,"#eee8dd");this.rect(x+1,y+8,10,13,"#e8dfd0");this.rect(x+3,y,7,8,"#986246");this.rect(x+2,y-4,9,5,"#111");this.rect(x+2,y+4,8,3,"#1c1513");this.rect(x+(p.dir>0?9:-8),y+12,11*p.dir,3,"#161c1f")}
  drawEnemy(e,cam){if(e.dead)return;let x=e.x-cam,y=e.y,c=e.elite?"#9a3f37":"#586348";this.rect(x+3,y,7,7,"#9e684d");this.rect(x+2,y-4,9,5,"#3f4932");this.rect(x+2,y+8,9,10,c);this.rect(x+(e.dir>0?8:-8),y+11,11*e.dir,2,"#171d1e")}
  drawBullet(b,cam){this.rect(b.x-cam,b.y,b.kind==="laser"?6:3,b.kind==="laser"?1:2,b.color||"#ffd452")}
}