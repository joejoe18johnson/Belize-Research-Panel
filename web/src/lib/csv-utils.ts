export function escapeCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function rowsToCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }
  return lines.join("\n");
}

export function csvSection(title: string, headers: string[], rows: unknown[][]): string {
  const headerLine = `# ${title}`;
  if (rows.length === 0) {
    return `${headerLine}\n${headers.map(escapeCsvCell).join(",")}\n`;
  }
  return `${headerLine}\n${rowsToCsv(headers, rows)}\n`;
}

export function withCsvBom(content: string): string {
  return `\uFEFF${content}`;
}
