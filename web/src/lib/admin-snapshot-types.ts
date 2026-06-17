export interface AdminCountRow {
  label: string;
  count: number;
  percent: number;
}

export interface AdminMetric {
  label: string;
  value: string | number;
  hint?: string;
}

export interface AdminTableColumn {
  key: string;
  label: string;
  align?: "left" | "right";
}

export interface AdminTableSection {
  id: string;
  title: string;
  columns: AdminTableColumn[];
  rows: Record<string, string | number>[];
  note?: string;
}

export interface AdminChartSection {
  id: string;
  type: "bar" | "donut";
  title: string;
  rows: AdminCountRow[];
}

export interface AdminModuleSnapshot {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  metrics: AdminMetric[];
  charts: AdminChartSection[];
  tables: AdminTableSection[];
  links?: { label: string; href: string }[];
}
