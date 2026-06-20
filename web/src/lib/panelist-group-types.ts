import type { SampleFilters } from "./admin-sample-selection";

export type PanelistGroupType = "static" | "filter";

export interface PanelistGroup {
  id: string;
  name: string;
  description: string;
  type: PanelistGroupType;
  emails?: string[];
  filters?: SampleFilters;
  createdAt: string;
  updatedAt: string;
}
