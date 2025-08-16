#!/bin/bash

echo "🚀 启动 Finance DApp 服务器..."

# 检查是否已经构建
if [ ! -d "dist" ]; then
    echo "📦 检测到未构建，正在构建项目..."
    npm run build
fi

# 启动服务器
echo "🌐 启动服务器..."
npm start 