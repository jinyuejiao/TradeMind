# 产品类别管理入口优化计划

## 目标
将产品类别管理的入口从筛选栏右侧挪动到顶部与"仓库管理"图标并列的位置，并优化图标为更形象的 `ph-tree-structure`。

## 修改计划

### 步骤1：在顶部添加新的类别管理按钮
**文件**：`modules/product-center/product-center.html`

**任务**：
- 在仓库管理按钮（第13-16行）的左侧添加新的类别管理按钮
- 图标：`ph-bold ph-tree-structure`
- 样式：`w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-teal-50 hover:text-teal-600 rounded-xl transition-all`
- 属性：`title="产品类别管理"`
- 调用：`onclick="window.ProductModule.openCategoryManager()"`
- 间距：与仓库图标保持 `gap-2`

### 步骤2：删除筛选器区域的旧按钮
**文件**：`modules/product-center/product-center.html`

**任务**：
- 删除第78-81行的旧类别管理按钮（齿轮图标）
- 确保界面整洁

### 步骤3：优化移动端适配
**文件**：`modules/product-center/product-center.html`

**任务**：
- 确保顶部操作区在移动端不被挤压
- 可以考虑在移动端将图标大小微调为 `w-8 h-8`

### 步骤4：检查弹窗层级
**文件**：`modules/product-center/product-center.html` 和 `JsImpl/main.js`

**任务**：
- 确认类别管理弹窗的 z-index 足够高（当前是 `z-[140]`，应该没问题）
- 确保弹窗可以正确显示在顶部导航栏上方
