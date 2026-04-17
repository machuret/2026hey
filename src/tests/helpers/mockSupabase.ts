// ═══════════════════════════════════════════════════════════════════════════
// Minimal Supabase client mock for E2E tests.
//
// Supports the chainable query-builder surface used by our API routes:
//   from(table).select().eq().in().not().or().order().limit() → awaitable
//   from(table).insert(row).select().single()
//   from(table).update(patch).eq().select()
//   from(table).delete().in()
//   rpc(name, args)
//
// Strategy: queue pre-built results per table (FIFO). Each .from(table) call
// consumes the next queued result for that table. For rpc, results are keyed
// by name. If a query is made without a queued result, returns {data:[], error:null}.
//
// This is NOT a full SQL simulator — it's a controllable fake for deterministic
// test assertions. If a handler uses a method we don't chain here, add it.
// ═══════════════════════════════════════════════════════════════════════════

export type QueryResult<T = unknown> = {
  data?:  T | null;
  error?: { message: string } | null;
  count?: number | null;
};

type Call = { method: string; args: unknown[] };

export interface QueryBuilder {
  _calls: Call[];
  select: (...a: unknown[]) => QueryBuilder;
  insert: (...a: unknown[]) => QueryBuilder;
  update: (...a: unknown[]) => QueryBuilder;
  upsert: (...a: unknown[]) => QueryBuilder;
  delete: (...a: unknown[]) => QueryBuilder;
  eq:     (...a: unknown[]) => QueryBuilder;
  neq:    (...a: unknown[]) => QueryBuilder;
  in:     (...a: unknown[]) => QueryBuilder;
  is:     (...a: unknown[]) => QueryBuilder;
  not:    (...a: unknown[]) => QueryBuilder;
  or:     (...a: unknown[]) => QueryBuilder;
  gt:     (...a: unknown[]) => QueryBuilder;
  gte:    (...a: unknown[]) => QueryBuilder;
  lt:     (...a: unknown[]) => QueryBuilder;
  lte:    (...a: unknown[]) => QueryBuilder;
  order:  (...a: unknown[]) => QueryBuilder;
  limit:  (...a: unknown[]) => QueryBuilder;
  range:  (...a: unknown[]) => QueryBuilder;
  single: () => QueryBuilder;
  maybeSingle: () => QueryBuilder;
  then: <R>(onFul: (v: QueryResult) => R) => Promise<R>;
}

function makeBuilder(result: QueryResult): QueryBuilder {
  const calls: Call[] = [];
  const chainable = ["select","insert","update","upsert","delete","eq","neq","in","is","not","or",
    "gt","gte","lt","lte","order","limit","range","single","maybeSingle"] as const;

  const builder = {} as QueryBuilder;
  builder._calls = calls;

  for (const m of chainable) {
    (builder as unknown as Record<string, (...a: unknown[]) => QueryBuilder>)[m] =
      (...args: unknown[]) => { calls.push({ method: m, args }); return builder; };
  }

  builder.then = <R,>(onFul: (v: QueryResult) => R) => Promise.resolve(onFul(result));
  return builder;
}

export class MockSupabase {
  private queues: Record<string, QueryResult[]> = {};
  private rpcResults: Record<string, QueryResult> = {};
  /** Last builder returned per `from(table)` — inspect its calls for assertions */
  public lastBuilders: Record<string, QueryBuilder[]> = {};

  /** Queue the next response(s) for a given table (FIFO). */
  queue(table: string, ...results: QueryResult[]): this {
    if (!this.queues[table]) this.queues[table] = [];
    this.queues[table].push(...results);
    return this;
  }

  /** Set an rpc response by name. Overwrites previous. */
  queueRpc(name: string, result: QueryResult): this {
    this.rpcResults[name] = result;
    return this;
  }

  /** Supabase client surface */
  from(table: string): QueryBuilder {
    const next = this.queues[table]?.shift() ?? { data: [], error: null };
    const b = makeBuilder(next);
    if (!this.lastBuilders[table]) this.lastBuilders[table] = [];
    this.lastBuilders[table].push(b);
    return b;
  }

  rpc(name: string, _args?: unknown): Promise<QueryResult> {
    return Promise.resolve(this.rpcResults[name] ?? { data: null, error: null });
  }

  /** Assert a call chain was made against a table. */
  getCalls(table: string, idx = 0): Call[] {
    return this.lastBuilders[table]?.[idx]?._calls ?? [];
  }
}
