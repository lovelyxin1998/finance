@echo off
echo 🚀 启动 Finance DApp 服务器...

REM 检查是否已经构建
if not exist "dist" (
    echo 📦 检测到未构建，正在构建项目...
    npm run build
)

REM 启动服务器
echo 🌐 启动服务器...
npm start
pause 