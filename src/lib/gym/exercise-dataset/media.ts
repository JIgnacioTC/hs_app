/** Pinned ref for stable CDN URLs (hasaneyldrm/exercises-dataset). */
export const DATASET_CDN_BASE =
  "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main";

export function datasetMediaUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath?.trim()) return null;
  const path = relativePath.replace(/^\//, "");
  return `${DATASET_CDN_BASE}/${path}`;
}
