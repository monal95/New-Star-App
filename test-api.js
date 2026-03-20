// Test the available-items endpoint
const http = require("http");

// Test with order ID 1
const testUrl = "http://localhost:5000/api/workAssignments/available-items/1";

console.log(`Testing: ${testUrl}\n`);

http
  .get(testUrl, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        const parsed = JSON.parse(data);
        console.log("SUCCESS! Response:");
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log("Response:", data);
      }
    });
  })
  .on("error", (err) => {
    console.error("ERROR:", err.message);
  });
