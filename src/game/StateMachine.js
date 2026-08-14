export class StateMachine {
  constructor(owner, initial){this.owner=owner;this.state=initial;this.time=0}
  set(next){if(next===this.state)return;this.owner?.onExitState?.(this.state);this.state=next;this.time=0;this.owner?.onEnterState?.(next)}
  update(dt){this.time+=dt;this.owner?.onState?.(this.state,dt,this.time)}
}