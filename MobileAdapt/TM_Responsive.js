/**
 * TradeMind — 统一断点与布局模式（与 Tailwind md=768px 对齐：移动为 width < 768）
 */
(function () {
    'use strict';

    var BP = 768;

    window.TM_Responsive = {
        MOBILE_MAX_WIDTH: BP,

        isMobileView: function () {
            return window.matchMedia('(max-width: ' + (BP - 1) + 'px)').matches;
        },

        syncBodyLayoutMode: function () {
            var m = this.isMobileView();
            document.body.classList.toggle('tm-layout-mobile', m);
            document.body.classList.toggle('tm-layout-desktop', !m);
        },

        init: function () {
            var self = this;
            this.syncBodyLayoutMode();
            window.addEventListener('resize', function () {
                self.syncBodyLayoutMode();
            });
        }
    };
})();
