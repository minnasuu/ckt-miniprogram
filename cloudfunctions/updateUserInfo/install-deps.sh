#!/bin/bash

echo "正在安装 updateUserInfo 云函数依赖..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在 cloudfunctions/updateUserInfo 目录下运行此脚本"
    exit 1
fi

# 安装依赖
echo "安装 wx-server-sdk 依赖..."
npm install

# 检查安装结果
if [ -d "node_modules" ]; then
    echo "✅ 依赖安装成功！"
    echo "现在可以在微信开发者工具中右键点击此目录，选择【上传并部署：云端安装依赖】"
else
    echo "❌ 依赖安装失败，请检查网络连接和npm配置"
fi
