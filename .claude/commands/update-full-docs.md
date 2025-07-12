# 文档更新命令

在每次commit或PR前，使用此命令确保所有相关文档都已正确更新。

## 使用方法
```
/update-docs [changes-description]
```

## 执行步骤

### 1. 分析代码变更
首先分析当前的代码变更，确定影响范围：

```bash
# 查看当前变更
git status
git diff --cached  # 查看已暂存的变更
git diff HEAD      # 查看所有变更
```

### 2. 识别需要更新的文档类型

根据变更类型，确定需要更新的文档：

#### 🆕 新功能 (feat)
- [ ] `docs/GETTING_STARTED.md` - 添加使用说明和配置选项
- [ ] `docs/TECHNICAL_REFERENCE.md` - 添加技术实现细节
- [ ] `README.md` / `README_zh.md` - 更新功能列表和示例
- [ ] `docs/ARCHITECTURE.md` - 更新架构图和组件说明（如有结构变更）

#### 🐛 Bug修复 (fix)
- [ ] `docs/TROUBLESHOOTING.md` - 添加问题解决方案
- [ ] `CHANGELOG.md` - 记录修复内容
- [ ] 相关功能文档 - 更新受影响的使用说明

#### 🔧 配置变更 (config/env)
- [ ] `docs/GETTING_STARTED.md` - 更新环境变量和配置说明
- [ ] `docs/TECHNICAL_REFERENCE.md` - 更新配置参考
- [ ] `.env.example` - 添加新的环境变量示例

#### 🏗️ 架构变更 (refactor/architecture)
- [ ] `docs/ARCHITECTURE.md` - 更新系统架构图和组件说明
- [ ] `docs/TECHNICAL_REFERENCE.md` - 更新技术实现细节
- [ ] `CONTRIBUTING.md` - 更新开发指南（如影响开发流程）

#### 🧪 测试相关 (test)
- [ ] `docs/TECHNICAL_REFERENCE.md` - 更新测试部分
- [ ] `CONTRIBUTING.md` - 更新测试指南

#### 📚 依赖变更 (deps)
- [ ] `docs/GETTING_STARTED.md` - 更新安装要求
- [ ] `CONTRIBUTING.md` - 更新开发环境设置

#### 🔌 新的集成/提供者 (integration)
- [ ] `docs/TECHNICAL_REFERENCE.md` - 添加新提供者文档
- [ ] `docs/GETTING_STARTED.md` - 添加配置指南
- [ ] `docs/ARCHITECTURE.md` - 更新架构图

### 3. 系统性文档更新流程

#### A. 核心文档更新

**README.md / README_zh.md**
- [ ] 检查项目描述是否准确
- [ ] 更新功能列表和主要特性
- [ ] 验证快速开始部分的准确性
- [ ] 更新示例代码和用法
- [ ] 检查徽章和链接是否有效

**docs/GETTING_STARTED.md**
- [ ] 更新安装说明（如有新依赖）
- [ ] 添加新的配置选项
- [ ] 更新环境变量说明
- [ ] 添加新功能的使用示例
- [ ] 更新故障排除的常见问题

**docs/TECHNICAL_REFERENCE.md**
- [ ] 添加新的技术实现细节
- [ ] 更新API参考（如有变更）
- [ ] 添加新的搜索提供者文档
- [ ] 更新配置参考表
- [ ] 添加性能优化建议

#### B. 专项文档更新

**docs/ARCHITECTURE.md**
- [ ] 更新系统架构图（使用mermaid）
- [ ] 添加新组件的说明
- [ ] 更新数据流图
- [ ] 更新技术实现部分

**CONTRIBUTING.md**
- [ ] 更新开发环境设置
- [ ] 添加新的编码标准
- [ ] 更新测试指南
- [ ] 添加新的工具或流程

**docs/TROUBLESHOOTING.md**
- [ ] 添加新发现的问题和解决方案
- [ ] 更新错误代码说明
- [ ] 添加性能问题排查
- [ ] 更新调试技巧

#### C. 支持文档更新

**CHANGELOG.md**
- [ ] 添加版本变更记录
- [ ] 按类型分类变更（Added, Changed, Fixed, Removed）
- [ ] 包含破坏性变更说明
- [ ] 添加升级指南（如需要）

**.env.example**
- [ ] 添加新的环境变量
- [ ] 更新变量说明
- [ ] 移除废弃的变量
- [ ] 确保示例值的安全性

### 4. 文档质量检查

#### 内容一致性检查
```bash
# 检查文档中的链接
grep -r "docs/" . --include="*.md" | grep -v node_modules

# 检查是否有引用已删除的文档
grep -r "docs/INSTALLATION.md\|docs/USER_GUIDE.md\|docs/TECHNICAL_DETAILS.md\|docs/SEARCH_PROVIDERS.md\|docs/DEVELOPER_GUIDE.md\|docs/BEST_PRACTICES.md\|docs/TESTING.md" . --include="*.md" --exclude-dir=node_modules
```

#### 格式检查
- [ ] 所有markdown文件格式正确
- [ ] 链接有效且指向正确位置
- [ ] 代码块语法高亮正确
- [ ] 图片和图表正常显示

#### 内容完整性
- [ ] 新功能有完整的使用说明
- [ ] 配置选项有详细的说明和示例
- [ ] 错误情况有对应的故障排除指南
- [ ] 示例代码可以正常运行

### 5. 文档交叉引用更新

确保所有文档间的交叉引用都是准确的：

- [ ] README → 其他文档的链接
- [ ] GETTING_STARTED → TECHNICAL_REFERENCE 的链接
- [ ] TROUBLESHOOTING → 相关文档的链接
- [ ] CONTRIBUTING → 其他开发文档的链接
- [ ] ARCHITECTURE → 技术文档的链接

### 6. 多语言同步

如果项目支持多语言文档：
- [ ] 英文文档更新完成后，更新中文版本
- [ ] 确保关键信息在所有语言版本中保持一致
- [ ] 更新语言切换链接

### 7. 版本控制最佳实践

#### 提交策略
```bash
# 分别提交代码和文档变更
git add src/ tests/ scripts/     # 先提交代码变更
git commit -m "feat: implement new feature XYZ

- Add core functionality
- Include comprehensive tests
- Follow existing patterns

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 然后提交文档变更
git add docs/ README.md README_zh.md CHANGELOG.md
git commit -m "docs: update documentation for new feature XYZ

- Update GETTING_STARTED.md with usage examples
- Add technical details to TECHNICAL_REFERENCE.md
- Update README with new functionality
- Add troubleshooting section

```

#### PR检查清单
创建PR前的最终检查：
- [ ] 所有相关文档已更新
- [ ] 文档内容准确反映代码变更
- [ ] 链接和引用都正确
- [ ] 示例代码经过验证
- [ ] 多语言版本保持同步
- [ ] 版本号和变更日志已更新

### 8. 自动化检查

运行自动化检查确保文档质量：

```bash
# 检查markdown语法
markdownlint docs/ *.md

# 检查链接有效性
markdown-link-check docs/*.md

# 检查拼写（如果有配置）
cspell "docs/**/*.md" "*.md"

# 验证文档结构
tree docs/
```

### 9. 文档审查

在提交前进行最终审查：

#### 用户视角审查
- [ ] 新用户能否通过文档成功安装和使用
- [ ] 文档是否回答了用户可能的疑问
- [ ] 示例是否清晰易懂

#### 开发者视角审查
- [ ] 技术细节是否准确
- [ ] 架构说明是否与实现一致
- [ ] 开发流程是否完整

#### 维护者视角审查
- [ ] 文档结构是否合理
- [ ] 是否存在重复内容
- [ ] 未来维护是否方便

### 10. 提交和PR创建

最终提交和创建PR：

```bash
# 最终检查
git status
git diff --cached

# 提交文档变更
git commit -m "docs: comprehensive documentation update

- Update all relevant documentation for recent changes
- Ensure cross-references are accurate
- Add new examples and usage instructions
- Update troubleshooting guides


# 推送分支
git push origin feature-branch

# 创建PR
gh pr create --title "Feature: [Description] with comprehensive docs" --body "$(cat <<'EOF'
## Summary
[Brief description of changes]

## Code Changes
- [List code changes]

## Documentation Updates
- [List all documentation updates]
- Updated GETTING_STARTED.md with new configuration options
- Added technical details to TECHNICAL_REFERENCE.md
- Updated TROUBLESHOOTING.md with new solutions
- Refreshed README with latest functionality

## Verification
- [ ] All documentation links verified
- [ ] Examples tested and working
- [ ] Multi-language docs synchronized
- [ ] Cross-references updated

EOF
)"
```

## 文档更新模板

### 功能文档模板
```markdown
## [功能名称]

### 概述
[简要描述功能的目的和价值]

### 安装配置
[如果需要额外配置]

### 使用方法
[详细的使用说明和示例]

```bash
# 示例命令
command --option value
```

### 配置选项
| 选项 | 描述 | 默认值 | 必需 |
|------|------|--------|------|
| `OPTION_NAME` | 选项描述 | `default` | 否 |

### 常见问题
[相关的常见问题和解决方案]

### 参考链接
- [相关文档链接]
```

### 故障排除模板
```markdown
## [问题描述]

**症状**: [用户看到的现象]

**可能原因**:
1. [原因1]
2. [原因2]

**解决方案**:
1. [解决步骤1]
   ```bash
   command-to-fix
   ```
2. [解决步骤2]

**验证**:
```bash
# 验证命令
verification-command
```
```

## 注意事项

1. **优先级**: 用户文档 > 开发文档 > 内部文档
2. **准确性**: 所有示例代码必须经过测试验证
3. **完整性**: 覆盖功能的完整生命周期
4. **一致性**: 术语和格式在所有文档中保持一致
5. **可维护性**: 避免重复内容，使用交叉引用

记住：好的文档是项目成功的关键，花时间正确更新文档是对用户和未来维护者的投资。