#!/bin/bash

# Test script using curl to verify visitor persistence
# Make sure the backend server is running on localhost:5000

echo "🧪 Testing Visitor Persistence with cURL"
echo "========================================"

API_BASE="http://localhost:5000"

# Test 1: Get initial visitor count
echo ""
echo "1️⃣ Getting initial visitor count..."
curl -s -X GET "$API_BASE/api/visitors/count" | jq '.'

# Test 2: Create a test visitor
echo ""
echo "2️⃣ Creating a test visitor..."
curl -s -X POST "$API_BASE/api/visitors" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Curl Test User",
    "email": "curltest@example.com",
    "phone": "+1-555-CURL",
    "organization": "Curl Test Corp",
    "service": "Water Testing",
    "source": "chatbot"
  }' | jq '.'

# Test 3: Get updated visitor count
echo ""
echo "3️⃣ Getting updated visitor count..."
curl -s -X GET "$API_BASE/api/visitors/count" | jq '.'

# Test 4: Get all visitors (direct endpoint)
echo ""
echo "4️⃣ Getting all visitors (direct endpoint)..."
curl -s -X GET "$API_BASE/api/visitors?limit=10" | jq '.total, .items | length'

# Test 5: Get visitors via analytics endpoint
echo ""
echo "5️⃣ Getting visitors via analytics endpoint..."
curl -s -X GET "$API_BASE/api/analytics/visitors-management?limit=10" | jq '.pagination.total, .visitors | length'

# Test 6: Search for the test visitor
echo ""
echo "6️⃣ Searching for test visitor..."
curl -s -X GET "$API_BASE/api/analytics/visitors-management?search=Curl&limit=10" | jq '.visitors | length'

echo ""
echo "🎉 cURL tests completed!"
echo "Check the output above to verify visitor persistence is working."
