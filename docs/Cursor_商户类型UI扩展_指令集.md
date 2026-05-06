# Cursor 指令集：商户类型平滑扩展（正式工程可参考）

本文提供两类材料：**项目内规则文件路径**，以及可复制到 Cursor **Chat / Composer** 的指令模板。将本仓库 `.cursor/rules/` 与 `docs/UI_Framework_Guide.md` 一并迁移或对照即可。

---

## 一、与本工程绑定的持久规则

| 文件 | 作用 |
|------|------|
| `.cursor/rules/trademind-ui-merchant-framework.mdc` | 编辑 HTML / fragments / Adaptation / theme 时自动提示分层与禁忌 |
| `docs/UI_Framework_Guide.md` | 令牌、片段路径、`data-role`、`TM_ShellLoader` 操作说明 |
| `docs/TradeMind_UI_模块化重构方案.md` | 架构与 Slot 机制总览 |

**迁移到其他仓库时**：复制 `.cursor/rules/trademind-ui-merchant-framework.mdc`，按需改 `globs` 与路径命名（如 `fragments/`、`Adaptation/`）。

---

## 二、可复制指令模板（中文版）

以下可直接粘贴到 Cursor；将 `{占位符}` 换成实际名称。

### 1. 新增一种商户类型（端到端）

```
请在本工程中按「身份感知 UI」约定新增商户类型 {MERCHANT_CODE}（展示目录名 {folder}）：
1. 在 CSS/theme.css 增加 [data-merchant-type="{MERCHANT_CODE}"] 的品牌 RGB 令牌覆盖（保持 Tailwind 使用 rgb(var(--tm-brand-*-rgb) / <alpha-value>)）。
2. 在 Adaptation/TM_UI_Loader.js 的 INDUSTRY_DIR 中注册映射。
3. 新建 fragments/{folder}/ 下与现有模块一致的插槽 HTML（至少占位），避免切换行业后 404 或残留旧片段。
4. 不改 wholesale 默认视觉效果；控制台 TM_UI_CONTEXT.industry = '{MERCHANT_CODE}' 应能换肤并注入片段。
说明文档同步一行即可，勿大段重写无关文件。
```

### 2. 在某业务模块增加可替换插槽

```
在 modules/{模块}.html 中增加行业片段插槽：data-tm-fragment-scope="{scope}" data-tm-slot="{slotName}"。
在 JsImpl/main.js（或对应加载函数）在 innerHTML 赋值并初始化完成后 await TM_UI.injectSlots(该视图根节点)。
在 fragments/foreign/{scope}/{slotName}.html（及 wholesale 空占位）各放一份 HTML，批发可为空注释。
```

### 3. 壳层导航（侧栏 / 底栏）改版

```
主导航仅修改 Core/partials/desktop-sidebar.html 与 Core/partials/mobile-bottom-nav.html；index.html 只保留 data-tm-shell 容器与占位骨架。
禁止在 index 内再复制一套导航按钮；加载逻辑归 Adaptation/TM_ShellLoader.js。
```

### 4. 代码审查 / PR 前自检（粘贴给 Agent）

```
请按 TradeMind UI 规范做一次diff审查：
- 是否新增硬编码 #14B8A6 而未走 theme 令牌？
- 是否整对象赋值 window.TM_UI 导致丢失 toast？
- 移动端 @media max-width 是否为 767px 并与 TM_Responsive 一致？
- 行业片段路径是否为 fragments/{industry}/{scope}/{slot}.html 且失败时清空插槽？
输出问题列表与具体文件行号。
```

### 5. 从其他项目「对齐」本抽象（绿色field）

```
请将当前仓库的 UI 收敛为：theme 令牌 + data-merchant-type + TM_UI_CONTEXT + 按行业目录的 HTML 片段注入 + 可选壳层 partial 注入。
保留现有路由与 fetch 路径；先加插槽与占位片段，再逐步搬迁差异 UI，避免一次性大搬家导致预览失效。
```

---

## 三、架构一句话（写给 README / 立项文档）

**批发等为默认行业；差异 UI 不进 fat 模块文件，而进 `fragments/<行业>/`，通过 `TM_UI.injectSlots` 注入预留节点；全局风格由 `theme.css` + `data-merchant-type` 切换；壳层导航由 `TM_ShellLoader` 注入 `Core/partials`。**

---

## 四、控制台验收（人工或 E2E 脚本）

```js
window.TM_UI_CONTEXT.industry = 'FOREIGN';
window.TM_UI.refreshAll();
window.TM_UI_CONTEXT.role = 'SALES';
// 期望：品牌色按 FOREIGN 令牌变化；ADMIN 专属控件隐藏；toast 仍可用
window.TM_UI.toast && window.TM_UI.toast('ok');
```
