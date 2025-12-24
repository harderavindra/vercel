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

    // ✅ Determine BASE_URL properly
    const BASE_URL =
      process.env.NODE_ENV === "production"
        ? process.env.BASE_URL || "https://api.adbee.in" // production
        : "http://localhost:4000"; // development

    const shortUrl = `${BASE_URL}/d/${code}`;
    res.json({ shortUrl });
  } catch (err) {
    console.error("Shorten error:", err.message);
    res.status(500).json({ error: "Failed to shorten URL" });
  }
});
// ✅ Stream file directly (no redirect)


router.get("/:code", async (req, res) => {
  const short = await ShortUrl.findOne({ code: req.params.code });
  if (!short) return res.status(404).send("Invalid download link");

  return res.redirect(302, short.originalUrl);
});
export default router;
