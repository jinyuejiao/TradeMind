# 产品中心问题修复计划

## 问题分析

### 问题1：筛选器无法点击和展示筛选效果
**可能原因**：
- JavaScript初始化代码使用了`DOMContentLoaded`事件，但产品中心是作为模块加载的，可能没有正确触发
- 筛选器下拉菜单的z-index可能被其他元素遮挡
- 需要确保JavaScript文件在DOM加载后能够正确执行

### 问题2：产品列表展示需要简化
**需求**：
- 删除产品名称下方的产品类别展示
- 仅保留产品名称、SKU、销售均价、库存数量和管理按钮
- 简化桌面端和移动端的展示

## 修复计划

### Step 1：修复筛选器初始化和交互问题

**修改文件**：
- `JsImpl/product-center.js`
- `modules/product-center/product-center.html`

**具体任务**：
1. 移除`DOMContentLoaded`事件监听器，改用直接初始化调用
2. 确保筛选器下拉菜单的z-index层级足够高
3. 添加调试代码确保函数能被正确调用
4. 在HTML文件中添加初始化调用

### Step 2：简化产品列表展示（桌面端）

**修改文件**：
- `JsImpl/product-center.js`
- `modules/product-center/product-center.html`

**具体任务**：
1. 修改`renderDesktopTable`函数，移除产品类别标签展示
2. 简化产品信息展示，仅保留产品名称和SKU
3. 更新HTML中的静态产品行示例

### Step 3：简化产品列表展示（移动端）

**修改文件**：
- `JsImpl/product-center.js`
- `modules/product-center/product-center.html`

**具体任务**：
1. 修改`renderMobileCards`函数，移除产品类别标签展示
2. 简化产品卡片信息展示
3. 更新HTML中的静态产品卡片示例

### Step 4：添加进货均价列

**修改文件**：
- `JsImpl/product-center.js`
- `modules/product-center/product-center.html`

**具体任务**：
1. 在产品数据模型中添加进货均价字段
2. 在表格中添加进货均价列
3. 更新渲染函数以展示进货均价

### Step 5：测试和验证

**具体任务**：
1. 测试筛选器的点击和下拉效果
2. 测试筛选功能是否正常工作
3. 验证产品列表展示是否简化
4. 确保所有功能正常工作

## 技术实现要点

1. **初始化问题**：直接调用初始化函数，而不是依赖DOMContentLoaded事件
2. **样式层级**：确保筛选器下拉菜单的z-index足够高
3. **简化展示**：移除不必要的类别标签，保持界面简洁
4. **数据完整性**：确保产品数据包含所有必要字段
