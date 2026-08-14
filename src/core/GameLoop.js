export class GameLoop {
  constructor({hz=59.18, update, render}) {
    this.step = 1/hz; this.update = update; this.render = render;
    this.acc = 0; this.last = performance.now()/1000; this.running = false; this.timeScale = 1;
  }
  start() { if(this.running) return; this.running = true; requestAnimationFrame(this._tick); }
  stop() { this.running = false; }
  _tick = (ms) => {
    if(!this.running) return;
    const now = ms/1000;
    let frame = Math.min(.05, now-this.last);
    this.last = now; this.acc += frame * this.timeScale;
    let guard = 0;
    while(this.acc >= this.step && guard++ < 8) { this.update(this.step); this.acc -= this.step; }
    this.render(this.acc/this.step);
    requestAnimationFrame(this._tick);
  }
}