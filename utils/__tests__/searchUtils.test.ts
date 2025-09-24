/**
 * Test file for search utilities
 * This file demonstrates the enhanced search functionality
 */

import { 
  enhancedSearch, 
  simpleSearch, 
  searchVisitors, 
  getSearchSuggestions,
  SearchableVisitor 
} from '../searchUtils';

// Sample test data
const sampleVisitors: SearchableVisitor[] = [
  {
    _id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    organization: 'Acme Corp',
    region: 'North America',
    service: 'Water Testing',
    subservice: 'Drinking Water Analysis',
    status: 'qualified',
    agentName: 'Alice Smith',
    enquiryDetails: 'Need water quality testing for new facility',
    comments: 'High priority client',
    source: 'chatbot'
  },
  {
    _id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@techcorp.com',
    phone: '+1987654321',
    organization: 'TechCorp Inc',
    region: 'Europe',
    service: 'Food Testing',
    subservice: 'Microbiological Analysis',
    status: 'contact_initiated',
    agentName: 'Bob Johnson',
    enquiryDetails: 'Food safety testing for new product line',
    comments: 'Follow up required',
    source: 'email'
  },
  {
    _id: '3',
    name: 'Mike Johnson',
    email: 'mike.j@environsolutions.com',
    phone: '+1122334455',
    organization: 'Environ Solutions',
    region: 'Asia',
    service: 'Environmental Testing',
    subservice: 'Air Quality Monitoring',
    status: 'converted',
    salesExecutiveName: 'Carol Davis',
    enquiryDetails: 'Environmental impact assessment',
    comments: 'Project completed successfully',
    source: 'website'
  }
];

// Test functions
export function testEnhancedSearch() {
  console.log('🧪 Testing Enhanced Search Functionality');
  
  // Test 1: Basic search by name
  console.log('\n1. Testing search by name "John":');
  const nameResults = enhancedSearch(sampleVisitors, 'John');
  console.log(`Found ${nameResults.length} results:`, nameResults.map(r => ({
    name: r.item.name,
    score: r.score,
    matchedFields: r.matchedFields
  })));

  // Test 2: Search by email domain
  console.log('\n2. Testing search by email domain "example.com":');
  const emailResults = enhancedSearch(sampleVisitors, 'example.com');
  console.log(`Found ${emailResults.length} results:`, emailResults.map(r => ({
    name: r.item.name,
    email: r.item.email,
    score: r.score
  })));

  // Test 3: Search by service
  console.log('\n3. Testing search by service "water":');
  const serviceResults = enhancedSearch(sampleVisitors, 'water');
  console.log(`Found ${serviceResults.length} results:`, serviceResults.map(r => ({
    name: r.item.name,
    service: r.item.service,
    score: r.score
  })));

  // Test 4: Search by organization
  console.log('\n4. Testing search by organization "tech":');
  const orgResults = enhancedSearch(sampleVisitors, 'tech');
  console.log(`Found ${orgResults.length} results:`, orgResults.map(r => ({
    name: r.item.name,
    organization: r.item.organization,
    score: r.score
  })));

  // Test 5: Search by status
  console.log('\n5. Testing search by status "qualified":');
  const statusResults = enhancedSearch(sampleVisitors, 'qualified');
  console.log(`Found ${statusResults.length} results:`, statusResults.map(r => ({
    name: r.item.name,
    status: r.item.status,
    score: r.score
  })));

  // Test 6: Search by agent name
  console.log('\n6. Testing search by agent "Alice":');
  const agentResults = enhancedSearch(sampleVisitors, 'Alice');
  console.log(`Found ${agentResults.length} results:`, agentResults.map(r => ({
    name: r.item.name,
    agentName: r.item.agentName,
    score: r.score
  })));

  // Test 7: Search by comments
  console.log('\n7. Testing search by comments "priority":');
  const commentResults = enhancedSearch(sampleVisitors, 'priority');
  console.log(`Found ${commentResults.length} results:`, commentResults.map(r => ({
    name: r.item.name,
    comments: r.item.comments,
    score: r.score
  })));

  // Test 8: Multi-word search
  console.log('\n8. Testing multi-word search "water testing":');
  const multiWordResults = enhancedSearch(sampleVisitors, 'water testing');
  console.log(`Found ${multiWordResults.length} results:`, multiWordResults.map(r => ({
    name: r.item.name,
    score: r.score,
    matchedFields: r.matchedFields
  })));

  // Test 9: Search suggestions
  console.log('\n9. Testing search suggestions for "te":');
  const suggestions = getSearchSuggestions(sampleVisitors, 'te', 5);
  console.log('Suggestions:', suggestions);

  // Test 10: Simple search comparison
  console.log('\n10. Testing simple search vs enhanced search for "john":');
  const simpleResults = simpleSearch(sampleVisitors, 'john', ['name', 'email']);
  const enhancedResults = enhancedSearch(sampleVisitors, 'john');
  console.log(`Simple search: ${simpleResults.length} results`);
  console.log(`Enhanced search: ${enhancedResults.length} results with scores`);

  console.log('\n✅ Enhanced search testing completed!');
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).testEnhancedSearch = testEnhancedSearch;
} else {
  // Node environment
  testEnhancedSearch();
}
