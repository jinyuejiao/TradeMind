# 产品中心最终修复计划

## 核心诊断总结
1. **作用域断层**：HTML中的onclick属性只能访问window全局作用域的函数
2. **动态加载时序**：fetch异步加载HTML后需要延迟初始化
3. **路径问题**：使用绝对路径确保在子路由下也能正常加载

## 修复步骤

### Step 1: 强制全局暴露函数
**目标**：确保所有被HTML调用的函数都挂载到window对象

**修改文件**：`JsImpl/product-center.js`

**具体任务**：
1. 所有HTML中会调用的函数都使用`window.funcName = function()`的形式定义
2. 确保以下函数被挂载：
   - `window.toggleDropdown`
   - `window.selectCategory`
   - `window.selectSupplier`
   - `window.selectStockStatus`
   - `window.resetFilters`
   - `window.filterInventoryTable`
   - `window.initProductCenter`
   - `window.openProductDetail`
   - `window.closeProductDetail`
   - 以及其他所有被HTML调用的函数
3. 在每个函数内部添加详细的console.log调试信息
4. 确保`toggleDropdown`有完整的event.stopPropagation()逻辑

### Step 2: 修复动态加载与路径逻辑
**目标**：解决动态HTML加载的时序问题

**修改文件**：`JsImpl/main.js`、`index.html`

**具体任务**：
1. **index.html** - 将脚本路径从`./JsImpl/product-center.js`改为`/JsImpl/product-center.js`（绝对路径）
2. **main.js** - 在`loadProductCenter`函数中添加延迟初始化
   - 在设置innerHTML后使用`setTimeout(() => { window.initProductCenter(); }, 50)`
   - 确保DOM完全渲染后再初始化
3. 添加加载验证日志

### Step 3: UI渲染标准对齐
**目标**：确保UI渲染正确

**修改文件**：`JsImpl/product-center.js`

**具体任务**：
1. 确认HTML中的容器ID正确：
   - 桌面端表格：`#existingProdTable tbody`
   - 移动端卡片：`#mobile-product-cards`
2. 添加空状态处理 - 如果数据为空，渲染"暂无产品"提示
3. 确保所有渲染函数都有console.log调试信息

## 预期结果
1. 不再出现`ReferenceError: toggleDropdown is not defined`错误
2. 产品列表正确展示模拟数据
3. 筛选器功能正常工作
4. 控制台有清晰的调试日志
