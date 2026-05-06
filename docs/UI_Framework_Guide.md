# TradeMind UI 框架开发指南

本文档说明在本工程中 **新增原子样式 / 行业片段 / 全站换肤** 的推荐做法。  
**Cursor 可复制指令与正式工程迁移说明**：见同目录 [`Cursor_商户类型UI扩展_指令集.md`](./Cursor_商户类型UI扩展_指令集.md)；持久规则见仓库 `.cursor/rules/trademind-ui-merchant-framework.mdc`。

**登录 / 注册静态页**：根目录 [`login.html`](../login.html)、[`register.html`](../register.html)，样式 [`CSS/auth.css`](../CSS/auth.css)；注册所选商户类型写入 `sessionStorage.tm_register_merchant_type`，进入主应用后由 `TM_UI_Loader` 同步到 `TM_UI_CONTEXT.industry`。

## 1. 设计令牌（全站风格）

- 主定义文件：`CSS/theme.css`  
- 根命名空间：`--tm-*`（如 `--tm-brand-500`、`--tm-radius-3xl`）。  
- 行业皮肤：在 `document.documentElement` 上设置 `data-merchant-type="FOREIGN"` 等，由 `theme.css` 中对应选择器覆盖令牌。

**快速调整品牌色示例（控制台）：**

```js
document.documentElement.style.setProperty('--tm-brand-500', '#0d9488');
```

批量行业切换应使用 `window.TM_UI_CONTEXT.industry = 'FOREIGN'`，以便同步片段注入与 `data-merchant-type`。

## 2. 新增一个「原子组件」

当前工程为静态 HTML + Tailwind CDN，推荐步骤：

1. **样式**：仅使用 token（`var(--tm-brand-500)`）或 Tailwind `brand` / `rounded-[var(--tm-radius-3xl)]`，勿写死的 `#14B8A6`（特殊渐变除外需在 `theme.css` 增加变量）。  
2. **结构**：在对应 `modules/...html` 内增加一段 markup；若多页复用，可抽到 `Core/partials/xxx.html`（后续构建时再引入 include）。  
3. **行为**：JS 放在 `JsImpl/`，通过 `window` 上有限 API 暴露，避免模块间隐式全局污染。

## 3. 为新行业编写 UI 片段

1. 在 `fragments/{行业目录}/` 下创建与插槽一致的路径，例如：  
   `fragments/foreign/product-center/after-filters.html`
2. 片段内容应为 **局部 HTML**，勿包含 `<html>`/`<body>`。  
3. 在模块页中为插槽容器添加：  
   `data-tm-fragment-scope="product-center"` + `data-tm-slot="after-filters"`  
4. 确保该模块加载完成后执行 `TM_UI.injectSlots(视图根节点)`（产品中心、CRM 已在加载流程中接入）。

**行业目录名映射**（`TM_UI_CONTEXT.industry` → 文件夹）：

| 上下文值 | 目录 |
|-----------|------|
| WHOLESALE | wholesale |
| FOREIGN | foreign |
| ECOM | ecom |
| FACTORY | factory |

## 4. 角色与 `data-role`

- 在仅管理员可见的控件上添加：  
  `data-role="ADMIN"`  
  多个角色可用空格或逗号：`data-role="ADMIN MANAGER"`  
- 当前登录角色来自 `window.TM_UI_CONTEXT.role`（大写）。  
- 切换角色后调用 `TM_RoleGate.apply()`（`TM_UI` 注入流程末尾会自动调用）。

示例：

```html
<button data-role="ADMIN" onclick="confirmDeleteClient('John')">删除</button>
```

业务员预览：`TM_UI_CONTEXT.role = 'SALES'` → 带 `data-role="ADMIN"` 的按钮隐藏。

## 5. 响应式与业务解耦

- 视图宽度判定请使用 `MobileAdapt/TM_Responsive.js` 的 `TM_Responsive.isMobileView()`，与 Tailwind `md` 断点（768px）语义一致：`< 768` 为移动布局。  
- 具体「表格隐去 / 卡片展示」仍以 CSS 为主（`mobile.css`），JS 仅处理 **必须用脚本切换的状态**（如 CRM 列表/详情栈）。

## 6. 壳层组装（index 与 layout_base 对齐）

- **桌面侧栏**：`index.html` 中 `data-tm-shell="desktop-sidebar"`，片段 **`Core/partials/desktop-sidebar.html`**，由 **`Adaptation/TM_ShellLoader.js`** 在 `DOMContentLoaded` 时 `fetch` 注入。  
- **移动端底栏**：`data-tm-shell="mobile-bottom-nav"`，片段 **`Core/partials/mobile-bottom-nav.html`**。  
- 修改导航项或 Tab 时，请只改上述 partial（或与 `index` 内占位骨架保持一致），避免双处手写分叉。  
- 全局 API：`window.TM_ShellLoader.loadAll()` 可手动重新拉取壳层（调试用法）。

## 7. 参考 Demo

- **产品中心**：`modules/product-center/product-center.html` — 含插槽注释与批发默认布局；外贸片段见 `fragments/foreign/product-center/`。  
- **布局骨架参考**：`Core/layout_base.html`（注释说明与 `index.html`、TM_ShellLoader 的对应关系）。

## 8. `TM_UI` 命名空间合并

`JsImpl/main.js` 会在加载早期挂载 `TM_UI.toast` 等能力；`Adaptation/TM_UI_Loader.js` 通过 **`Object.assign`** 合并注入 `injectSlots`、`refreshAll`，请勿在后续脚本中整体重写 `window.TM_UI = { … }`，否则会丢失 toast 与其它扩展。

## 9. 控制台调试清单

```js
// 切换行业（会触发片段重新拉取）
window.TM_UI_CONTEXT.industry = 'FOREIGN';

// 切换角色
window.TM_UI_CONTEXT.role = 'SALES';

// 手动刷新当前已挂载视图中的插槽
window.TM_UI.refreshAll();
```
