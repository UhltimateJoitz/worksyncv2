<script>  
    window.WorkSyncSandboxFixtures = (() => {
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const weekStart = iso(monday);
  const weekEnd = iso(sunday);

  const rosterRows = [
    ["M151473", "Nisha Olive Sulleza", "Mari Jone Fernandez", "CET", "Ops Support", "CCAC", true],
    ["M151475", "Connie Lea Sion Tabilla", "Edelyn Acocon", "CET", "Ops Support", "CCAC", true],
    ["M151476", "Reema Subhi M.M. Al Kurd", "Janine Sirdoncillio", "CIT", "VOICE", "CCAC", true],
    ["M152004", "Erica Jean Cortez", "Edelyn Acocon", "CIT", "VOICE", "CCAC", true],
    ["M152010", "Jessica Almira", "Janine Sirdoncillio", "CAT", "L2 Escalation", "CCAC", true],
    ["M156260", "Kaye Smith Amante", "Mari Jone Fernandez", "CET", "Ops Support", "CCAC", true],
    ["M156262", "Melisa Laurente", "Mari Jone Fernandez", "CET", "Ops Support", "CCAC", true],
    ["M153188", "Norlyn Epelipsia", "Mari Jone Fernandez", "CIT", "DIGITAL", "CCAC", true],
    ["M131436", "Haydee Kris Aguilar", "Jerry Serfajuan", "CET", "Ops Support", "CMIP", true],
    ["M149796", "John Paul Cabaltea", "Jerry Serfajuan", "CET", "Ops Support", "CDI", true]
  ];

  const scheduleRows = [];
  const activityRows = [];
  let scheduleId = 1;
  let activityId = 1;
  rosterRows.forEach((r, agentIdx) => {
    for (let d = 0; d < 7; d++) {
      const day = new Date(monday);
      day.setDate(day.getDate() + d);
      const dateStr = iso(day);
      const dayOfWeek = day.getDay();
      let status = "WORKING";
      let shiftStart = "09:00";
      let shiftEnd = "18:00";
      if (dayOfWeek === 0 || (agentIdx + d) % 5 === 0) {
        status = "OFF"; shiftStart = null; shiftEnd = null;
      } else if ((agentIdx + d) % 11 === 0) {
        status = "VL"; shiftStart = null; shiftEnd = null;
      }
      scheduleRows.push([scheduleId, 1, r[0], dateStr, status, shiftStart, shiftEnd]);
      if (status === "WORKING") {
        activityRows.push([activityId++, scheduleId, "Break 1", "11:00", "11:15"]);
        activityRows.push([activityId++, scheduleId, "Lunch 1", "12:30", "13:00"]);
        activityRows.push([activityId++, scheduleId, "Break 2", "15:00", "15:15"]);
        activityRows.push([activityId++, scheduleId, "Lunch 2", "16:30", "17:00"]);
      }
      scheduleId++;
    }
  });

  return {
    roster: {
      cols: ["employee_id", "name", "team_leader", "group_name", "subgroup", "lob", "active"],
      rows: rosterRows
    },
    schedule_versions: {
      cols: ["id", "lob", "version_number", "week_start", "week_end", "status", "source_file_name", "published_at"],
      rows: [[1, "CCAC", 1, weekStart, weekEnd, "published", "Sandbox Fixture", new Date().toISOString()]]
    },
    schedules: {
      cols: ["id", "schedule_version_id", "employee_id", "schedule_date", "schedule_status", "shift_start", "shift_end"],
      rows: scheduleRows
    },
    schedule_activities: {
      cols: ["id", "schedule_id", "activity_type", "start_time", "end_time"],
      rows: activityRows
    }
  };
})();


  class SandboxQueryBuilder {
  constructor(table, store) {
    this.table = table;
    this.store = store;
    this.action = 'select';
    this.columns = '*';
    this.filters = [];
    this.orderConfig = null;
    this.limitCount = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.payload = null;
  }

  select(columns = '*', options = {}) {
    this.action = 'select';
    this.columns = columns;
    return this;
  }

  insert(rows) { this.action = 'insert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
  update(values) { this.action = 'update'; this.payload = values; return this; }
  delete() { this.action = 'delete'; return this; }

  eq(col, val) { this.filters.push(row => String(row[col] ?? '') === String(val ?? '')); return this; }
  neq(col, val) { this.filters.push(row => String(row[col] ?? '') !== String(val ?? '')); return this; }
  gte(col, val) { this.filters.push(row => (row[col] ?? '') >= val); return this; }
  lte(col, val) { this.filters.push(row => (row[col] ?? '') <= val); return this; }
  gt(col, val) { this.filters.push(row => (row[col] ?? '') > val); return this; }
  lt(col, val) { this.filters.push(row => (row[col] ?? '') < val); return this; }
  in(col, arr) {
    const set = new Set((arr || []).map(x => String(x ?? '')));
    this.filters.push(row => set.has(String(row[col] ?? '')));
    return this;
  }
  is(col, val) {
    if (val === null) this.filters.push(row => row[col] === null || row[col] === undefined);
    else this.filters.push(row => row[col] === val);
    return this;
  }

  order(col, options = { ascending: true }) {
    this.orderConfig = { col, ascending: options?.ascending !== false };
    return this;
  }

  limit(n) { this.limitCount = Number(n); return this; }
  single() { this.isSingle = true; return this; }
  maybeSingle() { this.isMaybeSingle = true; return this; }

  async then(resolve, reject) {
    try {
      const res = await this.store.execute(this);
      resolve(res);
    } catch (err) {
      resolve({ data: null, error: err });
    }
  }
}


class WorkSyncSandboxStore {
  constructor(rawFixtures) {
    this.rawFixtures = rawFixtures;
    this.tables = {};
    this.initTables();
    this.loadPersisted();
  }

  initTables() {
    // Default Profiles
    this.tables.profiles = [
      { id: "admin-dev-uuid", employee_id: "ADMIN01", display_name: "Admin User", role: "admin" },
      { id: "wfm-dev-uuid", employee_id: "WFM01", display_name: "WFM Planner", role: "wfm" },
      { id: "tl-edelyn-uuid", employee_id: "TL-EDELYN", display_name: "Edelyn Acocon", role: "tl" },
      { id: "tl-mari-uuid", employee_id: "TL-MARI", display_name: "Mari Jone Fernandez", role: "tl" },
      { id: "tl-janine-uuid", employee_id: "TL-JANINE", display_name: "Janine Sirdoncillio", role: "tl" },
      { id: "om-bien-uuid", employee_id: "OM-BIEN", display_name: "Bienvenido OM", role: "ops_om" },
      { id: "agent-nisha-uuid", employee_id: "M151473", display_name: "Nisha Olive Sulleza", role: "user" }
    ];
    this.tables.leave_requests = [];
    this.tables.attendance_snapshots = [];
    this.tables.schedule_change_log = [];
    this.tables.app_notifications = [];
  }

  getTable(name) {
    if (!this.tables[name]) this.tables[name] = [];
    return this.tables[name];
  }

  loadPersisted() {
    try {
      const saved = localStorage.getItem('worksync.sandbox_mutations');
      if (saved) {
        const mutations = JSON.parse(saved);
        if (mutations.tables) {
          Object.assign(this.tables, mutations.tables);
        }
      }
    } catch (e) { console.warn("Could not load sandbox mutations", e); }
  }

  savePersisted() {
    try {
      localStorage.setItem('worksync.sandbox_mutations', JSON.stringify({
        timestamp: Date.now(),
        tables: this.tables
      }));
    } catch (e) { console.warn("Could not save sandbox mutations", e); }
  }

  resetToFixtures() {
    localStorage.removeItem('worksync.sandbox_mutations');
    this.initTables();
  }

  getMutationCount() {
    try {
      const saved = localStorage.getItem('worksync.sandbox_mutations');
      if (!saved) return 0;
      return Object.keys(JSON.parse(saved).tables || {}).length;
    } catch (e) { return 0; }
  }

  async execute(qb) {
    let rows = [...this.getTable(qb.tableName)];

    if (qb.action === 'select') {
      for (const filter of qb.filters) {
        rows = rows.filter(filter);
      }
      const count = rows.length;

      if (qb.orderConfig) {
        const { col, ascending } = qb.orderConfig;
        rows.sort((a, b) => {
          const va = a[col] ?? '', vb = b[col] ?? '';
          if (va === vb) return 0;
          return (ascending ? 1 : -1) * (va > vb ? 1 : -1);
        });
      }

      if (qb.limitCount !== null) {
        rows = rows.slice(0, qb.limitCount);
      }

      const project = row => {
        if (!row || qb.selectCols === '*') return row;
        const keys = qb.selectCols.split(',').map(s => s.trim().split(' ')[0]);
        const res = {};
        for (const k of keys) if (k in row) res[k] = row[k];
        return res;
      };

      if (qb.isHead) return { data: null, error: null, count };
      if (qb.isSingle) {
        if (rows.length === 0) return { data: null, error: { message: 'Row not found' }, count };
        return { data: project(rows[0]), error: null, count };
      }
      if (qb.isMaybeSingle) {
        return { data: rows[0] ? project(rows[0]) : null, error: null, count };
      }
      return { data: rows.map(project), error: null, count };
    }

    if (qb.action === 'insert') {
      const inserted = qb.payload.map(p => {
        const row = { ...p };
        if (!row.id) row.id = Date.now() + Math.floor(Math.random() * 1000);
        this.tables[qb.tableName].push(row);
        return row;
      });
      this.savePersisted();
      return { data: inserted, error: null };
    }

    if (qb.action === 'update') {
      let updatedCount = 0;
      for (let i = 0; i < this.tables[qb.tableName].length; i++) {
        const row = this.tables[qb.tableName][i];
        const match = qb.filters.every(f => f(row));
        if (match) {
          Object.assign(row, qb.payload);
          updatedCount++;
        }
      }
      this.savePersisted();
      return { data: null, count: updatedCount, error: null };
    }

    if (qb.action === 'delete') {
      const before = this.tables[qb.tableName].length;
      this.tables[qb.tableName] = this.tables[qb.tableName].filter(row => !qb.filters.every(f => f(row)));
      const deletedCount = before - this.tables[qb.tableName].length;
      this.savePersisted();
      return { data: null, count: deletedCount, error: null };
    }

    return { data: null, error: new Error('Unknown action ' + qb.action) };
  }

  async executeRpc(funcName, params = {}) {
    if (funcName === 'apply_schedule_change') {
      return { data: { rows_changed: 1, break_lunch_activities_on_changed_rows: 0 }, error: null };
    }
    if (funcName === 'save_attendance_run') {
      return { data: true, error: null };
    }
    if (funcName === 'attendance_archive_retention_preview') {
      return { data: [{ snapshot_count: 0, cutoff_date: new Date().toISOString() }], error: null };
    }
    if (funcName === 'purge_attendance_archive') {
      return { data: 0, error: null };
    }
    return { data: null, error: null };
  }
}

/* WorkSync Unified Database Router */

window.WorkSyncDB = (() => {
  const SUPABASE_DEFAULT_URL = "https://zjlauzyixseebifyvvvz.supabase.co";
  const SUPABASE_DEFAULT_KEY = "sb_publishable_cFJ4HQ5nSa3T5GDYJl56sw_OUpXHF7l";

  let activeEnv = localStorage.getItem('worksync.active_db_env') || 'production';
  let supabaseUrl = localStorage.getItem('worksync.supabase_url') || SUPABASE_DEFAULT_URL;
  let supabaseKey = localStorage.getItem('worksync.supabase_key') || SUPABASE_DEFAULT_KEY;
  let neonDbUrl = localStorage.getItem('worksync.neon_db_url') || '';
  let neonHttpEndpoint = localStorage.getItem('worksync.neon_http_endpoint') || '';
  let sandboxMode = localStorage.getItem('worksync.sandbox_mode') || 'auto';

  let realSupabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
  let sandboxStore = new WorkSyncSandboxStore(window.WorkSyncSandboxFixtures);

  function getEnvironment() { return activeEnv; }

  function setEnvironment(env) {
    if (!['production', 'sandbox'].includes(env)) return;
    activeEnv = env;
    localStorage.setItem('worksync.active_db_env', env);
    updateEnvironmentUI();
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') window.dispatchEvent(new CustomEvent('worksync:env-changed', { detail: { environment: env } }));
  }

  function updateEnvironmentUI() {
    const banner = document.getElementById('wsGlobalSandboxBanner');
    const badge = document.getElementById('settingsActiveEnvBadge');
    const title = document.getElementById('settingsActiveEnvTitle');
    const desc = document.getElementById('settingsActiveEnvDesc');
    const icon = document.getElementById('settingsEnvIcon');
    const homeDb = document.getElementById('homeDbStatus');
    const isSb = activeEnv === 'sandbox';

    if (banner) banner.classList.toggle('hidden', !isSb);
    if (badge) {
      badge.textContent = isSb ? 'SANDBOX · NEON DB' : 'PRODUCTION · SUPABASE';
      badge.className = isSb ? 'pill' : 'pill';
      badge.style.background = isSb ? '#7e22ce' : '';
      badge.style.color = isSb ? '#fff' : '';
    }
    if (title) title.textContent = isSb ? 'Neon Sandbox (Isolated Test DB)' : 'Supabase Production (Live DB)';
    if (desc) desc.textContent = isSb
      ? 'All schedule operations, roster adjustments, and test activities run in complete isolation from Supabase Production.'
      : 'All schedule operations, roster records, and agent activities are interacting with the live production Supabase instance.';
    if (icon) icon.textContent = isSb ? '🧪' : '⚡';
    if (homeDb) homeDb.textContent = isSb ? 'Neon Sandbox (Safe)' : 'Production (Supabase)';

    const btnProd = document.getElementById('btnEnvProd');
    const btnSb = document.getElementById('btnEnvSandbox');
    if (btnProd) btnProd.classList.toggle('active', !isSb);
    if (btnSb) btnSb.classList.toggle('active', isSb);
  }

  async function testSupabase() {
    const start = performance.now();
    try {
      const { count, error } = await realSupabaseClient.from('roster').select('employee_id', { count: 'exact', head: true });
      const latency = Math.round(performance.now() - start);
      if (error) throw error;
      return { ok: true, latency, count };
    } catch (err) {
      return { ok: false, error: err.message || String(err) };
    }
  }

  async function testNeon() {
    const start = performance.now();
    if (neonHttpEndpoint && neonHttpEndpoint.startsWith('http')) {
      try {
        const resp = await fetch(neonHttpEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'SELECT 1 as ping' })
        });
        const latency = Math.round(performance.now() - start);
        if (resp.ok) return { ok: true, mode: 'Neon Serverless HTTP', latency };
        return { ok: false, error: `Neon HTTP returned ${resp.status}` };
      } catch (err) {
        return { ok: false, error: err.message || String(err) };
      }
    }
    // Sandbox Store test
    const count = sandboxStore.getTable('schedules').length;
    const latency = Math.round(performance.now() - start);
    return { ok: true, mode: 'Built-in CCAC Fixture Pack', latency, count };
  }

  // Proxy wrapper around supabase client
  const clientProxy = new Proxy(realSupabaseClient, {
    get(target, prop) {
      if (prop === 'from') {
        return (tableName) => {
          if (activeEnv === 'sandbox') {
            return new SandboxQueryBuilder(sandboxStore, tableName);
          }
          return target.from(tableName);
        };
      }
      if (prop === 'rpc') {
        return async (funcName, params) => {
          if (activeEnv === 'sandbox') {
            return sandboxStore.executeRpc(funcName, params);
          }
          return target.rpc(funcName, params);
        };
      }
      return target[prop];
    }
  });

  return {
    getEnvironment,
    setEnvironment,
    updateEnvironmentUI,
    testSupabase,
    testNeon,
    getClient: () => clientProxy,
    getSandboxStore: () => sandboxStore,
    getConfig: () => ({ supabaseUrl, supabaseKey, neonDbUrl, neonHttpEndpoint, sandboxMode }),
    saveConfig: (cfg) => {
      if (cfg.supabaseUrl) { supabaseUrl = cfg.supabaseUrl; localStorage.setItem('worksync.supabase_url', cfg.supabaseUrl); }
      if (cfg.supabaseKey) { supabaseKey = cfg.supabaseKey; localStorage.setItem('worksync.supabase_key', cfg.supabaseKey); }
      if (cfg.neonDbUrl !== undefined) { neonDbUrl = cfg.neonDbUrl; localStorage.setItem('worksync.neon_db_url', cfg.neonDbUrl); }
      if (cfg.neonHttpEndpoint !== undefined) { neonHttpEndpoint = cfg.neonHttpEndpoint; localStorage.setItem('worksync.neon_http_endpoint', cfg.neonHttpEndpoint); }
      if (cfg.sandboxMode) { sandboxMode = cfg.sandboxMode; localStorage.setItem('worksync.sandbox_mode', cfg.sandboxMode); }
      realSupabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    }
  };
})();

const SUPABASE_URL = "https://zjlauzyixseebifyvvvz.supabase.co";
const SUPABASE_KEY = "sb_publishable_cFJ4HQ5nSa3T5GDYJl56sw_OUpXHF7l";
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_KEY = SUPABASE_KEY;
// Authentication and production data use the canonical Supabase client directly.
// Do not route Supabase Auth through the legacy database proxy or saved environment overrides.
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});
window.sb = sb;
</script>
