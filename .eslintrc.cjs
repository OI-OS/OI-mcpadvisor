module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    // 移除 project 配置，避免解析错误
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  env: {
    node: true,
    es6: true,
  },
  rules: {
    // 基本代码质量规则
    'no-console': 'off', // 允许使用 console
    'no-useless-escape': 'warn', // 降级为警告
    'prefer-template': 'warn', // 降级为警告
    'no-var': 'error', // 不允许使用 var
    'prefer-const': 'warn', // 优先使用 const
    'no-param-reassign': 'warn', // 不建议修改参数
    
    // TypeScript 基本规则（不需要类型信息的规则）
    '@typescript-eslint/explicit-function-return-type': 'off', // 关闭返回类型检查
    '@typescript-eslint/no-explicit-any': 'off', // 允许使用 any 类型
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_', 
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true 
    }], // 未使用变量警告
    
    // 移除需要类型信息的规则
    '@typescript-eslint/no-floating-promises': 'off', // 需要类型信息，关闭
    '@typescript-eslint/no-misused-promises': 'off', // 需要类型信息，关闭
    '@typescript-eslint/await-thenable': 'off', // 需要类型信息，关闭
    '@typescript-eslint/no-unnecessary-type-assertion': 'off', // 需要类型信息，关闭
    
    // 代码风格规则
    'arrow-body-style': 'off', // 关闭箭头函数体样式检查
    'prefer-arrow-callback': 'warn', // 优先使用箭头函数
    'object-shorthand': 'warn', // 优先使用对象简写
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
      },
    },
  ],
};
