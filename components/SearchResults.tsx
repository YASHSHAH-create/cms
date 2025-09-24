'use client';

import React from 'react';
import { SearchResult, SearchableVisitor } from '@/utils/searchUtils';

interface SearchResultsProps {
  results: SearchResult<SearchableVisitor>[];
  searchTerm: string;
  onResultClick?: (visitor: SearchableVisitor) => void;
  showScores?: boolean;
  maxResults?: number;
}

export default function SearchResults({
  results,
  searchTerm,
  onResultClick,
  showScores = false,
  maxResults = 10
}: SearchResultsProps) {
  if (!searchTerm || results.length === 0) {
    return null;
  }

  const displayResults = results.slice(0, maxResults);

  const highlightText = (text: string, searchTerm: string) => {
    if (!text || !searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      organization: 'Organization',
      region: 'Region',
      service: 'Service',
      subservice: 'Subservice',
      agentName: 'Agent',
      salesExecutiveName: 'Sales Executive',
      status: 'Status',
      enquiryDetails: 'Enquiry Details',
      comments: 'Comments',
      source: 'Source'
    };
    return labels[field] || field;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">
          Search Results ({results.length} found)
        </h3>
        {showScores && (
          <span className="text-xs text-gray-500">
            Sorted by relevance
          </span>
        )}
      </div>

      <div className="space-y-2">
        {displayResults.map((result, index) => (
          <div
            key={result.item._id || index}
            className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onResultClick?.(result.item)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Primary Info */}
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900 truncate">
                    {result.item.name || 'Anonymous'}
                  </span>
                  {result.item.organization && (
                    <span className="text-sm text-gray-500 truncate">
                      • {result.item.organization}
                    </span>
                  )}
                </div>

                {/* Secondary Info */}
                <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
                  {result.item.email && (
                    <span className="truncate">
                      {highlightText(result.item.email, searchTerm)}
                    </span>
                  )}
                  {result.item.phone && (
                    <span className="truncate">
                      {highlightText(result.item.phone, searchTerm)}
                    </span>
                  )}
                  {result.item.service && (
                    <span className="truncate">
                      {highlightText(result.item.service, searchTerm)}
                    </span>
                  )}
                </div>

                {/* Matched Fields */}
                {result.matchedFields.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {result.matchedFields.slice(0, 3).map((field) => (
                      <span
                        key={field}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {getFieldLabel(field)}
                      </span>
                    ))}
                    {result.matchedFields.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{result.matchedFields.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Status and Score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {result.item.status && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {result.item.status.replace(/_/g, ' ')}
                      </span>
                    )}
                    {result.item.region && (
                      <span className="text-xs text-gray-500">
                        {result.item.region}
                      </span>
                    )}
                  </div>
                  
                  {showScores && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(result.score)}`}>
                      {result.score.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length > maxResults && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Showing {maxResults} of {results.length} results
          </p>
        </div>
      )}
    </div>
  );
}
