export function getOrigin(request: Request): string {
  const headers = request.headers;
  
  // Check standard proxy headers
  const forwardedHost = headers.get("x-forwarded-host");
  const forwardedProto = headers.get("x-forwarded-proto");

  if (forwardedHost) {
    // x-forwarded-host can be comma-separated, take the first one
    const host = forwardedHost.split(",")[0]?.trim() ?? forwardedHost;
    const proto = forwardedProto?.split(",")[0]?.trim() ?? "https";
    return `${proto}://${host}`;
  }

  // Fallback to Host header if available
  const host = headers.get("host");
  if (host) {
    // Assume https for production, http for localhost unless detected otherwise
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const proto = forwardedProto ?? (process.env.NODE_ENV === "production" && !isLocal ? "https" : "http");
    return `${proto}://${host}`;
  }

  // Final fallback to request.url
  return new URL(request.url).origin;
}
