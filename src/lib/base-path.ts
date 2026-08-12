export const basePath = "/dailyset";

export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === basePath || normalized.startsWith(`${basePath}/`)) {
    return normalized;
  }
  return `${basePath}${normalized}`;
}

export function appRedirectUrl(path: string): URL {
  const origin =
    process.env.APP_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  return new URL(withBasePath(path), origin);
}
