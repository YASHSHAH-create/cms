'use client';

import React, { useState, useEffect, useRef } from 'react';
import { searchVisitors, getSearchSuggestions, SearchableVisitor } from '@/utils/searchUtils';

interface EnhancedSearchInputProps {
  onSearch: (searchTerm: string) => void;
  onSearchResults?: (results: any[]) => void;
  placeholder?: string;
  className?: string;
  visitors?: SearchableVisitor[];
  showSuggestions?: boolean;
  debounceMs?: number;
}

export default function EnhancedSearchInput({
  onSearch,
  onSearchResults,
  placeholder = "Search visitors...",
  className = "",
  visitors = [],
  showSuggestions = true,
  debounceMs = 300
}: EnhancedSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Handle search when debounced term changes
  useEffect(() => {
    onSearch(debouncedSearchTerm);
    
    if (onSearchResults && visitors.length > 0) {
      const results = searchVisitors(visitors, debouncedSearchTerm);
      onSearchResults(results.map(r => r.item));
    }
  }, [debouncedSearchTerm, onSearch, onSearchResults, visitors]);

  // Generate suggestions
  useEffect(() => {
    if (searchTerm.length >= 2 && showSuggestions && visitors.length > 0) {
      const newSuggestions = getSearchSuggestions(visitors, searchTerm, 8);
      setSuggestions(newSuggestions);
      setShowSuggestionsList(newSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestionsList(false);
    }
  }, [searchTerm, visitors, showSuggestions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFocusedSuggestionIndex(-1);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestionsList(false);
    setFocusedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestionsList || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[focusedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestionsList(false);
        setFocusedSuggestionIndex(-1);
        break;
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsList(false);
        setFocusedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestionsList(false);
    setFocusedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestionsList(true);
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
        />
        
        {/* Search/Clear Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {searchTerm ? (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsList && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                index === focusedSuggestionIndex ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
              type="button"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="truncate">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Search Tips */}
      {searchTerm && searchTerm.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="font-medium">Search tips:</span> Try searching by name, email, phone, organization, service, region, or status
        </div>
      )}
    </div>
  );
}
