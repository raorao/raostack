// support --local flag which sets the target URL to http://localhost:8000
const TARGET_URL = Deno.args.includes("--local")
  ? "http://localhost:8000"
  : "https://raostack.deno.dev";
const REQUESTS = 50;
const latencies: number[] = [];

async function runLatencyTest() {
  for (let i = 0; i < REQUESTS; i++) {
    const start = performance.now();
    await fetch(TARGET_URL);
    const end = performance.now();
    const latency = end - start;
    latencies.push(latency);
    console.log(`Request ${i + 1}: ${latency.toFixed(0)}ms`);
  }

  // Sort latencies for percentile calculations
  latencies.sort((a, b) => a - b);

  const sum = latencies.reduce((acc, val) => acc + val, 0);
  const avg = sum / REQUESTS;
  const p75 = latencies[Math.floor(REQUESTS * 0.75)];
  const p90 = latencies[Math.floor(REQUESTS * 0.90)];
  const p99 = latencies[Math.floor(REQUESTS * 0.99)];

  console.log("\nSummary:");
  console.log(`Average latency: ${avg.toFixed(0)}ms`);
  console.log(`75th percentile: ${p75.toFixed(0)}ms`);
  console.log(`90th percentile: ${p90.toFixed(0)}ms`);
  console.log(`99th percentile: ${p99.toFixed(0)}ms`);
  console.log(`Min latency: ${latencies[0].toFixed(0)}ms`);
  console.log(`Max latency: ${latencies[REQUESTS - 1].toFixed(0)}ms`);
}

runLatencyTest();
