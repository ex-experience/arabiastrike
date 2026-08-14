export class Input {
  constructor() {
    this.k = Object.create(null);
    addEventListener("keydown", e => {
      this.k[e.code] = true;
      if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault();
    });
    addEventListener("keyup", e => this.k[e.code] = false);
  }
  axisX(player=0) {
    if(player===1) return (this.k.ArrowRight?1:0)-(this.k.ArrowLeft?1:0);
    return (this.k.KeyD?1:0)-(this.k.KeyA?1:0);
  }
  jump(player=0){ return player===1 ? this.k.ArrowUp : (this.k.KeyW||this.k.Space); }
  fire(player=0){ return player===1 ? (this.k.Slash||this.k.Numpad1) : (this.k.KeyJ||this.k.KeyF); }
  grenade(player=0){ return player===1 ? (this.k.Period||this.k.Numpad2) : this.k.KeyK; }
  interact(player=0){ return player===1 ? this.k.Enter : this.k.KeyE; }
}