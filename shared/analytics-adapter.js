
export class AnalyticsAdapter {
  constructor({gameId, sink=null}) {
    this.gameId = gameId;
    this.sink = sink;
    this.sessionId = crypto?.randomUUID?.() || `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.queue = [];
  }
  async track(event, payload={}) {
    const item = {schema:1, gameId:this.gameId, sessionId:this.sessionId, event, at:new Date().toISOString(), ...payload};
    this.queue.push(item);
    if (this.queue.length > 200) this.queue.shift();
    if (this.sink) {
      try { await this.sink(item); } catch {}
    }
    try { localStorage.setItem(`ex-analytics-${this.gameId}`, JSON.stringify(this.queue.slice(-80))); } catch {}
    return item;
  }
}
