export function parsePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value
      .replace(/[^\d.\-]/g, "")
      .replace(/^\./, "0.");

    if (!cleaned || cleaned === "-" || cleaned === ".") {
      return null;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

