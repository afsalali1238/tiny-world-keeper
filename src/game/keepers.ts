// Cross-run echoes. Past keepers persisted in localStorage, outside zustand,
// so they survive a full reset of the world.

const KEY = "terrarium:keepers";
const MAX = 12;

export function rememberKeeper(name: string) {
  const clean = name.trim();
  if (!clean) return;
  const list = loadKeepers();
  // dedupe most-recent-wins
  const without = list.filter((n) => n.toLowerCase() !== clean.toLowerCase());
  without.unshift(clean);
  try {
    localStorage.setItem(KEY, JSON.stringify(without.slice(0, MAX)));
  } catch {
    // ignore quota errors
  }
}

export function loadKeepers(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n) => typeof n === "string");
  } catch {
    return [];
  }
}

export function priorKeeper(currentName: string): string | null {
  const list = loadKeepers().filter(
    (n) => n.toLowerCase() !== currentName.trim().toLowerCase(),
  );
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}
