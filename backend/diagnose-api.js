const http = require("http");

// Test multiple endpoints
const endpoints = [
  { url: "http://localhost:5000/api/health", name: "Health Check" },
  { url: "http://localhost:5000/api/orders", name: "Get Orders" },
  {
    url: "http://localhost:5000/api/workAssignments/available-items/1",
    name: "Available Items (Order 1)",
  },
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);

    http
      .get(endpoint.url, (res) => {
        let data = "";

        console.log(`   ✓ Status: ${res.statusCode}`);
        console.log(`   ✓ Content-Type: ${res.headers["content-type"]}`);

        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            console.log(`   ✓ Valid JSON (${Object.keys(json).length} keys)`);
            if (json.error) console.log(`   ⚠️  Error: ${json.error}`);
          } catch (e) {
            console.log(`   ❌ NOT VALID JSON`);
            if (data.includes("<!doctype")) {
              console.log(
                `   ⚠️  HTML RESPONSE DETECTED - API returned web page instead of JSON`,
              );
              console.log(`   📝 First 100 chars: ${data.substring(0, 100)}`);
            } else if (data.length > 0) {
              console.log(`   📝 Response: ${data.substring(0, 200)}`);
            } else {
              console.log(`   📝 Empty response`);
            }
          }
          resolve();
        });
      })
      .on("error", (err) => {
        console.log(`   ❌ Connection Error: ${err.message}`);
        resolve();
      });
  });
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("API Endpoint Diagnostic Test");
  console.log("=".repeat(60));

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Diagnostic Complete");
  console.log("=".repeat(60));

  console.log("\n📋 INTERPRETATION:");
  console.log('If you see "HTML RESPONSE DETECTED":');
  console.log("  1. Backend is running but throwing an error");
  console.log("  2. Check the backend terminal for error messages");
  console.log("  3. The database query might be failing");
  console.log('\nIf you see "Connection Error":');
  console.log("  1. Backend is NOT running on port 5000");
  console.log("  2. Start backend: cd backend && npm start");
}

runTests();
