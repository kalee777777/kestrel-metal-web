#!/bin/bash
# ==========================================
# Kestrel Metal - 询盘API测试脚本
# ==========================================
# 使用方法:
#   bash scripts/test-inquiry-api.sh <API_BASE_URL> <API_KEY>
#
# 示例:
#   bash scripts/test-inquiry-api.sh https://kestrelmetal.com your_api_key_here

set -e

API_BASE_URL="${1:-http://localhost:8787}"
API_KEY="${2:-test_api_key}"

echo "=========================================="
echo "Kestrel Metal - 询盘API测试"
echo "=========================================="
echo "API Base URL: $API_BASE_URL"
echo "API Key: ${API_KEY:0:8}..."
echo ""

PASSED=0
FAILED=0

# 测试函数
function test_api() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local data="$5"

    echo "▶️  测试: $test_name"
    echo "   $method $endpoint"

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            "$API_BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $API_KEY" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            "$API_BASE_URL$endpoint" \
            -H "Authorization: Bearer $API_KEY" 2>&1)
    fi

    status_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" = "$expected_status" ]; then
        echo "   ✅ 状态码: $status_code (期望: $expected_status)"
        if [ -n "$body" ]; then
            echo "   响应: $(echo "$body" | head -c 200)..."
        fi
        ((PASSED++))
    else
        echo "   ❌ 状态码: $status_code (期望: $expected_status)"
        echo "   错误响应: $body"
        ((FAILED++))
    fi
    echo ""
}

# ==========================================
# 测试用例
# ==========================================

echo "📝 测试 1: 无认证访问（期望失败）"
echo "------------------------------------------"
response=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE_URL/api/external/inquiries" 2>&1)
status_code=$(echo "$response" | tail -1)
if [ "$status_code" = "401" ]; then
    echo "   ✅ 正确返回 401 未授权"
    ((PASSED++))
else
    echo "   ❌ 期望 401，实际: $status_code"
    ((FAILED++))
fi
echo ""

echo "📝 测试 2: 创建询盘（POST）"
echo "------------------------------------------"
TEST_INQUIRY='{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+86 13800138000",
    "company": "Test Company",
    "country": "China",
    "product_name": "Chain Link Fence",
    "quantity": "1000 meters",
    "message": "Hello, I would like to get a quote for chain link fence.",
    "source_page": "/contact.html"
}'
test_api "创建询盘" "POST" "/api/inquiries" "201" "$TEST_INQUIRY"

echo "📝 测试 3: 获取询盘统计"
echo "------------------------------------------"
test_api "获取统计信息" "GET" "/api/external/inquiries/stats" "200"

echo "📝 测试 4: 获取询盘列表（第1页）"
echo "------------------------------------------"
test_api "获取询盘列表" "GET" "/api/external/inquiries?page=1&pageSize=20" "200"

echo "📝 测试 5: 搜索询盘"
echo "------------------------------------------"
test_api "搜索询盘(按名称)" "GET" "/api/external/inquiries?search=Test%20User" "200"

echo "📝 测试 6: 按状态筛选"
echo "------------------------------------------"
test_api "筛选 pending 状态" "GET" "/api/external/inquiries?status=pending" "200"

echo "📝 测试 7: 获取不存在的询盘（期望失败）"
echo "------------------------------------------"
test_api "获取不存在的询盘" "GET" "/api/external/inquiries/999999999" "404"

echo "📝 测试 8: 创建询盘缺少必填字段（期望失败）"
echo "------------------------------------------"
INVALID_INQUIRY='{"name": "Test", "message": "Missing email"}'
test_api "缺少必填字段" "POST" "/api/inquiries" "400" "$INVALID_INQUIRY"

# ==========================================
# 测试结果汇总
# ==========================================
echo "=========================================="
echo "📊 测试结果汇总"
echo "=========================================="
echo "✅ 通过: $PASSED"
echo "❌ 失败: $FAILED"
echo "------------------------------------------"

if [ "$FAILED" -eq 0 ]; then
    echo "🎉 所有测试通过！"
    exit 0
else
    echo "⚠️  有 $FAILED 个测试失败，请检查配置。"
    exit 1
fi