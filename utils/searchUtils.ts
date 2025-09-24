/**
 * Enhanced Search Utilities for EMS
 * Provides comprehensive search functionality with fuzzy matching and field prioritization
 */

export interface SearchableVisitor {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  region?: string;
  service?: string;
  subservice?: string;
  enquiryDetails?: string;
  source?: string;
  status?: string;
  agent?: string;
  agentName?: string;
  assignedAgent?: string;
  salesExecutive?: string;
  salesExecutiveName?: string;
  comments?: string;
  createdAt?: string | Date;
  lastInteractionAt?: string | Date;
  isConverted?: boolean;
  amount?: number;
  priority?: string;
  leadScore?: number;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matchedFields: string[];
  exactMatches: string[];
  partialMatches: string[];
}

export interface SearchOptions {
  minScore?: number;
  maxResults?: number;
  includeFields?: string[];
  excludeFields?: string[];
  caseSensitive?: boolean;
}

/**
 * Enhanced search function with fuzzy matching and field prioritization
 */
export function enhancedSearch<T extends SearchableVisitor>(
  items: T[],
  searchTerm: string,
  options: SearchOptions = {}
): SearchResult<T>[] {
  if (!searchTerm || !searchTerm.trim()) {
    return items.map(item => ({
      item,
      score: 0,
      matchedFields: [],
      exactMatches: [],
      partialMatches: []
    }));
  }

  const {
    minScore = 0.1,
    maxResults = 1000,
    includeFields,
    excludeFields = [],
    caseSensitive = false
  } = options;

  const normalizedSearchTerm = caseSensitive ? searchTerm.trim() : searchTerm.trim().toLowerCase();
  const searchWords = normalizedSearchTerm.split(/\s+/).filter(word => word.length > 0);

  // Define searchable fields with their weights (higher = more important)
  const fieldWeights: Record<string, number> = {
    name: 10,
    email: 8,
    phone: 7,
    organization: 6,
    agentName: 5,
    salesExecutiveName: 5,
    service: 4,
    subservice: 4,
    region: 3,
    status: 3,
    enquiryDetails: 2,
    comments: 2,
    source: 1,
    agent: 1,
    assignedAgent: 1,
    salesExecutive: 1
  };

  // Filter fields based on options
  const searchableFields = Object.keys(fieldWeights).filter(field => {
    if (includeFields && !includeFields.includes(field)) return false;
    if (excludeFields.includes(field)) return false;
    return true;
  });

  const results: SearchResult<T>[] = [];

  for (const item of items) {
    const result = calculateSearchScore(
      item,
      normalizedSearchTerm,
      searchWords,
      searchableFields,
      fieldWeights,
      caseSensitive
    );

    if (result.score >= minScore) {
      results.push(result);
    }
  }

  // Sort by score (highest first) and limit results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Calculate search score for a single item
 */
function calculateSearchScore<T extends SearchableVisitor>(
  item: T,
  normalizedSearchTerm: string,
  searchWords: string[],
  searchableFields: string[],
  fieldWeights: Record<string, number>,
  caseSensitive: boolean
): SearchResult<T> {
  let totalScore = 0;
  const matchedFields: string[] = [];
  const exactMatches: string[] = [];
  const partialMatches: string[] = [];

  // Check each field
  for (const field of searchableFields) {
    const fieldValue = getFieldValue(item, field);
    if (!fieldValue) continue;

    const normalizedValue = caseSensitive ? fieldValue : fieldValue.toLowerCase();
    const fieldWeight = fieldWeights[field] || 1;

    // Check for exact match (full search term)
    if (normalizedValue.includes(normalizedSearchTerm)) {
      const exactScore = fieldWeight * 2; // Exact matches get double weight
      totalScore += exactScore;
      matchedFields.push(field);
      exactMatches.push(field);
    } else {
      // Check for partial matches (individual words)
      let wordMatches = 0;
      for (const word of searchWords) {
        if (normalizedValue.includes(word)) {
          wordMatches++;
        }
      }

      if (wordMatches > 0) {
        const partialScore = (fieldWeight * wordMatches) / searchWords.length;
        totalScore += partialScore;
        if (!matchedFields.includes(field)) {
          matchedFields.push(field);
        }
        partialMatches.push(field);
      }
    }
  }

  // Bonus for multiple field matches
  if (matchedFields.length > 1) {
    totalScore *= 1.2;
  }

  // Bonus for exact field matches
  if (exactMatches.length > 0) {
    totalScore *= 1.1;
  }

  return {
    item,
    score: Math.min(totalScore, 100), // Cap at 100
    matchedFields,
    exactMatches,
    partialMatches
  };
}

/**
 * Get field value from item, handling nested properties
 */
function getFieldValue(item: any, field: string): string {
  const value = item[field];
  if (value === null || value === undefined) return '';
  
  // Handle dates
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  // Handle objects (like assignedAgent)
  if (typeof value === 'object') {
    return value.toString();
  }
  
  return String(value);
}

/**
 * Simple search function for backward compatibility
 */
export function simpleSearch<T extends SearchableVisitor>(
  items: T[],
  searchTerm: string,
  fields: string[] = ['name', 'email', 'organization']
): T[] {
  if (!searchTerm || !searchTerm.trim()) {
    return items;
  }

  const normalizedSearchTerm = searchTerm.toLowerCase().trim();
  
  return items.filter(item => {
    return fields.some(field => {
      const value = getFieldValue(item, field);
      return value.toLowerCase().includes(normalizedSearchTerm);
    });
  });
}

/**
 * Search with highlighting - returns items with highlighted matches
 */
export function searchWithHighlighting<T extends SearchableVisitor>(
  items: T[],
  searchTerm: string,
  options: SearchOptions = {}
): Array<SearchResult<T> & { highlightedItem: T }> {
  const results = enhancedSearch(items, searchTerm, options);
  
  return results.map(result => ({
    ...result,
    highlightedItem: highlightMatches(result.item, searchTerm, result.matchedFields)
  }));
}

/**
 * Highlight matches in the item data
 */
function highlightMatches<T extends SearchableVisitor>(
  item: T,
  searchTerm: string,
  matchedFields: string[]
): T {
  const highlighted = { ...item };
  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  for (const field of matchedFields) {
    const value = getFieldValue(item, field);
    if (value && value.toLowerCase().includes(normalizedSearchTerm)) {
      // Add highlighting markers (can be styled with CSS)
      const highlightedValue = value.replace(
        new RegExp(`(${searchTerm})`, 'gi'),
        '<mark>$1</mark>'
      );
      (highlighted as any)[field] = highlightedValue;
    }
  }
  
  return highlighted;
}

/**
 * Get search suggestions based on existing data
 */
export function getSearchSuggestions<T extends SearchableVisitor>(
  items: T[],
  partialTerm: string,
  maxSuggestions: number = 10
): string[] {
  if (!partialTerm || partialTerm.length < 2) {
    return [];
  }

  const suggestions = new Set<string>();
  const normalizedPartial = partialTerm.toLowerCase();

  // Collect suggestions from various fields
  const suggestionFields = ['name', 'email', 'organization', 'service', 'subservice', 'region', 'agentName'];
  
  for (const item of items) {
    for (const field of suggestionFields) {
      const value = getFieldValue(item, field);
      if (value && value.toLowerCase().includes(normalizedPartial)) {
        // Add the full value as a suggestion
        suggestions.add(value);
        
        // Also add individual words that match
        const words = value.split(/\s+/);
        for (const word of words) {
          if (word.toLowerCase().includes(normalizedPartial) && word.length > 2) {
            suggestions.add(word);
          }
        }
      }
    }
  }

  return Array.from(suggestions)
    .sort((a, b) => a.length - b.length) // Shorter matches first
    .slice(0, maxSuggestions);
}

/**
 * Default search fields for visitors
 */
export const DEFAULT_VISITOR_SEARCH_FIELDS = [
  'name',
  'email', 
  'phone',
  'organization',
  'region',
  'service',
  'subservice',
  'agentName',
  'salesExecutiveName',
  'status',
  'enquiryDetails',
  'comments'
];

/**
 * Quick search function for visitors with default fields
 */
export function searchVisitors(
  visitors: SearchableVisitor[],
  searchTerm: string,
  options: SearchOptions = {}
): SearchResult<SearchableVisitor>[] {
  return enhancedSearch(visitors, searchTerm, {
    includeFields: DEFAULT_VISITOR_SEARCH_FIELDS,
    ...options
  });
}
