# 供应商管理界面修改 - 产品需求文档

## Overview
- **Summary**: 修改供应商管理界面，调整tab页顺序，移除风险地图看板，增加供应商编辑功能。
- **Purpose**: 优化供应商管理流程，提供更便捷的供应商信息管理功能。
- **Target Users**: 企业采购管理人员、供应商管理人员。

## Goals
- 将进货单据tab页面放在前面，作为默认展示界面
- 移除风险地图看板tab页
- 增加供应商编辑tab页，展示供应商列表，支持增删改供应商信息

## Non-Goals (Out of Scope)
- 不修改现有的进货单据明细功能
- 不修改现有的供应商编辑弹窗功能
- 不添加新的供应商分析功能

## Background & Context
- 现有供应商管理界面包含风险地图看板和进货单据明细两个tab页
- 风险地图看板功能使用率较低
- 缺乏专门的供应商信息管理界面
- 已实现供应商编辑弹窗功能，需要整合到新的tab页中

## Functional Requirements
- **FR-1**: 调整tab页顺序，将进货单据明细放在前面，作为默认展示界面
- **FR-2**: 移除风险地图看板tab页
- **FR-3**: 增加供应商编辑tab页，展示供应商列表
- **FR-4**: 在供应商编辑tab页中支持新增供应商功能
- **FR-5**: 在供应商编辑tab页中支持编辑供应商信息功能
- **FR-6**: 在供应商编辑tab页中支持删除供应商功能

## Non-Functional Requirements
- **NFR-1**: 界面风格与现有系统保持一致
- **NFR-2**: 操作流程简洁明了
- **NFR-3**: 响应式设计，支持桌面端和移动端

## Constraints
- **Technical**: 基于现有HTML、CSS和JavaScript实现
- **Dependencies**: 依赖现有的供应商编辑弹窗功能

## Assumptions
- 供应商编辑弹窗功能已经实现并正常工作
- 系统中已有供应商数据

## Acceptance Criteria

### AC-1: Tab页调整
- **Given**: 打开供应商管理界面
- **When**: 页面加载完成
- **Then**: 进货单据明细tab页显示在前面，并且作为默认展示界面
- **Verification**: `human-judgment`

### AC-2: 风险地图看板移除
- **Given**: 打开供应商管理界面
- **When**: 查看tab页列表
- **Then**: 风险地图看板tab页不存在
- **Verification**: `human-judgment`

### AC-3: 供应商编辑tab页
- **Given**: 打开供应商管理界面
- **When**: 点击供应商编辑tab页
- **Then**: 显示供应商列表，包含供应商名称、联系人、电话、评分等信息
- **Verification**: `human-judgment`

### AC-4: 新增供应商功能
- **Given**: 进入供应商编辑tab页
- **When**: 点击新增供应商按钮
- **Then**: 打开供应商编辑弹窗，表单为空
- **Verification**: `human-judgment`

### AC-5: 编辑供应商功能
- **Given**: 进入供应商编辑tab页
- **When**: 点击供应商列表中的编辑按钮
- **Then**: 打开供应商编辑弹窗，表单填充对应供应商信息
- **Verification**: `human-judgment`

### AC-6: 删除供应商功能
- **Given**: 进入供应商编辑tab页
- **When**: 点击供应商列表中的删除按钮
- **Then**: 显示确认删除对话框，确认后删除供应商
- **Verification**: `human-judgment`

## Open Questions
- [ ] 供应商数据来源是什么？是模拟数据还是真实API调用？
- [ ] 删除供应商时是否需要级联删除相关数据？