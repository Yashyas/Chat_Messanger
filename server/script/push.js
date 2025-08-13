const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");


const MONGO_URI = "mongodb+srv://admin:admin@todo.l6eu346.mongodb.net/";
const DB_NAME = "whatsapp";
const COLLECTION_NAME = "messages";
const PAYLOADS_FOLDER = "./payloads"; // where JSON files are stored

async function processPayloads() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const files = fs.readdirSync(PAYLOADS_FOLDER).filter(f => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(PAYLOADS_FOLDER, file);
      const rawData = fs.readFileSync(filePath, "utf-8");
      const payload = JSON.parse(rawData);

      const entry = payload.metaData?.entry?.[0];
      const change = entry?.changes?.[0]; 
      const value = change?.value;

      if (!value) {
        console.warn(`⚠️ Skipping invalid payload: ${file}`);
        continue;
      }

      // ---- Insert new messages ----
      if (value.messages) {
        for (const msg of value.messages) {
          const messageId = msg.id || msg.meta_msg_id;
          const existing = await collection.findOne({ messageId });

          if (!existing) {
            const contactName = value.contacts?.[0]?.profile?.name || null;
            await collection.insertOne({
              messageId,
              from: msg.from,
              to: value.metadata?.display_phone_number,
              contactName,
              timestamp: msg.timestamp,
              type: msg.type,
              text: msg.text?.body || null,
              status: "sent", // default on creation
              rawPayload: payload
            });
            console.log(`📩 Inserted new message: ${messageId}`);
          } else {
            console.log(`ℹ️ Message already exists: ${messageId}`);
          }
        }
      }

      // ---- Update statuses ----
      if (value.statuses) {
        for (const status of value.statuses) {
          const messageId = status.id || status.meta_msg_id;
          const newStatus = status.status;

          const updateRes = await collection.updateOne(
            { messageId },
            { $set: { status: newStatus, statusTimestamp: status.timestamp } }
          );

          if (updateRes.modifiedCount > 0) {
            console.log(`✅ Updated ${messageId} → ${newStatus}`);
          } else {
            console.warn(`⚠️ No matching message for status: ${messageId}`);
          }
        }
      }
    }

    console.log("🎯 Processing complete");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

processPayloads();
