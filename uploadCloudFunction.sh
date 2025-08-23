#!/bin/bash

# 上传云函数脚本
echo "开始上传云函数..."

# 上传 login 云函数
echo "上传 login 云函数..."
cd cloudfunctions/login
npm install
cd ../..

# 上传 updateUserInfo 云函数
echo "上传 updateUserInfo 云函数..."
cd cloudfunctions/updateUserInfo
npm install
cd ../..

# 上传 extractColors 云函数
echo "上传 extractColors 云函数..."
cd cloudfunctions/extractColors
npm install
cd ../..

# 上传 checkInManager 云函数
echo "上传 checkInManager 云函数..."
cd cloudfunctions/checkInManager
npm install
cd ../..

echo "所有云函数上传完成！"

# 原有的部署命令（如果需要的话）
# ${installPath} cloud functions deploy --e ${envId} --n quickstartFunctions --r --project ${projectPath}