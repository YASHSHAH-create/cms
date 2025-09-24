'use client';

import React, { useState, useEffect } from 'react';
import { searchVisitors, SearchableVisitor, SearchResult } from '@/utils/searchUtils';
import EnhancedSearchInput from './EnhancedSearchInput';
import SearchResults from './SearchResults';

interface EnhancedSearchBarProps {
  visitors: SearchableVisitor[];
  onSearchResults: (results: SearchableVisitor[]) => void;
  onSearchTermChange: (term: string) => void;
  placeholder?: string;
  className?: string;
  showAdvancedResults?: boolean;
  showSuggestions?: boolean;
  debounceMs?: number;
}

export default function EnhancedSearchBar({
  visitors,
  onSearchResults,
  onSearchTermChange,
  placeholder = "Search visitors...",
  className = "",
  showAdvancedResults = false,
  showSuggestions = true,
  debounceMs = 300
}: EnhancedSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult<SearchableVisitor>[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Handle search term changes
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    onSearchTermChange(term);
    
    if (term.trim()) {
      const results = searchVisitors(visitors, term, {
        minScore: 0.5,
        maxResults: 50
      });
      setSearchResults(results);
      onSearchResults(results.map(r => r.item));
    } else {
      setSearchResults([]);
      onSearchResults(visitors);
    }
  };

  // Handle search results from the input component
  const handleSearchResults = (results: SearchableVisitor[]) => {
    onSearchResults(results);
  };

  // Show/hide results based on search term
  useEffect(() => {
    setShowResults(searchTerm.length > 0 && showAdvancedResults);
  }, [searchTerm, showAdvancedResults]);

  return (
    <div className={`relative ${className}`}>
      <EnhancedSearchInput
        onSearch={handleSearch}
        onSearchResults={handleSearchResults}
        placeholder={placeholder}
        visitors={visitors}
        showSuggestions={showSuggestions}
        debounceMs={debounceMs}
        className="w-full"
      />
      
      {/* Advanced Search Results */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2">
          <SearchResults
            results={searchResults}
            searchTerm={searchTerm}
            showScores={true}
            maxResults={10}
            onResultClick={(visitor) => {
              // Handle result click - could scroll to item, open details, etc.
              console.log('Clicked visitor:', visitor);
            }}
          />
        </div>
      )}
    </div>
  );
}
