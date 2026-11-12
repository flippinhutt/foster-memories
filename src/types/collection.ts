export interface Collection {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
}

/** One memory in one collection. */
export interface CollectionLink {
  collectionId: string;
  memoryId: string;
  sortOrder: number;
}
