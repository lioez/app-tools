export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  icon?: string;
  dateAdded?: number;
}

export type Category = string;

export interface AiCategorizationResponse {
  categories: {
    categoryName: string;
    bookmarkIds: string[];
  }[];
}

export const UNCATEGORIZED = "未分类";
export const ALL_BOOKMARKS = "所有书签";