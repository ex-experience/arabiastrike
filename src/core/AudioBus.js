export class AudioBus {
  constructor(){ this.ctx=null; this.master=null; this.enabled=true; }
  unlock(){
    if(this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value=.18; this.master.connect(this.ctx.destination);
  }
  tone(f=220,d=.05,type="square",gain=.03,slide=0){
    if(!this.enabled) return; this.unlock(); if(!this.ctx) return;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(f,this.ctx.currentTime);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),this.ctx.currentTime+d);
    g.gain.setValueAtTime(gain,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+d);
    o.connect(g);g.connect(this.master);o.start();o.stop(this.ctx.currentTime+d);
  }
  noise(d=.08,gain=.025){
    this.unlock(); if(!this.ctx||!this.enabled)return;
    const b=this.ctx.createBuffer(1,Math.max(1,this.ctx.sampleRate*d),this.ctx.sampleRate),a=b.getChannelData(0);
    for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;
    const s=this.ctx.createBufferSource(),g=this.ctx.createGain();s.buffer=b;g.gain.setValueAtTime(gain,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+d);s.connect(g);g.connect(this.master);s.start();
  }
}