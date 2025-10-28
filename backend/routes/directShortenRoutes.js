import express from "express";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import ShortUrl from "../models/ShortUrl.js";
import { bucket } from "../config/storage.js";

const router = express.Router();

// ✅ Create a short URL for a file
router.post("/", async (req, res) => {
  const { url, fileName } = req.body;
  if (!url) return res.status(400).json({ error: "File URL is required" });

  try {
    const code = uuidv4().slice(0, 6);
    const short = new ShortUrl({ code, originalUrl: url, fileName });
    await short.save();

    const shortUrl = `${process.env.BASE_URL || "http://localhost:4000"}/d/${code}`;
    res.json({ shortUrl });
  } catch (err) {
    console.error("Shorten error:", err.message);
    res.status(500).json({ error: "Failed to shorten URL" });
  }
});

// ✅ Stream file directly (no redirect)
router.get("/:code", async (req, res) => {
  try {
    const short = await ShortUrl.findOne({ code: req.params.code });
    if (!short) return res.status(404).send("Invalid download link");

    const fileUrl = short.originalUrl;

    // Extract file path from Google Cloud Storage URL
    const match = fileUrl.match(/mahindra_adbee_strg\/(.+)\?/);
    if (!match) return res.status(400).send("Invalid file path");

    const filePath = decodeURIComponent(match[1]);
    const file = bucket.file(filePath);

    // ✅ Stream file from GCS directly
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${short.fileName || filePath.split("/").pop()}"`
    );
    res.setHeader("Content-Type", "application/octet-stream");

    file.createReadStream()
      .on("error", (err) => {
        console.error("Download error:", err);
        res.status(500).send("File not found or access error");
      })
      .pipe(res);
  } catch (err) {
    console.error("Stream error:", err);
    res.status(500).send("Server error");
  }
});

export default router;
