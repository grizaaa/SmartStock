const { MongoClient } = require("mongodb");

async function updateField() {
  const uri = "mongodb://localhost:27017/printec";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("printec");
    const collection = database.collection("item_master");

    // Update all documents: rename "item_code" to "part_number"
    const result = await collection.updateMany(
      {},
      { $rename: { item_code: "part_number" } }
    );

    console.log(`${result.modifiedCount} documents were updated.`);
  } finally {
    await client.close();
  }
}

updateField().catch(console.error);
