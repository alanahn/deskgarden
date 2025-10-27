export function stripFences(raw: string): string {
  if (!raw) return "";
  let text = raw.replace(/^\uFEFF/, "").trim();

  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  if (text.startsWith("```")) {
    text = text.replace(/^```.*?\n/, "");
  }
  if (text.endsWith("```")) {
    text = text.replace(/```$/, "");
  }

  return text.trim();
}

export type SafeParseResult<T> =
  | { ok: true; data: T; rawHead: string }
  | { ok: false; error: string; rawHead: string };

function extractFirstObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      depth += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
      continue;
    }
  }

  return depth === 0 ? text.slice(start) : null;
}

export function safeParseJson<T>(raw: string): SafeParseResult<T> {
  const stripped = stripFences(String(raw ?? ""));
  const candidate = extractFirstObject(stripped);
  if (!candidate) {
    return { ok: false, error: "JSON_OUTER_NOT_FOUND", rawHead: stripped.slice(0, 300) };
  }

  try {
    const data = JSON.parse(candidate) as T | null | undefined;
    if (!data || typeof data !== "object" || data === null) {
      return { ok: false, error: "JSON_OUTER_NOT_FOUND", rawHead: candidate.slice(0, 300) };
    }
    if (!("consultation" in data)) {
      return { ok: false, error: "JSON_OUTER_NOT_FOUND", rawHead: candidate.slice(0, 300) };
    }
    return { ok: true, data, rawHead: candidate.slice(0, 300) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message || "JSON_PARSE_ERROR", rawHead: candidate.slice(0, 300) };
  }
}
