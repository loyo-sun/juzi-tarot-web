#!/bin/bash

# 测试管理员登录和统计 API

echo "===================================="
echo "1. 测试管理员登录"
echo "===================================="

LOGIN_RESPONSE=$(curl -s 'https://juzi.loyo.work/api/admin-auth?action=login' \
  -H 'content-type: application/json' \
  --data-raw '{"email":"qsun@vip.qq.com","password":"sunqing1990930"}')

echo "$LOGIN_RESPONSE" | jq .

# 提取 token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo ""
  echo "❌ 登录失败，无法获取 token"
  exit 1
fi

echo ""
echo "✅ 登录成功，Token: ${TOKEN:0:20}..."
echo ""

echo "===================================="
echo "2. 测试统计数据 API"
echo "===================================="

STATS_RESPONSE=$(curl -s 'https://juzi.loyo.work/api/admin-stats' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json')

echo "$STATS_RESPONSE" | jq .

# 检查是否成功
SUCCESS=$(echo "$STATS_RESPONSE" | jq -r '.success')

if [ "$SUCCESS" == "true" ]; then
  echo ""
  echo "✅ 统计数据获取成功"
else
  echo ""
  echo "❌ 统计数据获取失败"
  exit 1
fi
