/**
 * server.js — Express backend for the portfolio contact form.
 *
 * Start with:   node server.js
 * Or via npm:   npm start
 *
 * Requires a .env file (copy from .env.example) with SMTP credentials.
 */

"use strict";

const express    = require("express");
const nodemailer = require("nodemailer");
const cors       = require("cors");
const path       = require("path");
require("dotenv").config();

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ─────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));   /* serve index.html, style.css, main.js */

/* ── Simple in-memory rate limiter for /api/contact ─────────── */
const RATE_WINDOW_MS  = 15 * 60 * 1000; /* 15 minutes */
const RATE_MAX        = 5;               /* max 5 requests per window per IP */
const rateMap         = new Map();       /* ip → { count, resetAt } */

function contactRateLimit(req, res, next) {
  const ip  = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  const now = Date.now();
  const rec = rateMap.get(ip);

  if (!rec || now > rec.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return next();
  }

  if (rec.count >= RATE_MAX) {
    const retryAfter = Math.ceil((rec.resetAt - now) / 1000);
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  rec.count += 1;
  return next();
}

/* ── Nodemailer transporter ─────────────────────────────────── */
function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || "smtp.gmail.com",
    port:   parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/* ── Validation helpers ────────────────────────────────────── */
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  const atIdx = trimmed.indexOf("@");
  if (atIdx <= 0) return false;                     /* must have chars before @ */
  if (atIdx === trimmed.length - 1) return false;   /* must have chars after @ */
  const domain = trimmed.slice(atIdx + 1);
  return domain.includes(".") && !domain.endsWith(".");
}

function validateContactInput(name, email, message) {
  const errors = [];
  if (!name    || typeof name    !== "string" || name.trim().length    < 2)  errors.push("Name must be at least 2 characters.");
  if (!isValidEmail(email))                                                  errors.push("A valid email address is required.");
  if (!message || typeof message !== "string" || message.trim().length < 10) errors.push("Message must be at least 10 characters.");
  return errors;
}

/* ── POST /api/contact ──────────────────────────────────────── */
app.post("/api/contact", contactRateLimit, async (req, res) => {
  const { name, email, message } = req.body || {};

  /* Validate */
  const errors = validateContactInput(name, email, message);
  if (errors.length) {
    return res.status(400).json({ error: errors.join(" ") });
  }

  /* Guard: require SMTP credentials */
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("SMTP credentials not configured.");
    return res.status(503).json({ error: "Email service is not configured on the server." });
  }

  try {
    const transporter = createTransporter();

    const recipient = process.env.RECIPIENT_EMAIL || process.env.EMAIL_USER;

    await transporter.sendMail({
      from:    `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to:      recipient,
      replyTo: email.trim(),
      subject: `New message from ${name.trim()} via Portfolio`,
      text: [
        `Name:    ${name.trim()}`,
        `Email:   ${email.trim()}`,
        ``,
        `Message:`,
        message.trim(),
      ].join("\n"),
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px">
          <h2 style="margin:0 0 16px;color:#03045e">New Portfolio Message</h2>
          <p><strong>Name:</strong> ${escapeHtml(name.trim())}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email.trim())}">${escapeHtml(email.trim())}</a></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
          <p style="white-space:pre-wrap;color:#374151">${escapeHtml(message.trim())}</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: "Message sent successfully." });
  } catch (err) {
    console.error("Nodemailer error:", err);
    return res.status(500).json({ error: "Failed to send email. Please try again later." });
  }
});

/* ── Health check ───────────────────────────────────────────── */
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

/* express.static above handles serving index.html for GET /
   No catch-all needed for this single-page site. */

/* ── Start ──────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
});

/* ── Utility ────────────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#39;");
}

module.exports = app; /* for testing */
