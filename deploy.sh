#!/bin/bash
# 一键部署到 CloudStudio Web 预览
# 用法: bash deploy.sh

PORT=8080

echo "📦 预检 dist 目录..."
if [ ! -d "dist" ]; then
  echo "❌ dist 目录不存在，先运行: npm run build"
  exit 1
fi

echo "🧹 清理旧进程 (port $PORT)..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
sleep 1

echo "🚀 启动静态服务: http://0.0.0.0:$PORT"
cd dist && nohup npx serve -s . -l $PORT --no-port-switching > /tmp/quiz-app.log 2>&1 &
sleep 2

echo ""
echo "✅ 部署完成！"
echo ""
echo "访问地址（替换为你的 CloudStudio 域名）："
echo "  https://webview.e2b.<your-region>.sandbox.cloudstudio.club/?x-cs-sandbox-id=<your-space-id>&x-cs-sandbox-port=$PORT"
echo ""
echo "本地预览："
echo "  http://localhost:$PORT"
