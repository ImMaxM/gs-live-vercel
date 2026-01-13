import { registry } from "~/lib/metrics";

const METRICS_USERNAME = process.env.METRICS_USERNAME;
const METRICS_PASSWORD = process.env.METRICS_PASSWORD;

export async function GET(request: Request): Promise<Response> {
  // Basic auth check if credentials are configured
  if (METRICS_USERNAME && METRICS_PASSWORD) {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Basic ")) {
      return new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Metrics"' },
      });
    }

    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, "base64").toString();
    const [username, password] = credentials.split(":");

    if (username !== METRICS_USERNAME || password !== METRICS_PASSWORD) {
      return new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Metrics"' },
      });
    }
  }

  const metrics = await registry.metrics();

  return new Response(metrics, {
    headers: {
      "Content-Type": registry.contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
