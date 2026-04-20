/** Injected by Vite `define` from package.json version */
export const APP_BUILD_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'

/** Compare semver-like a.b.c; true if remote > local */
export function isRemoteVersionNewer(remote, local) {
  const r = String(remote || '').trim()
  const l = String(local || '').trim()
  if (!r || !l) return false
  const pa = r.split('.').map((x) => parseInt(x, 10) || 0)
  const pb = l.split('.').map((x) => parseInt(x, 10) || 0)
  const n = Math.max(pa.length, pb.length)
  for (let i = 0; i < n; i++) {
    const a = pa[i] || 0
    const b = pb[i] || 0
    if (a > b) return true
    if (a < b) return false
  }
  return false
}
