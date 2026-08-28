#!/bin/bash
# ==========================================
# Kestrel Metal - 询盘API部署脚本
# ==========================================
# 此脚本用于部署询盘API功能
# 使用方法：cd kestrel-site && bash scripts/setup-inquiry-api.sh

set -e

echo "=========================================="
echo "Kestrel Metal - 询盘API部署脚本"
echo "=========================================="
echo ""

# 1. 检查 wrangler 是否安装
echo "[1/6] 检查 Wrangler CLI..."
if ! command -v npx &> /dev/null; then
    echo "❌ 错误: 需要安装 Node.js 和 npm"
    exit 1
fi
echo "✅ Wrangler CLI 可用"
echo ""

# 2. 创建 INQUIRIES KV 命名空间
echo "[2/6] 创建 INQUIRIES KV 命名空间..."
echo "正在创建 KV 命名空间 'kestrel-inquiries'..."
KV_OUTPUT=$(npx wrangler kv namespace create kestrel-inquiries 2>&1 || true)

# 提取命名空间 ID
if [[ "$KV_OUTPUT" =~ id=\"([a-f0-9]+)\" ]]; then
    KV_ID="${BASH_REMATCH[1]}"
    echo "✅ KV 命名空间创建成功，ID: $KV_ID"
else
    # 如果创建失败，可能已经存在，尝试列出
    echo "⚠️  创建失败，尝试查找已存在的命名空间..."
    LIST_OUTPUT=$(npx wrangler kv namespace list 2>&1 || true)
    if [[ "$LIST_OUTPUT" =~ \"kestrel-inquiries\".*\"id\":\ *\"([a-f0-9]+)\" ]]; then
        KV_ID="${BASH_REMATCH[1]}"
        echo "✅ 找到已存在的 KV 命名空间，ID: $KV_ID"
    else
        echo "❌ 无法创建或查找 KV 命名空间，请手动执行："
        echo "   npx wrangler kv namespace create kestrel-inquiries"
        exit 1
    fi
fi
echo ""

# 3. 更新 wrangler.jsonc 中的 KV ID
echo "[3/6] 更新 wrangler.jsonc 配置..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/INQUIRIES_KV_ID_PLACEHOLDER/$KV_ID/g" wrangler.jsonc
else
    # Linux
    sed -i "s/INQUIRIES_KV_ID_PLACEHOLDER/$KV_ID/g" wrangler.jsonc
fi
echo "✅ wrangler.jsonc 已更新"
echo ""

# 4. 生成并设置 API 密钥
echo "[4/6] 配置询盘API密钥..."
if [ -z "$INQUIRY_API_KEY" ]; then
    # 生成随机密钥
    INQUIRY_API_KEY=$(openssl rand -hex 32)
    echo "生成随机 API 密钥: $INQUIRY_API_KEY"
    echo ""
    echo "⚠️  请妥善保存此密钥！这是访问询盘API的唯一凭证！"
    echo "⚠️  密钥丢失后无法找回，需要重新生成！"
    echo ""
fi

echo "正在设置 INQUIRY_API_KEY Secret..."
echo "$INQUIRY_API_KEY" | npx wrangler secret put INQUIRY_API_KEY
echo "✅ API 密钥已设置"
echo ""

# 5. 添加环境变量配置
echo "[5/6] 检查环境变量配置..."
# 读取 wrangler.jsonc 看是否已有 ADMIN_TOKEN 配置
if ! grep -q "ADMIN_TOKEN" wrangler.jsonc; then
    echo "添加 ADMIN_TOKEN 到 vars 配置..."
    ADMIN_TOKEN=$(openssl rand -hex 32)
    # 使用临时文件进行 JSON 编辑
    node -e "
        const fs = require('fs');
        const content = fs.readFileSync('wrangler.jsonc', 'utf8');
        const updated = content.replace(
            '\"QWEN_MODEL\": \"qwen3.8-max\"',
            '\"QWEN_MODEL\": \"qwen3.8-max\",\n    \"ADMIN_TOKEN\": \"$ADMIN_TOKEN\"'
        );
        fs.writeFileSync('wrangler.jsonc', updated);
    "
    echo "✅ ADMIN_TOKEN 已添加"
fi
echo ""

# 6. 部署 Worker
echo "[6/6] 部署 Cloudflare Worker..."
npx wrangler deploy
echo ""

echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo ""
echo "📋 API 配置信息："
echo "------------------------------------------"
echo "询盘API密钥（INQUIRY_API_KEY）:"
echo "  $INQUIRY_API_KEY"
echo ""
echo "📡 API 端点："
echo "------------------------------------------"
echo "1. 获取询盘列表（分页）"
echo "   GET  /api/external/inquiries"
echo "   参数: page, pageSize, search, status"
echo ""
echo "2. 获取询盘统计"
echo "   GET  /api/external/inquiries/stats"
echo ""
echo "3. 获取单条询盘详情"
echo "   GET  /api/external/inquiries/:id"
echo ""
echo "4. 创建新询盘（前台提交）"
echo "   POST /api/inquiries"
echo ""
echo "🔑 API 调用示例："
echo "------------------------------------------"
echo "curl -X GET 'https://your-domain.com/api/external/inquiries' \\"
echo "  -H 'Authorization: Bearer $INQUIRY_API_KEY'"
echo ""
echo "curl -X GET 'https://your-domain.com/api/external/inquiries/stats' \\"
echo "  -H 'Authorization: Bearer $INQUIRY_API_KEY'"
echo ""
echo "💡 前端配置："
echo "------------------------------------------"
echo "请在网站的浏览器控制台中执行以下命令，"
echo "设置API密钥以便前台提交的询盘同步到后端："
echo ""
echo "localStorage.setItem('km_inquiry_api_key', '$INQUIRY_API_KEY');"
echo ""
echo "=========================================="