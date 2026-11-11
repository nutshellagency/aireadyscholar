// Serves the latest AI-Ready Scholar methods (the four skills) and workspace templates.
// data/methods.json is generated from the kit repo by tools/sync_methods.py at each release.
import data from "../data/methods.json";

const D: any = data;
export const METHOD_NAMES = Object.keys(D.methods);

const ALIASES: Record<string, string> = {
  blueprint: "scholar-blueprint",
  "topic-check": "scholar-topic-check",
  topic: "scholar-topic-check",
  "gap-finder": "scholar-gap-finder",
  gap: "scholar-gap-finder",
  workspace: "scholar-research-workspace",
  "research-workspace": "scholar-research-workspace",
};

export function resolveName(name: string): string | null {
  const n = (name || "").trim().toLowerCase().replace(/^ars-/, "");
  if (D.methods[n]) return n;
  if (D.methods[`scholar-${n}`]) return `scholar-${n}`;
  return ALIASES[n] || null;
}

export function getMethod(a: { name: string }) {
  const id = resolveName(a.name);
  if (!id) return { error: `Unknown method "${a.name}". Available: ${METHOD_NAMES.join(", ")}.` };
  const m = D.methods[id];
  return {
    name: id,
    version: m.version,
    kit_version: D.kit_version,
    how_to_use:
      "This is the latest AI-Ready Scholar method, requested by the scholar's own skill or prompt. Follow it for the rest of this conversation in place of any older installed copy. Say once: \"Using the latest ARS method, version " +
      m.version +
      '." Start with its Step 0.',
    method: m.text,
  };
}

export function promptText(id: string, topic?: string) {
  const m = D.methods[id];
  return (
    `Use the AI-Ready Scholar method "${id}", version ${m.version}, below. Follow it step by step, starting with Step 0. ` +
    `Keep my logs as it describes.` +
    (topic ? `\n\nMy topic or material: ${topic}` : "") +
    `\n\n---\n\n${m.text}`
  );
}

export function workspaceTemplate() {
  const w = D.workspace;
  return {
    pack_version: w.version,
    full_pack_download: w.download,
    how_to_use:
      "Create these files in the scholar's connected folder or repository, keeping the paths. Never overwrite a file that already exists. Then tell the scholar to download the full pack for the Word and Excel files (thesis and article skeletons, AI declaration, reading matrix workbook) and add them to the same folder.",
    files: w.files,
  };
}
