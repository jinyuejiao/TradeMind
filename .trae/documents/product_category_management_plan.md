# 产品类别管理功能完善计划

## 现状分析

已有的基础结构：
1. ✅ 管理按钮已存在（`id="category-filter"` 旁边）
2. ✅ 类别管理弹窗已存在（`id="category-modal"`）
3. ✅ 基础的打开/关闭函数已存在

## 改进计划

### 阶段1：优化管理按钮样式
**文件**：`modules/product-center/product-center.html`

**任务**：
- 确保按钮样式为：`w-10 h-10 flex items-center justify-center bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-100 transition-all`
- 确保图标为：`ph-bold ph-gear-six`
- 确保调用：`onclick="window.openCategoryManager()"`

### 阶段2：重构类别管理弹窗
**文件**：`modules/product-center/product-center.html`

**任务**：
1. **弹窗头部**：标题改为"一级类别管理"
2. **弹窗样式**：
   - PC端：`max-w-md`、`rounded-[2.5rem]`、居中显示
   - 移动端：`max-md:fixed max-md:bottom-0 max-md:inset-x-0 max-md:rounded-t-[2.5rem] max-md:rounded-b-none`（底部抽屉效果）
3. **弹窗内容**：
   - 新增输入框（`rounded-2xl`样式）
   - 列表容器（`id="category-edit-list"`）
   - 列表项：采用"列表即编辑"模式，悬浮时显示编辑/删除图标
4. **添加动画CSS**：注入移动端上滑动画

### 阶段3：实现完整的CRUD逻辑
**文件**：`JsImpl/main.js`

**任务**：
1. **数据模型**：创建 `window.TM_MOCK_CATEGORIES` 数组存储类别数据
2. **全局模块**：创建 `window.ProductModule` 命名空间
3. **核心函数**：
   - `window.ProductModule.openCategoryManager()` - 打开管理弹窗
   - `window.ProductModule.closeCategoryManager()` - 关闭管理弹窗
   - `window.ProductModule.renderCategoryEditList()` - 渲染类别列表
   - `window.ProductModule.addCategory()` - 新增类别
   - `window.ProductModule.editCategory(id)` - 编辑类别
   - `window.ProductModule.deleteCategory(id)` - 删除类别（带确认框）
4. **自动对焦**：打开弹窗时输入框自动获得焦点

### 阶段4：UI细节优化
**文件**：`modules/product-center/product-center.html` 和 `JsImpl/main.js`

**任务**：
1. 列表项样式：使用 `group` 类实现悬浮显示操作图标
2. 确认删除弹窗：添加 `backdrop-blur` 效果
3. 操作日志：每个操作后输出 `console.log` 记录最新数据
4. 刷新筛选器：类别修改后自动更新筛选器选项

## 技术要点

### 移动端底部抽屉样式
```html
<div class="fixed inset-0 z-[140] flex items-end justify-center p-0 md:p-4 md:items-center modal-blur">
  <div class="relative bg-white w-full max-w-md h-auto max-h-[80vh] rounded-none md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col fade-in modal-content-box max-md:rounded-t-[2.5rem] max-md:rounded-b-none">
    <!-- 内容 -->
  </div>
</div>
```

### 列表项交互样式
```html
<div class="group flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-md rounded-2xl mb-2 transition-all">
  <span class="font-bold text-slate-700">户外照明</span>
  <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <button class="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"><i class="ph-bold ph-pencil-simple"></i></button>
    <button class="p-2 text-rose-400 hover:bg-rose-50 rounded-lg"><i class="ph-bold ph-trash"></i></button>
  </div>
</div>
```

### 动画CSS
```css
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.max-md\:slide-up {
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```
