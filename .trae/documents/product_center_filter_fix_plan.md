# 产品中心筛选器修复计划

## 现状分析

通过对当前代码的分析，发现以下问题：

1. **toggleDropdown函数未挂载到window对象** - 可能导致onclick无法调用
2. **下拉菜单缺少过渡动画效果** - 只是生硬的显示/隐藏
3. **箭头图标没有旋转和颜色变化** - 打开下拉菜单时没有视觉反馈
4. **HTML结构需要优化** - 需要添加backdrop-blur-xl效果
5. **下拉选项样式需要优化** - hover效果需要使用bg-teal-50和text-teal-700

## 修复计划

### Step 1: 全局作用域补丁（解决 ReferenceError）

**修改文件**：
- `JsImpl/product-center.js`

**具体任务**：
1. 将toggleDropdown函数挂载到window对象上
2. 确保函数可以被onclick调用
3. 添加event.stopPropagation()防止事件冒泡

### Step 2: 完善下拉菜单的交互逻辑

**修改文件**：
- `JsImpl/product-center.js`
- `modules/product-center/product-center.html`

**具体任务**：
1. 添加全局点击事件监听，点击外部关闭下拉菜单
2. 为箭头图标添加旋转效果（rotate-180）
3. 为箭头图标添加颜色变化（#14B8A6）
4. 为下拉菜单添加过渡动画效果
5. 优化toggleDropdown函数的排他性逻辑

### Step 3: 重构筛选器的 HTML 结构

**修改文件**：
- `modules/product-center/product-center.html`
- `JsImpl/product-center.js`

**具体任务**：
1. 确保ID匹配正确
2. 为下拉容器添加backdrop-blur-xl效果
3. 修改下拉容器样式：`absolute z-50 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100`
4. 优化下拉选项样式，添加hover效果：`bg-teal-50 text-teal-700`

## 技术实现要点

1. **window对象挂载**：`window.toggleDropdown = function(id) { ... }`
2. **箭头图标旋转**：使用Tailwind的rotate-180类
3. **过渡动画**：使用transition-all和duration-200
4. **点击外部关闭**：全局事件监听器，检查点击目标
5. **backdrop-blur**：使用backdrop-blur-xl实现毛玻璃效果

## 预期成果

完成后，产品中心将具备：
1. 稳定的下拉菜单功能，不会出现ReferenceError
2. 流畅的过渡动画效果
3. 清晰的箭头图标状态指示
4. 美观的下拉菜单样式（毛玻璃效果）
5. 优化的下拉选项交互
