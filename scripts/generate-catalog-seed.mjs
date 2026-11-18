#!/usr/bin/env node
/**
 * Generates an idempotent SQL seed file (`supabase/seed_catalog_components.sql`)
 * from the static TypeScript registries in `src/data/registry/`.
 *
 * Usage: node scripts/generate-catalog-seed.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const SOURCES = [
  { file: "src/data/registry/aws.ts", provider: "aws" },
  { file: "src/data/registry/gcp.ts", provider: "gcp" },
  { file: "src/data/registry/azure.ts", provider: "azure" },
  { file: "src/data/registry/other.ts", provider: "generic" },
];

const ENTRY_RE =
  /\{\s*subtype:\s*['"]([^'"]+)['"]\s*,\s*label:\s*['"]([^'"]+)['"]\s*,\s*category:\s*['"]([^'"]+)['"]\s*,\s*icon:\s*['"]([^'"]+)['"]\s*,\s*description:\s*['"]([^'"]*)['"](?:\s*,\s*technology:\s*['"]([^'"]*)['"])?\s*,?\s*\}/g;

function sqlEscape(str) {
  return String(str ?? "").replace(/'/g, "''");
}

function buildTags(item) {
  const raw = [
    item.provider,
    item.category,
    ...item.subtype.split(/[-_]+/),
    ...item.label.toLowerCase().split(/[\s/(),-]+/),
  ]
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 2 && t !== "generic");
  return [...new Set(raw)];
}

const bySubtype = new Map();

for (const src of SOURCES) {
  const fullPath = path.join(rootDir, src.file);
  const content = fs.readFileSync(fullPath, "utf8");
  let match;
  while ((match = ENTRY_RE.exec(content)) !== null) {
    const [, subtype, label, category, icon, description, technology] = match;
    if (!bySubtype.has(subtype)) {
      bySubtype.set(subtype, {
        subtype,
        label,
        category,
        provider: src.provider,
        icon,
        description,
        technology: technology || null,
      });
    }
  }
}

const items = [...bySubtype.values()];

const rows = items.map((item, idx) => {
  const tags = buildTags(item)
    .map((t) => `'${sqlEscape(t)}'`)
    .join(", ");
  const techVal = item.technology ? `'${sqlEscape(item.technology)}'` : "null";
  return `  ('${sqlEscape(item.subtype)}', '${sqlEscape(item.label)}', '${sqlEscape(item.category)}', '${sqlEscape(item.provider)}', '${sqlEscape(item.icon)}', '${sqlEscape(item.description)}', ${techVal}, array[${tags}]::text[], true, ${idx})`;
});

const sql = `-- Auto-generated from src/data/registry/*.ts (${items.length} components)
-- Run after 20261118_catalog_components.sql in Supabase SQL Editor.

insert into public.catalog_components (
  subtype,
  label,
  category,
  provider,
  icon,
  description,
  default_technology,
  tags,
  is_active,
  sort_order
)
values
${rows.join(",\n")}
on conflict (subtype) do update set
  label = excluded.label,
  category = excluded.category,
  provider = excluded.provider,
  icon = excluded.icon,
  description = excluded.description,
  default_technology = excluded.default_technology,
  tags = excluded.tags,
  sort_order = excluded.sort_order;
`;

const outPath = path.join(rootDir, "supabase", "seed_catalog_components.sql");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, sql, "utf8");

console.log(`Generated ${outPath} with ${items.length} components.`);
