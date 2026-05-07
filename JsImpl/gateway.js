/**
 * 商户类型门户：选择后写入 tm_tenant_merchant_type 并进入主应用
 */
(function () {
    'use strict';

    var STORAGE_TENANT_MERCHANT = 'tm_tenant_merchant_type';
    var STORAGE_LEGACY_REGISTER = 'tm_register_merchant_type';

    window.tmGatewaySelectAndEnter = function (code) {
        if (!code) return;
        var upper = String(code).toUpperCase();
        try {
            localStorage.setItem(STORAGE_TENANT_MERCHANT, upper);
            sessionStorage.setItem(STORAGE_LEGACY_REGISTER, upper);
        } catch (e) { /* ignore */ }
        window.location.href = './index.html';
    };

    document.addEventListener('DOMContentLoaded', function () {
        try {
            var cur = localStorage.getItem(STORAGE_TENANT_MERCHANT) || sessionStorage.getItem(STORAGE_LEGACY_REGISTER);
            if (!cur) return;
            cur = String(cur).toUpperCase();
            document.querySelectorAll('[data-gateway-code]').forEach(function (el) {
                if (el.getAttribute('data-gateway-code') === cur) {
                    el.classList.add('gateway-tile--current');
                }
            });
        } catch (e) { /* ignore */ }
    });
})();
