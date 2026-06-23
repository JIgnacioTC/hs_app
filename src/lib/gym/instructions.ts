/** Split catalog instructions into display steps (dataset or local text). */
export function parseInstructionSteps(instructions: string): string[] {
  if (!instructions.trim()) return [];

  const stepParts = instructions
    .split(/(?=Step:\d+\s*)/i)
    .map((part) => part.replace(/^Step:\d+\s*/i, "").trim())
    .filter(Boolean);

  if (stepParts.length > 1) return stepParts;

  const sentences = instructions
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.length > 1 ? sentences.slice(0, 4) : [instructions.trim()];
}

export function titleCaseToken(value: string): string {
  return value
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
