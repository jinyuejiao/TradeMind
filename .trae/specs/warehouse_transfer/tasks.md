# 仓库调拨 (Warehouse Transfer) - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 在仓库列表中添加调拨入口按钮
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在仓库管理抽屉的仓库列表中，每个仓库的操作列里添加调拨按钮
  - 按钮使用 ph-bold ph-swap 图标，text-amber-500 颜色
  - 按钮在编辑图标左侧，title="仓库调拨"
  - 按钮调用 window.ProductModule.openTransferModal(warehouseId)
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `human-judgement` TR-1.1: 每个仓库都有调拨按钮，位置在编辑图标左侧
  - `human-judgement` TR-1.2: 按钮样式正确，图标是 ph-swap，颜色是琥珀色
  - `human-judgement` TR-1.3: 鼠标悬停显示"仓库调拨"提示
- **Notes**: 仓库列表目前是硬编码的，后续可能需要改成动态渲染

## [ ] Task 2: 创建调拨弹窗 HTML 结构
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在 product-center.html 中添加完整的调拨弹窗 HTML 结构
  - 弹窗尺寸：max-w-4xl，圆角：rounded-[2.5rem]
  - 包含头部（标题、源仓库显示、关闭按钮）
  - 包含调拨类型选择（药丸组样式）
  - 包含目标仓库选择下拉框
  - 包含产品清单表格
  - 包含底部操作区（总价值显示、取消/确认按钮）
  - 添加移动端适配样式
- **Acceptance Criteria Addressed**: [AC-2, AC-3, AC-5, AC-8]
- **Test Requirements**:
  - `human-judgement` TR-2.1: 弹窗结构完整，包含所有必要部分
  - `human-judgement` TR-2.2: PC端弹窗样式正确（max-w-4xl, rounded-[2.5rem]）
  - `human-judgement` TR-2.3: 移动端弹窗全屏显示（fixed inset-0 rounded-none）
  - `human-judgement` TR-2.4: 表格包含产品名称、单价、数量、总价列

## [ ] Task 3: 实现调拨类型切换逻辑
- **Priority**: P0
- **Depends On**: Task 2
- **Description**: 
  - 在 window.ProductModule 下添加 switchTransferType(type) 函数
  - 实现同价调拨/变价调拨的视觉切换
  - 同价调拨时，单价和总价输入框设为 disabled
  - 变价调拨时，单价和总价输入框设为可编辑
  - 添加视觉反馈（选中状态的背景色和文字颜色）
- **Acceptance Criteria Addressed**: [AC-4]
- **Test Requirements**:
  - `human-judgement` TR-3.1: 默认显示"同价调拨"选中状态
  - `human-judgement` TR-3.2: 切换到"变价调拨"时，单价输入框可以编辑
  - `human-judgement` TR-3.3: 切换回"同价调拨"时，单价输入框被禁用
  - `human-judgement` TR-3.4: 药丸组有明显的选中视觉反馈

## [ ] Task 4: 实现 openTransferModal 函数
- **Priority**: P0
- **Depends On**: Task 2, Task 3
- **Description**: 
  - 在 window.ProductModule 下添加 openTransferModal(warehouseId) 函数
  - 打开调拨弹窗
  - 显示源仓库名称
  - 渲染目标仓库下拉框（排除当前源仓库）
  - 渲染产品清单表格
  - 默认选择"同价调拨"模式
- **Acceptance Criteria Addressed**: [AC-2, AC-3, AC-5]
- **Test Requirements**:
  - `human-judgement` TR-4.1: 点击调拨按钮可以正常打开弹窗
  - `human-judgement` TR-4.2: 弹窗头部显示正确的源仓库名称
  - `human-judgement` TR-4.3: 目标仓库下拉框不包含当前源仓库
  - `human-judgement` TR-4.4: 产品清单表格正确显示产品数据

## [ ] Task 5: 实现实时价格计算逻辑
- **Priority**: P0
- **Depends On**: Task 4
- **Description**: 
  - 监听单价输入框的 input 事件
  - 实现 calculateRowTotal(rowId) 函数计算单行总价
  - 实现 calculateGrandTotal() 函数计算调拨总价值
  - 实时更新行总价和底部总价值显示
  - 如果没有 formatStock 函数，实现简单的数量格式化
- **Acceptance Criteria Addressed**: [AC-6]
- **Test Requirements**:
  - `human-judgement` TR-5.1: 修改单价时，行总价实时更新
  - `human-judgement` TR-5.2: 任何价格变化时，底部总价值实时更新
  - `human-judgement` TR-5.3: 价格计算正确（单价 × 数量 = 总价）

## [ ] Task 6: 实现确认调拨逻辑
- **Priority**: P0
- **Depends On**: Task 5
- **Description**: 
  - 实现 confirmTransfer() 函数
  - 校验是否已选择目标仓库
  - 收集调拨数据，生成完整的数据包
  - 在控制台打印 JSON 格式的调拨数据包
  - 调用 window.ProductModule.refreshData()（如果存在）
  - 调用 TM_UI.toast 显示成功提示
  - 关闭调拨弹窗
- **Acceptance Criteria Addressed**: [AC-7]
- **Test Requirements**:
  - `human-judgement` TR-6.1: 未选择目标仓库时提示用户
  - `human-judgement` TR-6.2: 控制台正确打印调拨数据包
  - `human-judgement` TR-6.3: 显示成功提示
  - `human-judgement` TR-6.4: 操作完成后正确关闭弹窗

## [ ] Task 7: 创建测试数据和辅助函数
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 创建 window.TM_MOCK_WAREHOUSES 数组，包含仓库数据
  - 创建 window.TM_MOCK_WAREHOUSE_STOCKS 对象，包含各仓库的产品库存数据
  - 实现 formatStock(qty) 函数，格式化数量为"X箱X包"格式
  - 实现 window.ProductModule.refreshData() 函数（空实现或模拟刷新）
  - 如果 TM_UI.toast 不存在，实现简单的替代方案
- **Acceptance Criteria Addressed**: [AC-5, AC-7]
- **Test Requirements**:
  - `human-judgement` TR-7.1: 测试数据完整且格式正确
  - `human-judgement` TR-7.2: formatStock 函数正确格式化数量
  - `human-judgement` TR-7.3: 所有辅助函数可以正常调用

## [x] Task 8: 完善移动端适配和 UI 优化
- **Priority**: P1
- **Depends On**: Task 2, Task 4
- **Description**: 
  - 完善移动端的表格到卡片布局转换
  - 优化移动端的按钮大小和间距
  - 确保所有交互元素在移动端易于点击
  - 添加动画和过渡效果，提升用户体验
  - 检查所有样式与现有系统的一致性
- **Acceptance Criteria Addressed**: [AC-8]
- **Test Requirements**:
  - `human-judgement` TR-8.1: 移动端表格正确转为卡片布局
  - `human-judgement` TR-8.2: 按钮大小适中，易于点击
  - `human-judgement` TR-8.3: UI 风格与现有系统完全一致
  - `human-judgement` TR-8.4: 过渡动画流畅自然
