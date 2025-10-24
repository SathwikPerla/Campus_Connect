#!/bin/bash

# WhisprNet Test Script
echo "🧪 Testing WhisprNet - Anonymous Social Hub"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
API_URL="http://localhost:5000/api"
TEST_USER_EMAIL="test@whisprnet.com"
TEST_USER_PASSWORD="testpass123"
TEST_USERNAME="testuser"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
}

# Function to check if server is running
check_server() {
    curl -s "$API_URL/health" > /dev/null 2>&1
}

# Function to register a test user
register_user() {
    curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$TEST_USERNAME\",\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}" \
        | grep -q "success"
}

# Function to login and get token
login_user() {
    curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}" \
        | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Function to create a test post
create_post() {
    local token="$1"
    curl -s -X POST "$API_URL/posts/create" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d '{"text":"This is a test post","isAnonymous":false}' \
        | grep -q "success"
}

# Function to get posts
get_posts() {
    curl -s "$API_URL/posts" | grep -q "success"
}

# Function to test AI moderation
test_moderation() {
    local token="$1"
    curl -s -X POST "$API_URL/posts/create" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d '{"text":"This is hate speech","isAnonymous":false}' \
        | grep -q "moderation"
}

echo "🔍 Checking server status..."
if ! check_server; then
    echo -e "${RED}❌ Server is not running. Please start the server first.${NC}"
    echo "Run: cd server && npm start"
    exit 1
fi

echo -e "${GREEN}✅ Server is running${NC}"
echo ""

echo "🚀 Starting API tests..."
echo ""

# Test 1: Health check
run_test "Health Check" "check_server"

# Test 2: User registration
run_test "User Registration" "register_user"

# Test 3: User login
echo -n "Testing User Login... "
TOKEN=$(login_user)
if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 4: Create post
run_test "Create Post" "create_post \"$TOKEN\""

# Test 5: Get posts
run_test "Get Posts" "get_posts"

# Test 6: AI Moderation
run_test "AI Moderation" "test_moderation \"$TOKEN\""

# Test 7: User profile
run_test "Get User Profile" "curl -s -H \"Authorization: Bearer $TOKEN\" \"$API_URL/users/$TEST_USERNAME\" | grep -q \"success\""

# Test 8: Update profile
run_test "Update Profile" "curl -s -X PUT \"$API_URL/users/profile\" -H \"Content-Type: application/json\" -H \"Authorization: Bearer $TOKEN\" -d '{\"username\":\"updateduser\"}' | grep -q \"success\""

echo ""
echo "📊 Test Results:"
echo "================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! WhisprNet is working correctly.${NC}"
    echo ""
    echo "🌐 You can now access the application:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend:  http://localhost:5000"
    echo ""
    echo "📚 For more information, see README.md"
else
    echo -e "${RED}❌ Some tests failed. Please check the server logs.${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Make sure the server is running: cd server && npm start"
    echo "2. Check server logs for errors"
    echo "3. Verify environment variables are set correctly"
    echo "4. Ensure MongoDB is accessible"
fi

echo ""
echo "🧹 Cleaning up test data..."
# Note: In a real test environment, you might want to clean up test data
echo "Test completed!"




