请在每次提交代码或创建PR前运行此文档更新流程，确保所有相关文档都已正确更新。

参数：$ARGUMENTS（变更描述，可选）

# 🔍 第一步：分析变更影响

## 1.1 检查代码变更
```bash
git status
git diff --cached
git diff HEAD
```

## 1.2 识别变更类型并确定需要更新的文档

**根据您的变更类型，检查以下文档：**

### 🆕 新功能 (feat)
- [ ] `docs/GETTING_STARTED.md` - 使用说明和配置
- [ ] `docs/TECHNICAL_REFERENCE.md` - 技术实现细节  
- [ ] `README.md` / `README_zh.md` - 功能列表和示例
- [ ] `docs/ARCHITECTURE.md` - 架构变更（如适用）

### 🐛 Bug修复 (fix)
- [ ] `docs/TROUBLESHOOTING.md` - 问题解决方案
- [ ] 相关功能文档 - 更新受影响的说明

### 🔧 配置变更 (config)
- [ ] `docs/GETTING_STARTED.md` - 环境变量和配置
- [ ] `docs/TECHNICAL_REFERENCE.md` - 配置参考
- [ ] `.env.example` - 新环境变量

### 🏗️ 架构变更 (refactor)
- [ ] `docs/ARCHITECTURE.md` - 系统架构图和组件
- [ ] `docs/TECHNICAL_REFERENCE.md` - 技术实现
- [ ] `CONTRIBUTING.md` - 开发指南（如适用）

### 🔌 新集成/提供者
- [ ] `docs/TECHNICAL_REFERENCE.md` - 新提供者文档
- [ ] `docs/GETTING_STARTED.md` - 配置指南
- [ ] `docs/ARCHITECTURE.md` - 架构图更新

# 📝 第二步：系统性更新文档

使用Glob和Read工具检查当前文档内容，然后使用Edit/MultiEdit进行更新：

## 2.1 核心文档检查清单

### README.md / README_zh.md
- [ ] 项目描述准确
- [ ] 功能列表最新
- [ ] 快速开始有效
- [ ] 示例代码正确
- [ ] 链接有效

### docs/GETTING_STARTED.md  
- [ ] 安装说明完整
- [ ] 配置选项详细
- [ ] 环境变量更新
- [ ] 使用示例清晰
- [ ] 常见问题覆盖

### docs/TECHNICAL_REFERENCE.md
- [ ] 技术实现详细
- [ ] API参考准确  
- [ ] 搜索提供者完整
- [ ] 配置参考表更新
- [ ] 性能建议相关

### docs/ARCHITECTURE.md
- [ ] 架构图最新（mermaid）
- [ ] 组件说明准确
- [ ] 数据流图正确
- [ ] 技术实现一致

### CONTRIBUTING.md
- [ ] 开发环境设置
- [ ] 编码标准更新
- [ ] 测试指南完整
- [ ] 新工具和流程

### docs/TROUBLESHOOTING.md
- [ ] 新问题和解决方案
- [ ] 错误代码说明
- [ ] 性能问题排查
- [ ] 调试技巧更新

# 🔗 第三步：验证链接和引用

## 3.1 检查文档链接
```bash
grep -r "docs/" . --include="*.md" --exclude-dir=node_modules
```

## 3.2 检查废弃文档引用
```bash
grep -r "docs/INSTALLATION.md\|docs/USER_GUIDE.md\|docs/TECHNICAL_DETAILS.md\|docs/SEARCH_PROVIDERS.md\|docs/DEVELOPER_GUIDE.md\|docs/BEST_PRACTICES.md\|docs/TESTING.md" . --include="*.md" --exclude-dir=node_modules
```

## 3.3 验证交叉引用
- [ ] README → 其他文档
- [ ] GETTING_STARTED → TECHNICAL_REFERENCE  
- [ ] TROUBLESHOOTING → 相关文档
- [ ] CONTRIBUTING → 开发文档
- [ ] ARCHITECTURE → 技术文档

# ✅ 第四步：质量检查

## 4.1 内容质量
- [ ] 新功能有完整使用说明
- [ ] 配置选项有详细说明和示例
- [ ] 错误情况有故障排除指南
- [ ] 示例代码经过验证

## 4.2 格式检查
- [ ] Markdown格式正确
- [ ] 链接有效
- [ ] 代码块语法高亮
- [ ] 图表正常显示

## 4.3 多语言同步
- [ ] 英文文档完整
- [ ] 中文版本同步
- [ ] 关键信息一致

# 🚀 第五步：提交文档更新

## 5.1 单独提交文档变更
```bash
git add docs/ README.md README_zh.md CHANGELOG.md .env.example
git commit -m "docs: update documentation for [变更描述]

- Update relevant user and technical documentation  
- Add new configuration options and examples
- Update troubleshooting guides
- Ensure all cross-references are accurate

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## 5.2 PR创建检查清单
- [ ] 所有相关文档已更新
- [ ] 内容准确反映代码变更
- [ ] 链接和引用正确
- [ ] 示例代码验证
- [ ] 多语言版本同步

## 5.3 在PR描述中包含文档更新说明
```markdown
## Documentation Updates
- Updated GETTING_STARTED.md with new configuration options
- Added technical details to TECHNICAL_REFERENCE.md  
- Updated TROUBLESHOOTING.md with new solutions
- Refreshed README with latest functionality
- Synchronized multi-language documentation
```

# 📋 快速检查清单

在提交前的最终验证：

**用户体验**
- [ ] 新用户可以通过文档成功使用
- [ ] 文档回答了可能的疑问
- [ ] 示例清晰易懂

**技术准确性**  
- [ ] 技术细节准确
- [ ] 架构说明与实现一致
- [ ] 开发流程完整

**维护性**
- [ ] 文档结构合理
- [ ] 无重复内容
- [ ] 便于未来维护

---

💡 **提示**：好的文档是项目成功的关键。花时间正确更新文档是对用户和未来维护者的重要投资。

📖 **详细指南**：查看完整的文档更新指南请参考 `.claude/commands/update-docs.md`