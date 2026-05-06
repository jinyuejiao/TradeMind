/**
 * TradeMind — 壳层片段组装（与 Core/layout_base 中 SLOT_SIDEBAR / 底栏对应）
 * 将桌面侧栏与移动端底栏从 Core/partials/*.html 注入，便于与 layout_base 同源维护。
 */
(function () {
    'use strict';

    var PARTIALS = {
        'desktop-sidebar': './Core/partials/desktop-sidebar.html',
        'mobile-bottom-nav': './Core/partials/mobile-bottom-nav.html'
    };

    function fetchPartial(url) {
        return fetch(url, { cache: 'no-store' }).then(function (res) {
            if (!res.ok) return null;
            return res.text();
        }).catch(function () {
            return null;
        });
    }

    function mountShell(el) {
        var key = el.getAttribute('data-tm-shell');
        var url = PARTIALS[key];
        if (!url) return Promise.resolve();

        return fetchPartial(url).then(function (html) {
            if (html != null) {
                el.innerHTML = html;
                el.removeAttribute('aria-busy');
            }
        });
    }

    function loadAll() {
        var nodes = document.querySelectorAll('[data-tm-shell]');
        var tasks = [];
        nodes.forEach(function (el) {
            tasks.push(mountShell(el));
        });
        return Promise.all(tasks);
    }

    window.TM_ShellLoader = {
        loadAll: loadAll,
        PARTIALS: PARTIALS
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAll);
    } else {
        loadAll();
    }
})();
