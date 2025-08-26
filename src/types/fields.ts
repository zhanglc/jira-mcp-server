export interface JiraField {
  id: string;
  key: string;
  name: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames: string[];
  schema: FieldSchema;
}

export interface FieldSchema {
  type: string;
  system?: string;
  items?: string;
  custom?: string;
  customId?: number;
}
