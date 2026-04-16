# 仓库调拨弹窗优化 - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 修改调拨类型选择为圆形勾选框
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 移除现有的药丸组样式（type-same 和 type-diff 按钮）
  - 添加仅变价调拨的圆形勾选框
  - 标签为"变价调拨"
  - 默认状态为未勾选（表示同价调拨）
  - 修改 switchTransferType 函数以支持新的交互方式
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `human-judgement` TR-1.1: 不再显示药丸组按钮
  - `human-judgement` TR-1.2: 显示圆形勾选框，标签为"变价调拨"
  - `human-judgement` TR-1.3: 默认未勾选，单价输入框禁用
  - `human-judgement` TR-1.4: 勾选后，单价输入框可以编辑

## [ ] Task 2: 在产品列表添加新增行按钮
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在"产品清单"标题右侧添加"新增行"按钮
  - 按钮样式：使用 teal-500 配色，圆角设计
  - 按钮图标：使用 ph-plus 图标
  - 按钮调用 window.ProductModule.addProductRow()
- **Acceptance Criteria Addressed**: [AC-2]
- **Test Requirements**:
  - `human-judgement` TR-2.1: 在产品清单标题右侧有新增行按钮
  - `human-judgement` TR-2.2: 按钮样式符合系统设计风格
  - `human-judgement` TR-2.3: 按钮有适当的 hover 效果

## [ ] Task 3: 实现 addProductRow() 函数
- **Priority**: P0
- **Depends On**: Task 2
- **Description**: 
  - 在 window.ProductModule 中添加 addProductRow() 函数
  - 创建新的表格行 HTML 结构
  - 产品列使用下拉框（select），显示源仓库的所有产品
  - 下拉框选项包含产品名称和 SKU
  - 下拉框有 onchange 事件，调用 handleProductSelect(rowId, productId)
  - 每行有删除按钮，点击调用 removeProductRow(rowId)
  - 为新增的行分配唯一的 rowId
- **Acceptance Criteria Addressed**: [AC-3]
- **Test Requirements**:
  - `human-judgement` TR-3.1: 点击新增行按钮可以添加新行
  - `human-judgement` TR-3.2: 新行的产品列是下拉框
  - `human-judgement` TR-3.3: 下拉框显示源仓库的所有可用产品
  - `human-judgement` TR-3.4: 每行有删除按钮

## [ ] Task 4: 实现 handleProductSelect() 函数
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 在 window.ProductModule 中添加 handleProductSelect(rowId, productId) 函数
  - 根据 productId 从源仓库库存数据中获取产品信息
  - 自动填充该产品的默认单价
  - 设置默认数量（如 1）
  - 自动计算该行的总价
  - 更新总调拨价值
- **Acceptance Criteria Addressed**: [AC-4]
- **Test Requirements**:
  - `human-judgement` TR-4.1: 选择产品后自动填充单价
  - `human-judgement` TR-4.2: 选择产品后设置默认数量
  - `human-judgement` TR-4.3: 选择产品后自动计算总价
  - `human-judgement` TR-4.4: 总调拨价值自动更新

## [ ] Task 5: 实现 removeProductRow() 函数
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 在 window.ProductModule 中添加 removeProductRow(rowId) 函数
  - 删除指定 rowId 的表格行
  - 重新计算总调拨价值
  - 确保至少保留一行（可选，或者允许全部删除）
- **Acceptance Criteria Addressed**: [AC-5]
- **Test Requirements**:
  - `human-judgement` TR-5.1: 点击删除按钮可以删除该行
  - `human-judgement` TR-5.2: 删除后总调拨价值自动更新
  - `human-judgement` TR-5.3: 剩余行的顺序保持不变

## [ ] Task 6: 优化移动端适配
- **Priority**: P1
- **Depends On**: Task 1, Task 2, Task 3
- **Description**: 
  - 确保勾选框在移动端显示正常
  - 确保新增行按钮在移动端大小适中（易于点击）
  - 确保产品下拉框在移动端易于操作
  - 检查整体布局在移动端不拥挤
- **Acceptance Criteria Addressed**: [AC-6]
- **Test Requirements**:
  - `human-judgement` TR-6.1: 勾选框在移动端显示正常
  - `human-judgement` TR-6.2: 新增行按钮在移动端易于点击
  - `human-judgement` TR-6.3: 产品下拉框在移动端操作方便
  - `human-judgement` TR-6.4: 所有元素布局合理，不拥挤

## [ ] Task 7: 更新现有产品数据渲染逻辑
- **Priority**: P1
- **Depends On**: Task 3
- **Description**: 
  - 修改 renderProductList 函数，使初始加载的产品行也支持删除
  - 或者，决定是否保留现有硬编码的产品行
  - 确保新老产品行都能正确计算总价
  - 确保所有产品行都参与总价值计算
- **Acceptance Criteria Addressed**: [AC-3, AC-4]
- **Test Requirements**:
  - `human-judgement` TR-7.1: 初始产品行和新增行都能正确显示
  - `human-judgement` TR-7.2: 所有产品行都能正确计算总价
  - `human-judgement` TR-7.3: 所有产品行都参与总价值计算
