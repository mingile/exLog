# Known Issues

## Notion OAuth on iOS

Date: 2026-06-06

### Symptom

Notion OAuth opens Notion app instead of web page.

### Investigation

- redirect_uri verified
- OAuth URL verified
- issue disappears after reinstalling Notion app

### Conclusion

Likely caused by iOS Universal Link state.

### Workaround

Reinstall Notion app.
