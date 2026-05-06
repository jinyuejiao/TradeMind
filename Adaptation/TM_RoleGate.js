/**
 * TradeMind — 基于 data-role 的控件显隐（预览 / 模拟身份）
 * 约定：data-role="ADMIN" 或 data-role="ADMIN SALES"（空格/逗号分隔）
 * 当前用户角色：TM_UI_CONTEXT.role（大写）
 */
(function () {
    'use strict';

    function normalizeRole(r) {
        return String((r != null ? r : 'ADMIN')).trim().toUpperCase();
    }

    function parseAllowed(attr) {
        if (!attr) return [];
        return attr.split(/[\s,]+/).map(function (s) {
            return s.trim().toUpperCase();
        }).filter(Boolean);
    }

    window.TM_RoleGate = {
        apply: function () {
            var role = normalizeRole(window.TM_UI_CONTEXT && window.TM_UI_CONTEXT.role);
            document.documentElement.setAttribute('data-user-role', role);

            document.querySelectorAll('[data-role]').forEach(function (el) {
                var allowed = parseAllowed(el.getAttribute('data-role'));
                var show = allowed.length === 0 || allowed.indexOf(role) !== -1;
                el.classList.toggle('tm-role-hidden', !show);
            });
        }
    };
})();
