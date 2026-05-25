import type { Source, Notifier } from "../types.js";

export class Registry {
  private sources = new Map<string, Source<any>>();
  private notifiers = new Map<string, Notifier<any>>();

  registerSource(s: Source<any>): void {
    if (this.sources.has(s.type)) throw new Error(`source already registered: ${s.type}`);
    this.sources.set(s.type, s);
  }
  getSource(type: string): Source<any> {
    const s = this.sources.get(type);
    if (!s) throw new Error(`unknown source: ${type}`);
    return s;
  }
  listSources(): Source<any>[] {
    return [...this.sources.values()];
  }

  registerNotifier(n: Notifier<any>): void {
    if (this.notifiers.has(n.type)) throw new Error(`notifier already registered: ${n.type}`);
    this.notifiers.set(n.type, n);
  }
  getNotifier(type: string): Notifier<any> {
    const n = this.notifiers.get(type);
    if (!n) throw new Error(`unknown notifier: ${type}`);
    return n;
  }
  listNotifiers(): Notifier<any>[] {
    return [...this.notifiers.values()];
  }
}
