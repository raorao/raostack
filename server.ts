import { serve } from "https://deno.land/std@0.220.1/http/server.ts";

const kv = await Deno.openKv();
const START_TIME = Date.now();

// Helper function to calculate percentiles
function calculatePercentile(numbers: number[], percentile: number): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

async function recordLatency(latencyMs: number) {
  const now = Date.now();
  const timeWindow = now - (5 * 60 * 1000); // Last 5 minutes

  // Store latency with timestamp as key
  await kv.set(["latency", now.toString()], latencyMs);

  // Cleanup old entries (optional)
  const oldEntries = kv.list({ prefix: ["latency"], end: ["latency", timeWindow.toString()] });
  for await (const entry of oldEntries) {
    await kv.delete(entry.key);
  }
}

async function getMetrics() {
  const latencies: number[] = [];
  const entries = kv.list({ prefix: ["latency"] });
  for await (const entry of entries) {
    latencies.push(entry.value as number);
  }

  const avg = latencies.length
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : 0;

  return {
    latency: {
      avg_ms: avg.toFixed(2),
      p50_ms: latencies.length ? calculatePercentile(latencies, 50).toFixed(2) : "0.00",
      p95_ms: latencies.length ? calculatePercentile(latencies, 95).toFixed(2) : "0.00",
      p99_ms: latencies.length ? calculatePercentile(latencies, 99).toFixed(2) : "0.00",
      samples: latencies.length,
    },
    uptime: {
      seconds: Math.floor((Date.now() - START_TIME) / 1000),
    },
    system: {
      memory: Deno.memoryUsage(),
      cpu_count: navigator.hardwareConcurrency,
    }
  };
}

const handler = async (request: Request): Promise<Response> => {
  const requestStart = Date.now();
  const url = new URL(request.url);

  try {
    switch (url.pathname) {
      case "/":
        return new Response("Welcome to high-performance Deno server!", {
          headers: { "content-type": "text/plain" },
        });

      case "/metrics":
        const metrics = await getMetrics();
        return new Response(JSON.stringify(metrics, null, 2), {
          headers: { "content-type": "application/json" },
        });

      default:
        return new Response("Not Found", { status: 404 });
    }
  } finally {
    // Record latency for all requests
    const latency = Date.now() - requestStart;
    await recordLatency(latency);
  }
};

serve(handler, { port: Deno.env.get("PORT") || 8000 });