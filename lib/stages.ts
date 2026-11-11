import stages from "../data/stages.json";

export function stagesMarkdown() {
  const s: any = stages;
  const lines = [`# ARS stage guide: from a broad area to one topic`, ``, `Version ${s.version}, updated ${s.updated}. The scholar decides at every stage; the AI never writes the topic.`, ``];
  for (const st of s.stages) {
    lines.push(`## Stage ${st.stage}: ${st.title}`, ``, `Tool: ${st.tool}`, ``);
    for (const [h, k] of [["Goal, and why", "goal"], ["How to do it", "how"], ["Take care", "care"], ["You leave with", "leave"]] as const) {
      lines.push(`**${h}**`, ...st[k].map((x: string) => `- ${x}`), ``);
    }
    lines.push(`**Type:** ${st.prompt}`, ``);
  }
  return lines.join("\n");
}

