# 产品中心问题修复计划

## 问题分析

### 问题1：toggleDropdown 函数未定义
- **现象**：点击筛选按钮时报错 `Uncaught ReferenceError: toggleDropdown is not defined`
- **可能原因**：
  - JS文件加载时机问题
  - 函数作用域问题
  - 需要确保函数在DOM加载前就可用

### 问题2：产品列表未展示模拟数据
- **现象**：产品列表为空，未展示mock数据
- **可能原因**：
  - 初始化函数执行时机问题
  - DOM元素查找失败
  - 需要确保在DOM完全加载后执行

## 修复计划

### Step 1: 确保 toggleDropdown 函数全局可用
**修改文件**：
- `modules/product-center/product-center.html`
- `JsImpl/product-center.js`

**具体任务**：
1. 在HTML文件的 `<head>` 或脚本加载前添加临时函数声明
2. 确保JS文件中的函数正确挂载到window对象
3. 使用DOMContentLoaded事件确保执行时机正确

### Step 2: 确保产品列表正确渲染
**修改文件**：
- `JsImpl/product-center.js`

**具体任务**：
1. 检查并确保initProductList函数正确执行
2. 添加调试信息，确保DOM元素查找成功
3. 确保在DOM完全加载后执行初始化

### Step 3: 优化脚本加载和执行顺序
**修改文件**：
- `modules/product-center/product-center.html`

**具体任务**：
1. 调整脚本加载位置
2. 添加DOMContentLoaded事件监听
3. 确保所有功能在正确的时机初始化

## 技术实现要点
1. **提前声明函数**：在HTML中先简单声明toggleDropdown函数
2. **DOMContentLoaded**：使用此事件确保DOM完全加载
3. **window挂载**：确保所有需要全局访问的函数都挂载到window对象
4. **调试检查**：添加console.log来检查执行流程
