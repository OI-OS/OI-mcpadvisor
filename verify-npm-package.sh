#!/bin/bash
# 验证 npm 包是否正确包含 data 目录

echo "开始验证 npm 包内容..."

# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo "创建临时目录: $TEMP_DIR"

# 打包项目
echo "打包项目..."
npm pack

# 获取包文件名
PACKAGE_FILE=$(ls *.tgz | head -1)
echo "生成的包文件: $PACKAGE_FILE"

# 解压包到临时目录
echo "解压包到临时目录..."
tar -xzf $PACKAGE_FILE -C $TEMP_DIR

# 检查 data 目录是否存在
echo "检查 data 目录是否存在..."
if [ -d "$TEMP_DIR/package/data" ]; then
  echo "✅ data 目录存在"
  
  # 检查 mcp_server_list.json 文件是否存在
  if [ -f "$TEMP_DIR/package/data/mcp_server_list.json" ]; then
    echo "✅ mcp_server_list.json 文件存在"
    
    # 检查文件内容
    FILE_SIZE=$(stat -f%z "$TEMP_DIR/package/data/mcp_server_list.json")
    echo "文件大小: $FILE_SIZE 字节"
    
    # 使用 Node.js 检查文件是否为有效的 JSON
    echo "使用 Node.js 检查 JSON 文件有效性..."
    NODE_CHECK=$(node -e "try { const data = require('$TEMP_DIR/package/data/mcp_server_list.json'); console.log('VALID:' + data.length); } catch(e) { console.log('INVALID:' + e.message); }")
    
    if [[ $NODE_CHECK == VALID:* ]]; then
      echo "✅ mcp_server_list.json 是有效的 JSON 文件"
      
      # 提取服务器数量
      SERVER_COUNT=${NODE_CHECK#VALID:}
      echo "包含 $SERVER_COUNT 个 MCP 服务器数据"
      
      echo "验证成功! 数据文件已正确包含在 npm 包中。"
    else
      echo "❌ mcp_server_list.json 不是有效的 JSON 文件"
    fi
  else
    echo "❌ mcp_server_list.json 文件不存在"
  fi
else
  echo "❌ data 目录不存在"
fi

# 清理
echo "清理临时文件..."
rm -rf $TEMP_DIR
rm $PACKAGE_FILE

echo "验证完成。"
