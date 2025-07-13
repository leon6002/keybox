import { PasswordEntry, SearchResult } from "@/types/password";

// 搜索引擎类
export class SearchEngine {
  // 执行全文搜索
  static search(entries: PasswordEntry[], query: string): SearchResult[] {
    if (!query.trim()) {
      return entries.map((entry) => ({
        entry,
        matchedFields: [],
        score: 0,
      }));
    }

    const searchTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);
    const results: SearchResult[] = [];

    entries.forEach((entry) => {
      const searchResult = this.searchEntry(entry, searchTerms);
      if (searchResult.score > 0) {
        results.push(searchResult);
      }
    });

    // 按相关性分数排序
    return results.sort((a, b) => b.score - a.score);
  }

  // 搜索单个条目
  private static searchEntry(
    entry: PasswordEntry,
    searchTerms: string[]
  ): SearchResult {
    const matchedFields: string[] = [];
    let totalScore = 0;

    // 定义搜索字段及其权重
    const searchFields = [
      { field: "title", value: entry.title, weight: 10 },
      { field: "username", value: entry.username, weight: 8 },
      { field: "website", value: entry.website, weight: 6 },
      { field: "description", value: entry.description, weight: 4 },
      { field: "notes", value: entry.notes, weight: 3 },
      { field: "tags", value: entry.tags.join(" "), weight: 5 },
    ];

    // 搜索自定义字段
    entry.customFields.forEach((customField) => {
      searchFields.push({
        field: `custom_${customField.name}`,
        value: `${customField.name} ${customField.value}`,
        weight: 2,
      });
    });

    searchTerms.forEach((term) => {
      searchFields.forEach(({ field, value, weight }) => {
        const fieldValue = value.toLowerCase();
        if (fieldValue.includes(term)) {
          if (!matchedFields.includes(field)) {
            matchedFields.push(field);
          }

          // 计算匹配分数
          const exactMatch = fieldValue === term;
          const startsWith = fieldValue.startsWith(term);
          const wordMatch = fieldValue
            .split(/\s+/)
            .some((word) => word === term);

          let fieldScore = weight;
          if (exactMatch) fieldScore *= 3;
          else if (startsWith) fieldScore *= 2;
          else if (wordMatch) fieldScore *= 1.5;

          totalScore += fieldScore;
        }
      });
    });

    return {
      entry,
      matchedFields,
      score: totalScore,
    };
  }

  // 高亮搜索结果
  static highlightText(text: string, query: string): string {
    if (!query.trim()) return text;

    const searchTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);
    let highlightedText = text;

    searchTerms.forEach((term) => {
      const regex = new RegExp(`(${this.escapeRegExp(term)})`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>'
      );
    });

    return highlightedText;
  }

  // 转义正则表达式特殊字符
  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // 获取搜索建议
  static getSuggestions(
    entries: PasswordEntry[],
    query: string,
    maxSuggestions: number = 5
  ): string[] {
    if (!query.trim()) return [];

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    entries.forEach((entry) => {
      // 从标题获取建议
      if (entry.title.toLowerCase().includes(queryLower)) {
        suggestions.add(entry.title);
      }

      // 从网站获取建议
      if (entry.website.toLowerCase().includes(queryLower)) {
        suggestions.add(entry.website);
      }

      // 从标签获取建议
      entry.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(queryLower)) {
          suggestions.add(tag);
        }
      });

      // 从自定义字段获取建议
      entry.customFields.forEach((field) => {
        if (field.name.toLowerCase().includes(queryLower)) {
          suggestions.add(field.name);
        }
      });
    });

    return Array.from(suggestions)
      .filter((suggestion) => suggestion.toLowerCase() !== queryLower)
      .slice(0, maxSuggestions);
  }

  // 按标签过滤
  static filterByTags(
    entries: PasswordEntry[],
    tags: string[]
  ): PasswordEntry[] {
    if (tags.length === 0) return entries;

    return entries.filter((entry) =>
      tags.some((tag) =>
        entry.tags.some((entryTag) =>
          entryTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
    );
  }

  // 按收藏状态过滤
  static filterByFavorite(
    entries: PasswordEntry[],
    showFavoritesOnly: boolean
  ): PasswordEntry[] {
    if (!showFavoritesOnly) return entries;
    return entries.filter((entry) => entry.isFavorite);
  }

  // 获取所有唯一标签
  static getAllTags(entries: PasswordEntry[]): string[] {
    const allTags = new Set<string>();
    entries.forEach((entry) => {
      entry.tags.forEach((tag) => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }

  // 高级搜索
  static advancedSearch(
    entries: PasswordEntry[],
    filters: {
      query?: string;
      tags?: string[];
      favoritesOnly?: boolean;
      dateRange?: { start: Date; end: Date };
      hasCustomFields?: boolean;
    }
  ): SearchResult[] {
    let filteredEntries = entries;

    // 按标签过滤
    if (filters.tags && filters.tags.length > 0) {
      filteredEntries = this.filterByTags(filteredEntries, filters.tags);
    }

    // 按收藏状态过滤
    if (filters.favoritesOnly) {
      filteredEntries = this.filterByFavorite(filteredEntries, true);
    }

    // 按日期范围过滤
    if (filters.dateRange) {
      filteredEntries = filteredEntries.filter((entry) => {
        const entryDate = new Date(entry.createdAt);
        return (
          entryDate >= filters.dateRange!.start &&
          entryDate <= filters.dateRange!.end
        );
      });
    }

    // 按自定义字段过滤
    if (filters.hasCustomFields) {
      filteredEntries = filteredEntries.filter(
        (entry) => entry.customFields.length > 0
      );
    }

    // 执行文本搜索
    if (filters.query) {
      return this.search(filteredEntries, filters.query);
    }

    return filteredEntries.map((entry) => ({
      entry,
      matchedFields: [],
      score: 0,
    }));
  }
}
