# 仓库调拨 (Warehouse Transfer) - Product Requirement Document

## Overview
- **Summary**: 在商贸智脑 (TradeMind) 的产品中心实现仓库调拨功能，允许用户在不同仓库之间调拨产品，支持同价调拨和变价调拨两种模式。
- **Purpose**: 解决商贸企业在多仓库管理场景下的产品调拨需求，提供便捷、直观的调拨操作界面。
- **Target Users**: 商贸企业仓库管理人员、产品中心操作人员

## Goals
- 在仓库管理列表中添加调拨入口按钮
- 提供完整的调拨操作弹窗，支持选择目标仓库和调拨类型
- 实现调拨产品清单展示，支持单价编辑（仅在变价调拨模式）
- 提供实时价格计算和总价值统计
- 完美适配移动端，提供响应式布局
- 与现有系统风格保持一致

## Non-Goals (Out of Scope)
- 不实现真正的后台数据持久化（当前仅模拟数据操作）
- 不实现调拨历史记录查询功能
- 不实现复杂的库存扣减逻辑（当前仅模拟操作）
- 不实现多仓库库存的完整管理（当前仅展示模拟数据）

## Background & Context
- 现有产品中心已有仓库管理抽屉，展示了仓库列表
- 已有完整的产品数据模型和仓库数据模型
- 现有系统使用 Tailwind CSS 和 Phosphor Icons 实现高级 UI 设计
- 移动端已有良好的适配基础

## Functional Requirements
- **FR-1**: 在仓库管理列表的每个仓库操作列中，在编辑图标左侧添加调拨按钮
- **FR-2**: 点击调拨按钮打开仓库产品调拨弹窗
- **FR-3**: 调拨弹窗显示源仓库名称和目标仓库选择下拉框
- **FR-4**: 提供调拨类型选择（同价调拨/变价调拨），使用药丸组样式
- **FR-5**: 展示源仓库的产品清单表格，包含产品名称、单价、数量、总价
- **FR-6**: 同价调拨模式下，单价和总价输入框为只读状态
- **FR-7**: 变价调拨模式下，单价和总价输入框可编辑
- **FR-8**: 监听单价或数量变化，实时更新行总价和调拨总价值
- **FR-9**: 支持确认调拨操作，打印调拨数据包和显示成功提示
- **FR-10**: 完美适配移动端，弹窗在小屏幕上转为全屏卡片布局

## Non-Functional Requirements
- **NFR-1**: 调拨弹窗尺寸为 max-w-4xl，圆角为 rounded-[2.5rem]
- **NFR-2**: 调拨按钮使用 ph-swap 图标，颜色为 text-amber-500
- **NFR-3**: 操作响应时间 < 100ms（仅前端操作）
- **NFR-4**: 与现有系统 UI 风格保持完全一致
- **NFR-5**: 移动端适配覆盖 320px 到 768px 屏幕宽度

## Constraints
- **Technical**: 必须使用现有的技术栈（HTML5, Tailwind CSS, Vanilla JavaScript）
- **Business**: 必须与现有产品中心的设计风格完全一致
- **Dependencies**: 依赖现有的产品数据模型、仓库数据模型和 UI 组件库

## Assumptions
- 每个仓库都有完整的产品库存数据
- 产品调拨时的数量格式使用现有的 formatStock 函数（如果存在）
- 系统已有 toast 提示组件（TM_UI.toast）
- 现有仓库列表可以动态渲染，支持传递 warehouseId

## Acceptance Criteria

### AC-1: 调拨入口按钮显示
- **Given**: 用户在产品中心页面，打开仓库管理抽屉
- **When**: 查看仓库列表
- **Then**: 每个仓库的操作列中，在编辑图标左侧都有一个调拨按钮（ph-swap图标，琥珀色）
- **Verification**: `human-judgment`
- **Notes**: 按钮需有 title="仓库调拨" 属性

### AC-2: 调拨弹窗打开
- **Given**: 用户点击了某个仓库的调拨按钮
- **When**: 打开调拨弹窗
- **Then**: 
  - 弹窗正确显示，尺寸为 max-w-4xl，圆角 rounded-[2.5rem]
  - 弹窗标题显示"仓库产品调拨"
  - 弹窗头部显示源仓库名称
- **Verification**: `human-judgment`

### AC-3: 目标仓库选择
- **Given**: 调拨弹窗已打开
- **When**: 查看目标仓库下拉框
- **Then**: 下拉框显示所有可用仓库，但排除当前源仓库
- **Verification**: `human-judgment`

### AC-4: 调拨类型切换
- **Given**: 调拨弹窗已打开
- **When**: 
  - 默认显示"同价调拨"选中
  - 切换到"变价调拨"
  - 再切换回"同价调拨"
- **Then**: 
  - "同价调拨"模式下，单价和总价输入框为只读/禁用状态
  - "变价调拨"模式下，单价和总价输入框可以编辑
  - 切换有明显的视觉反馈
- **Verification**: `human-judgment`

### AC-5: 产品清单展示
- **Given**: 调拨弹窗已打开
- **When**: 查看产品清单
- **Then**: 
  - 表格正确显示产品名称、单价、数量、总价列
  - 数量显示为"X箱X包"格式（或类似的商贸专用格式）
  - 表格样式与现有系统一致
- **Verification**: `human-judgment`

### AC-6: 实时价格计算
- **Given**: 变价调拨模式已开启
- **When**: 用户修改某个产品的单价或数量
- **Then**: 
  - 该行的总价实时更新
  - 弹窗底部的调拨总价值实时更新
- **Verification**: `human-judgment`

### AC-7: 确认调拨操作
- **Given**: 
  - 用户已选择目标仓库
  - 用户已确认产品清单和价格
- **When**: 点击确认调拨按钮
- **Then**: 
  - 控制台打印完整的调拨数据包（JSON格式）
  - 调用 refreshData() 刷新界面（如果存在）
  - 显示成功提示（TM_UI.toast）
  - 关闭调拨弹窗
- **Verification**: `human-judgment`

### AC-8: 移动端适配
- **Given**: 用户在移动设备上访问（屏幕宽度 < 768px）
- **When**: 打开调拨弹窗
- **Then**: 
  - 弹窗应用 fixed inset-0 rounded-none 样式，全屏显示
  - 产品清单表格转为卡片布局，便于移动端查看
  - 所有操作按钮大小适中，易于点击
- **Verification**: `human-judgment`

## Open Questions
- [ ] 仓库数据模型是否需要扩展以支持库存数据？
- [ ] 是否需要实现 formatStock 函数来格式化数量显示为"X箱X包"格式？
- [ ] TM_UI.toast 组件是否已存在，如果不存在需要什么替代方案？
- [ ] window.ProductModule.refreshData() 函数是否需要新建？
