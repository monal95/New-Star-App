const http = require("http");

function testAPI(orderId) {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:5000/api/workAssignments/available-items/${orderId}`;

    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

// Test the first order
testAPI(1)
  .then((result) => {
    console.log("\n✅ API Response for Order ID 1:\n");
    console.log(JSON.stringify(result, null, 2));

    console.log("\n🔍 Summary:");
    if (result.items && result.items.length > 0) {
      result.items.forEach((item) => {
        console.log(
          `  - ${item.itemType}: ${item.remainingQty} remaining (out of ${item.totalQty} total)`,
        );
      });
      console.log("\n✅ BACKEND IS WORKING! Items have correct quantities.");
    } else {
      console.log("\n⚠️  No items with remaining quantity found.");
    }
  })
  .catch((err) => {
    console.error("\n❌ API Error:", err.message);
    console.error("Make sure the backend is running on port 5000");
  });
