export class ReplayRecorder {
  constructor(){this.frames=[];this.meta={};this.recording=false}
  begin(meta={}){this.frames=[];this.meta={...meta,startedAt:Date.now()};this.recording=true}
  push(state){if(this.recording)this.frames.push(state)}
  end(){this.recording=false;return{meta:{...this.meta,endedAt:Date.now()},frames:this.frames}}
}