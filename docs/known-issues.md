# Known Issues

## Notion OAuth on iOS

Date: 2026-06-06  
Updated: 2026-08-15  
Status: **Resolved** (iOS PWA via Safari handoff)

### Symptom

Notion OAuth opens Notion app instead of web page when started from an iOS home-screen PWA.

### Investigation

- redirect_uri verified
- OAuth URL verified
- issue disappears after reinstalling Notion app
- root cause: iOS Universal Link / PWA in-app browser context (not OAuth misconfiguration)

### Conclusion

The Notion native app intercepts OAuth URLs opened inside an iOS standalone PWA. Safari and desktop browsers are unaffected in most cases.

### Resolution (Daily Set)

iOS standalone PWA uses a **Safari handoff flow** instead of opening `/api/notion/auth` directly:

1. PWA creates an opaque handoff ID (`POST /api/notion/oauth-handoff`)
2. PWA opens `/notion/connect`, which launches Safari via `x-safari-https://`
3. OAuth + DB selection complete in Safari
4. User returns to the PWA; `/notion/connect` polls until `dbConnected === true`

See:

- `docs/notion_oauth_pwa_handoff.md` — pattern reference
- `docs/ios-notion-oauth-handoff/checkpoint.md` — implementation notes

### Legacy workaround (no longer recommended)

Reinstall Notion app — only helped reset Universal Link state; does not fix PWA cookie/session separation.
