import { Capacitor } from '@capacitor/core'

/**
 * URL the backend redirects to after OAuth (Google/GitHub), with ?oauth_token= or ?oauth_error=.
 *
 * - Web: current page origin + path (usually /login).
 * - Native: default `com.quantdinger.mobile://login` — must be listed in backend
 *   `OAUTH_ALLOWED_REDIRECTS` (or equivalent). No change needed in Google/GitHub
 *   cloud consoles for the *provider* callback; only the final redirect is validated by your API.
 *
 * Optional override (same build, different servers): set in DevTools or once in code:
 *   localStorage.setItem('oauthRedirectUri', 'https://localhost/login')
 */
export function getOAuthRedirectUri() {
  if (!Capacitor.isNativePlatform()) {
    return `${window.location.origin}${window.location.pathname}`
  }
  const override = localStorage.getItem('oauthRedirectUri')?.trim()
  if (override) return override
  return 'com.quantdinger.mobile://login'
}

/**
 * @param {string} url appUrlOpen / getLaunchUrl payload
 * @returns {{ oauth_token?: string, oauth_error?: string } | null}
 */
export function parseOAuthReturnUrl(url) {
  if (!url || typeof url !== 'string') return null
  try {
    const noHash = url.split('#')[0]
    const qIndex = noHash.indexOf('?')
    const search = qIndex >= 0 ? noHash.slice(qIndex + 1) : ''
    const params = new URLSearchParams(search)
    const oauth_token = params.get('oauth_token')
    const oauth_error = params.get('oauth_error')
    if (oauth_token || oauth_error) return { oauth_token, oauth_error }
  } catch (_) {
    /* fall through */
  }
  const t = url.match(/[?&#]oauth_token=([^&#]+)/)
  const e = url.match(/[?&#]oauth_error=([^&#]+)/)
  if (t || e) {
    return {
      oauth_token: t ? decodeURIComponent(t[1]) : undefined,
      oauth_error: e ? decodeURIComponent(e[1]) : undefined
    }
  }
  return null
}
