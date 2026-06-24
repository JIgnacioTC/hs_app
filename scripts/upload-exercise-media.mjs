#!/usr/bin/env node
/**
 * Sube media del dataset a Supabase Storage (upload estándar, no TUS del dashboard).
 *
 * Requisitos:
 *   - .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 *   - data/exercises-dataset/ clonado o con images/ y videos/
 *
 * Uso:
 *   node scripts/upload-exercise-media.mjs              # JPG + GIF
 *   node scripts/upload-exercise-media.mjs --images-only
 *   node scripts/upload-exercise-media.mjs --videos-only
 *   node scripts/upload-exercise-media.mjs --limit 10   # prueba
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) {
    console.error("Falta .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const text = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function mimeFor(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".gif") return "image/gif";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".mp4") return "video/mp4";
  return "application/octet-stream";
}

async function uploadDir(supabase, bucket, dir, limit) {
  if (!existsSync(dir)) {
    console.warn(`No existe: ${dir}`);
    return { ok: 0, fail: 0 };
  }

  const files = readdirSync(dir).filter((f) => !f.startsWith("."));
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < files.length; i++) {
    if (limit != null && i >= limit) break;
    const fileName = files[i];
    const filePath = path.join(dir, fileName);
    const body = readFileSync(filePath);

    const { error } = await supabase.storage.from(bucket).upload(fileName, body, {
      contentType: mimeFor(fileName),
      upsert: true,
      cacheControl: "31536000",
    });

    if (error) {
      console.error(`✗ ${fileName}: ${error.message}`);
      fail++;
    } else {
      console.log(`✓ ${bucket}/${fileName}`);
      ok++;
    }
  }

  return { ok, fail };
}

async function main() {
  const args = process.argv.slice(2);
  const imagesOnly = args.includes("--images-only");
  const videosOnly = args.includes("--videos-only");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : null;

  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const datasetRoot = path.join(root, "data/exercises-dataset");
  const imagesDir = path.join(datasetRoot, "images");
  const videosDir = path.join(datasetRoot, "videos");

  let totalOk = 0;
  let totalFail = 0;

  if (!videosOnly) {
    console.log("\n→ Subiendo JPG a bucket images…");
    const r = await uploadDir(supabase, "images", imagesDir, limit);
    totalOk += r.ok;
    totalFail += r.fail;
  }

  if (!imagesOnly) {
    console.log("\n→ Subiendo GIF a bucket images (misma convención que la app)…");
    const r = await uploadDir(supabase, "images", videosDir, limit);
    totalOk += r.ok;
    totalFail += r.fail;
  }

  console.log(`\nListo: ${totalOk} ok, ${totalFail} errores`);
  if (totalFail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
