/**
 * TradeMind — 多角色 RBAC 视觉预览（Mock）
 * 角色：ADMIN | FINANCE | SALES | WAREHOUSE
 * 依赖：TM_UI_CONTEXT.role、TM_RoleGate、TM_UI.setRole
 */
(function () {
    'use strict';

    window.TM_ROLES = Object.freeze({
        ADMIN: 'ADMIN',
        FINANCE: 'FINANCE',
        SALES: 'SALES',
        WAREHOUSE: 'WAREHOUSE'
    });

    var ROLE_LABELS = {
        ADMIN: '管理员',
        FINANCE: '财务',
        SALES: '业务员',
        WAREHOUSE: '仓库员'
    };

    /** 各角色需隐藏的 data-tm-nav 导航/功能键 */
    var NAV_HIDE_BY_ROLE = {
        SALES: ['biz', 'finance-reports', 'ops'],
        WAREHOUSE: ['finance-reports', 'client-reconcile'],
        FINANCE: ['ai-entry'],
        ADMIN: []
    };

    var STORAGE_KEY = 'tm_preview_role_v1';

    function normalizeRole(r) {
        return String(r || TM_ROLES.ADMIN).trim().toUpperCase();
    }

    function currentRole() {
        return normalizeRole(window.TM_UI_CONTEXT && window.TM_UI_CONTEXT.role);
    }

    function navHiddenForRole(role, navKey) {
        var hide = NAV_HIDE_BY_ROLE[role] || [];
        return hide.indexOf(navKey) !== -1;
    }

    function applySidebarByRole() {
        var role = currentRole();
        document.querySelectorAll('[data-tm-nav]').forEach(function (el) {
            var key = el.getAttribute('data-tm-nav');
            if (!key) return;
            var hidden = navHiddenForRole(role, key);
            el.classList.toggle('tm-nav-hidden', hidden);
            el.setAttribute('aria-hidden', hidden ? 'true' : 'false');
        });
    }

    function ensureActiveTabVisible() {
        var role = currentRole();
        var active = document.querySelector('.nav-btn.active-nav, .mobile-nav-btn.active-nav');
        if (!active) return;
        var onclick = active.getAttribute('onclick') || '';
        var m = onclick.match(/switchTab\(['"](\w+)['"]\)/);
        if (!m) return;
        var tab = m[1];
        var navMap = { dashboard: 'dashboard', biz: 'biz', crm: 'crm', supply: 'supply', supplier: 'supplier' };
        var navKey = navMap[tab];
        if (navKey && navHiddenForRole(role, navKey) && typeof window.switchTab === 'function') {
            window.switchTab('dashboard');
        }
    }

    function maskText(el, label) {
        if (!el) return;
        if (!el.hasAttribute('data-tm-mask-original')) {
            el.setAttribute('data-tm-mask-original', el.textContent);
        }
        el.textContent = '***';
        el.classList.add('tm-sensitive-masked');
        if (label) el.setAttribute('title', label);
    }

    function unmaskText(el) {
        if (!el || !el.hasAttribute('data-tm-mask-original')) return;
        el.textContent = el.getAttribute('data-tm-mask-original');
        el.removeAttribute('data-tm-mask-original');
        el.classList.remove('tm-sensitive-masked');
        el.removeAttribute('title');
    }

    function applyTableColumnMask(table, colIndex, mask) {
        if (!table) return;
        var ths = table.querySelectorAll('thead th');
        if (ths[colIndex]) {
            if (mask) maskText(ths[colIndex], '无权限查看');
            else unmaskText(ths[colIndex]);
        }
        table.querySelectorAll('tbody tr').forEach(function (row) {
            var cells = row.querySelectorAll('td');
            if (!cells[colIndex]) return;
            if (mask) maskText(cells[colIndex], '无权限查看');
            else unmaskText(cells[colIndex]);
        });
    }

    function applyProductCenterMasking(role) {
        var table = document.getElementById('existingProdTable');
        if (!table) return;
        /* 列序：0名称 1销售均价 2进货均价 3毛利 4库存 5管理 */
        if (role === TM_ROLES.SALES) {
            applyTableColumnMask(table, 2, true);
            applyTableColumnMask(table, 3, true);
            table.querySelectorAll('[data-sensitive="purchase"], [data-sensitive="margin"]').forEach(function (el) { maskText(el, '无权限查看'); });
        } else if (role === TM_ROLES.WAREHOUSE) {
            applyTableColumnMask(table, 1, true);
            table.querySelectorAll('[data-sensitive="sale"]').forEach(function (el) { maskText(el, '无权限查看'); });
            applyTableColumnMask(table, 2, false);
            applyTableColumnMask(table, 3, false);
        } else {
            applyTableColumnMask(table, 1, false);
            applyTableColumnMask(table, 2, false);
            applyTableColumnMask(table, 3, false);
            table.querySelectorAll('[data-sensitive]').forEach(unmaskText);
        }

        document.querySelectorAll('#mobile-product-cards [data-sensitive]').forEach(function (el) {
            var kind = el.getAttribute('data-sensitive');
            var shouldMask = (role === TM_ROLES.SALES && (kind === 'purchase' || kind === 'margin')) ||
                (role === TM_ROLES.WAREHOUSE && kind === 'sale');
            if (shouldMask) maskText(el, '无权限查看');
            else unmaskText(el);
        });
    }

    function applyCrmMasking(role) {
        document.querySelectorAll('[data-sensitive="margin"], [data-sensitive="purchase"]').forEach(function (el) {
            if (role === TM_ROLES.SALES) maskText(el, '敏感数据已隐藏');
            else unmaskText(el);
        });
    }

    function applyDataMasking() {
        var role = currentRole();
        applyProductCenterMasking(role);
        applyCrmMasking(role);
        document.documentElement.setAttribute('data-role-mask', role);
    }

    /** 扫描 data-role / data-tm-nav，统一刷新 UI */
    function applyRoleUI() {
        var role = currentRole();
        document.documentElement.setAttribute('data-user-role', role);
        applySidebarByRole();
        if (window.TM_RoleGate && typeof window.TM_RoleGate.apply === 'function') {
            window.TM_RoleGate.apply();
        }
        applyDataMasking();
        ensureActiveTabVisible();
        syncSwitcherActive();
        try {
            localStorage.setItem(STORAGE_KEY, role);
        } catch (e) { /* ignore */ }
    }

    function setPreviewRole(role) {
        var r = normalizeRole(role);
        if (window.TM_UI && typeof window.TM_UI.setRole === 'function') {
            window.TM_UI.setRole(r);
        } else if (window.TM_UI_CONTEXT) {
            window.TM_UI_CONTEXT.role = r;
        }
        applyRoleUI();
    }

    function syncSidebarUserBadge() {
        var role = currentRole();
        var nameEl = document.getElementById('sidebar-user-name');
        var avEl = document.getElementById('sidebar-user-avatar');
        if (nameEl) nameEl.textContent = 'Jin (' + (ROLE_LABELS[role] || role) + ')';
        if (avEl) avEl.textContent = role.slice(0, 2);
    }

    function syncSwitcherActive() {
        var role = currentRole();
        document.querySelectorAll('.tm-role-switcher__btn').forEach(function (btn) {
            var active = btn.getAttribute('data-preview-role') === role;
            btn.classList.toggle('tm-role-switcher__btn--active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        var label = document.getElementById('tm-role-switcher-label');
        if (label) label.textContent = ROLE_LABELS[role] || role;
        syncSidebarUserBadge();
    }

    function createRoleSwitcher() {
        if (document.getElementById('tm-role-preview-switcher')) return;

        var root = document.createElement('div');
        root.id = 'tm-role-preview-switcher';
        root.className = 'tm-role-switcher';
        root.setAttribute('role', 'group');
        root.setAttribute('aria-label', '角色切换预览');

        var header = '<div class="tm-role-switcher__head">' +
            '<span class="tm-role-switcher__badge"><i class="ph ph-eye"></i> 预览</span>' +
            '<span id="tm-role-switcher-label" class="tm-role-switcher__current">管理员</span>' +
            '</div>';

        var buttons = Object.keys(TM_ROLES).map(function (key) {
            return '<button type="button" class="tm-role-switcher__btn" data-preview-role="' + key + '" ' +
                'title="' + (ROLE_LABELS[key] || key) + '">' + (ROLE_LABELS[key] || key) + '</button>';
        }).join('');

        root.innerHTML = header + '<div class="tm-role-switcher__grid">' + buttons + '</div>';
        document.body.appendChild(root);

        root.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-preview-role]');
            if (!btn) return;
            setPreviewRole(btn.getAttribute('data-preview-role'));
        });
    }

    function restoreSavedRole() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved && TM_ROLES[saved]) {
                if (window.TM_UI_CONTEXT) window.TM_UI_CONTEXT.role = saved;
            }
        } catch (e) { /* ignore */ }
    }

    window.applyRoleUI = applyRoleUI;
    window.TM_RolePreview = {
        apply: applyRoleUI,
        setRole: setPreviewRole,
        applyDataMasking: applyDataMasking,
        applySidebarByRole: applySidebarByRole,
        ROLE_LABELS: ROLE_LABELS,
        NAV_HIDE_BY_ROLE: NAV_HIDE_BY_ROLE
    };

    function init() {
        restoreSavedRole();
        createRoleSwitcher();
        applyRoleUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    document.addEventListener('tm-shell-loaded', function () {
        applySidebarByRole();
        ensureActiveTabVisible();
    });

    /* 产品表重绘后重新脱敏 */
    var _origRenderDesktop = window.renderDesktopTable;
    if (typeof _origRenderDesktop === 'function') {
        window.renderDesktopTable = function (list) {
            _origRenderDesktop(list);
            applyDataMasking();
        };
    }
    var _origRenderMobile = window.renderMobileListPaged;
    if (typeof _origRenderMobile === 'function') {
        window.renderMobileListPaged = function () {
            _origRenderMobile();
            applyDataMasking();
        };
    }
})();
