# TradeMind UI 模块化重构方案

## 1. 现状审计摘要

### 1.1 HTML / CSS 形态

- **壳层**：`index.html` 承载侧边栏、会员弹窗、主内容区（多 Tab 视图容器）及移动端底栏；业务视图通过 `fetch` 注入 `#view-dashboard`、`#view-biz`、`#view-crm`、`#view-supply` 等节点。
- **模块页**：`modules/product-center/product-center.html`、`modules/crm/crm.html` 等为「大块 HTML 字符串」，内含卡片容器、表格、筛选条、多个弹窗；Tailwind 工具类与少量自定义类（如 `form-input`、`modal-blur`）混用。
- **样式**：`CSS/main.css` 含 `:root` 品牌色、表单、导航态、CRM 移动端展示等；`MobileAdapt/mobile.css` 含大量 `max-width: 768px` 规则及「产品中心表格隐藏 / 卡片展示」等。
- **脚本**：`JsImpl/main.js` 体量大，CRM 详情仍使用 `window.innerWidth < 768` 做分支；产品中心移动端列表主要由 CSS 驱动展示形态，`product-center.js` 负责填充 `#mobile-product-cards`。

### 1.2 高频 UI 形态（组件化候选）

| 形态 | 典型出现位置 | 原子化方向 |
|------|----------------|------------|
| **卡片容器** | 产品库白底圆角块、CRM 详情块 | `tm-card`（边框/圆角/阴影用 token）+ 可选 `tm-card__header` |
| **侧边栏** | 桌面导航 `aside`、CRM 列表栏 | **Core** `layout_base` 侧栏插槽；CRM 列表列为「模块内布局」 |
| **列表项** | CRM `customer-card`、表格行 | 行级 `tm-list-row`；表格保持语义化 `<table>`，样式绑定 token |
| **弹窗** | 会员中心、成本分析、进货单等 | `tm-modal`（overlay + `rounded-[var(--tm-radius-modal)]`） |

> 说明：当前阶段以 **Design Token + 插槽 + 片段 HTML** 为主，避免一次性大规模改写 class 名导致 wholesale 回归风险。

---

## 2. 目标架构：Core / Fragments / Adaptation

### 2.1 三层职责

1. **核心层 (Core)**  
   - 设计令牌（颜色、圆角、阴影、断点语义）。  
   - 无行业含义的布局骨架（`layout_base.html` 仅作约定与预览参考）。  
   - 全局基础样式（`main.css` 中与业务无关部分逐步收敛到 token）。

2. **行业片段层 (Fragments)**  
   - 按 `MerchantType` 分目录的纯 HTML 片段（无强制 JS 依赖）。  
   - 通过 **插槽** 注入到模块页预留节点，实现「同一模块、不同行业增量 UI」。

3. **适配层 (Adaptation)**  
   - **TM_UI_Loader.js**：解析 `TM_UI_CONTEXT.industry`，设置 `data-merchant-type`，加载片段。  
   - **TM_ShellLoader.js**：将 `Core/partials/` 中桌面侧栏、移动端底栏注入 `index.html` 的 `data-tm-shell` 节点，与 `layout_base` 中 SLOT_SIDEBAR / SLOT_MOBILE_NAV 对齐。  
   - **TM_Responsive.js**：统一「移动端 / 桌面端」判定与 body 布局类（与 CSS `max-width:767px`、Tailwind `md` 一致）。  
   - **TM_RoleGate.js**：基于 `data-role` 做控件显隐（预览 / 模拟角色）。

### 2.2 目录规范（建议）

```
/CSS
  theme.css              # Design Tokens + 行业皮肤覆盖
  main.css               # 组件级样式，引用 token
/MobileAdapt
  mobile.css             # 现有移动端样式（逐步与 TM_Responsive 语义对齐）
  TM_Responsive.js
/Core
  layout_base.html       # 页面骨架参考（插槽注释）
  partials/              # 壳层 HTML：desktop-sidebar、mobile-bottom-nav（TM_ShellLoader）
/modules                 # 现有按业务加载的模块 HTML（逐步插入槽位）
/fragments
  /wholesale/…           # 批发（可为空，表示不追加）
  /foreign/…
  /ecom/…
  /factory/…
/Adaptation
  TM_UI_Loader.js
  TM_ShellLoader.js
  TM_RoleGate.js
/docs
  TradeMind_UI_模块化重构方案.md
  UI_Framework_Guide.md
```

---

## 3. 插槽 (Slot) 机制与动态切换

### 3.1 约定

- 在模块 HTML 中预留容器：  
  `data-tm-fragment-scope="product-center"` + `data-tm-slot="after-filters"`  
- 加载路径：  
  `./fragments/{industryKey}/{scope}/{slot}.html`  
  其中 `industryKey ∈ { wholesale, foreign, ecom, factory }`，由 `TM_UI_CONTEXT.industry` 映射。

### 3.2 运行时流程

1. 页面或模块 `fetch` 完成后，对 **该视图根节点** 调用 `TM_UI.injectSlots(root)`。  
2. Loader 设置 `document.documentElement` 的 `data-merchant-type`（如 `FOREIGN`）。  
3. 对每个插槽节点 `fetch` 对应片段；成功则写入 `innerHTML`，失败或 wholesale 无文件则 **清空**，避免从上一行业残留 DOM。  
4. `TM_RoleGate.apply()` 根据 `TM_UI_CONTEXT.role` 与元素的 `data-role` 更新显隐。

### 3.3 与 Tailwind 的关系

- `index.html` 中 Tailwind `brand` 色扩展为 `var(--tm-brand-*)`，片段内继续使用 `bg-brand-500` 等即可随行业皮肤变化。

### 3.4 MerchantType / UserRole

- **MerchantType**：`WHOLESALE | FOREIGN | ECOM | FACTORY`（可扩展）。  
- **UserRole**：约定大写字符串，如 `ADMIN`、`SALES`（与后端对齐时再映射）。  
- **控制台切换**：`window.TM_UI_CONTEXT.industry = 'FOREIGN'` 通过 `Proxy` 触发重新注入与皮肤更新。

---

## 4. 验收对齐

| 标准 | 落实方式 |
|------|-----------|
| 批发界面不退化 | wholesale 不加载片段或加载空；默认 token 与原先 `#14B8A6` 一致 |
| `/modules` 无重复 CSS | 新增样式优先进 `theme.css` / `main.css`，片段不写重复全局规则 |
| 控制台切换行业 | `TM_UI_CONTEXT` + `injectSlots` + `data-merchant-type` |
| 品牌色与圆角 | `--tm-brand-500: #14B8A6`，`--tm-radius-3xl: 2.5rem`，弹窗层 `--tm-radius-modal` |

---

## 5. 后续迭代（需您确认再执行）

- 将 `index.html` 主体物理迁移为「组装 layout_base + 区块 partial」。  
- 将 `main.js` 按领域拆文件（当前单文件过大）。  
- 原子组件抽成独立 `.html` partial 或引入构建步骤（Vite 等）。

本次落地遵循 **「不动核心、只拆结构」**：优先 **插槽 + 令牌 + 适配脚本**，文件路径保持 `modules/...` 与原有 `fetch` 一致，避免预览失效。
