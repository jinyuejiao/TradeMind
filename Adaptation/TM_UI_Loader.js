/**
 * TradeMind — 行业片段注入（Adaptation）
 * 依赖：视图根节点上存在 [data-tm-slot][data-tm-fragment-scope]
 */
(function () {
    'use strict';

    var INDUSTRY_DIR = {
        WHOLESALE: 'wholesale',
        FOREIGN: 'foreign',
        ECOM: 'ecom',
        FACTORY: 'factory'
    };

    function industryFolder() {
        var raw = String((window.TM_UI_CONTEXT && window.TM_UI_CONTEXT.industry) || 'WHOLESALE').toUpperCase();
        return INDUSTRY_DIR[raw] || 'wholesale';
    }

    function applyMerchantSkin() {
        var raw = String((window.TM_UI_CONTEXT && window.TM_UI_CONTEXT.industry) || 'WHOLESALE').toUpperCase();
        document.documentElement.setAttribute('data-merchant-type', raw);
    }

    function fetchText(url) {
        return fetch(url, { cache: 'no-store' }).then(function (res) {
            if (!res.ok) return null;
            return res.text();
        }).catch(function () {
            return null;
        });
    }

    (function initContextProxy() {
        var base = { industry: 'WHOLESALE', role: 'ADMIN' };
        if (window.TM_UI_CONTEXT && typeof window.TM_UI_CONTEXT === 'object') {
            Object.assign(base, window.TM_UI_CONTEXT);
        }
        if (typeof Proxy === 'undefined') {
            window.TM_UI_CONTEXT = base;
            return;
        }
        window.TM_UI_CONTEXT = new Proxy(base, {
            set: function (target, prop, value) {
                var prev = target[prop];
                target[prop] = value;
                if ((prop === 'industry' || prop === 'role') && prev !== value && window.TM_UI) {
                    queueMicrotask(function () {
                        window.TM_UI.applyContext();
                    });
                }
                return true;
            }
        });
    })();

    /* 合并到已有 TM_UI（main.js 会先挂 toast 等），禁止整对象覆盖 */
    var tmUiApi = {
        applyMerchantSkin: applyMerchantSkin,

        applyContext: function () {
            applyMerchantSkin();
            if (window.TM_Responsive && typeof window.TM_Responsive.syncBodyLayoutMode === 'function') {
                window.TM_Responsive.syncBodyLayoutMode();
            }
            return this.refreshAll();
        },

        injectSlots: function (root) {
            if (!root || !root.querySelectorAll) return Promise.resolve();
            applyMerchantSkin();
            var ind = industryFolder();
            var slots = root.querySelectorAll('[data-tm-slot][data-tm-fragment-scope]');
            var tasks = [];
            slots.forEach(function (el) {
                var slot = el.getAttribute('data-tm-slot');
                var scope = el.getAttribute('data-tm-fragment-scope');
                if (!slot || !scope) return;
                var path = './fragments/' + ind + '/' + scope + '/' + slot + '.html';
                tasks.push(
                    fetchText(path).then(function (html) {
                        el.innerHTML = html != null ? html : '';
                    })
                );
            });
            return Promise.all(tasks).then(function () {
                if (window.TM_RoleGate && typeof window.TM_RoleGate.apply === 'function') {
                    window.TM_RoleGate.apply();
                }
            });
        },

        refreshAll: function () {
            applyMerchantSkin();
            var supply = document.getElementById('view-supply');
            var crm = document.getElementById('view-crm');
            var jobs = [];
            var self = this;
            if (supply && supply.innerHTML) jobs.push(self.injectSlots(supply));
            else jobs.push(Promise.resolve());
            if (crm && crm.innerHTML) jobs.push(self.injectSlots(crm));
            else jobs.push(Promise.resolve());
            return Promise.all(jobs).then(function () {
                if (window.TM_RoleGate && typeof window.TM_RoleGate.apply === 'function') {
                    window.TM_RoleGate.apply();
                }
            });
        },

        setIndustry: function (code) {
            window.TM_UI_CONTEXT.industry = String(code || 'WHOLESALE').toUpperCase();
        },

        setRole: function (role) {
            window.TM_UI_CONTEXT.role = String(role || 'ADMIN').toUpperCase();
        }
    };
    window.TM_UI = Object.assign(window.TM_UI || {}, tmUiApi);

    document.addEventListener('DOMContentLoaded', function () {
        try {
            var regM = sessionStorage.getItem('tm_register_merchant_type');
            if (regM && window.TM_UI_CONTEXT) {
                window.TM_UI_CONTEXT.industry = String(regM).toUpperCase();
            }
        } catch (e) { /* ignore */ }
        applyMerchantSkin();
        if (window.TM_Responsive && typeof window.TM_Responsive.init === 'function') {
            window.TM_Responsive.init();
        }
        if (window.TM_RoleGate && typeof window.TM_RoleGate.apply === 'function') {
            window.TM_RoleGate.apply();
        }
    });
})();
