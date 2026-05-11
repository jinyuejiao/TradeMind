/**
 * TradeMind OpsService — 运维门户控制器
 *
 * === 后端 / Feign 路由契约（供网关与服务拆分对齐）===
 * GET  /api/ops/tenants/summary?industry=ALL|WHOLESALE|...  — 租户分布、用户数、角色构成
 * POST /api/ops/tenants/{tenantId}/freeze                   — body: { frozen: boolean }
 * POST /api/ops/tenants/{tenantId}/trial-grant             — body: { months, activityType, remark }
 * PATCH /api/ops/tenants/{tenantId}/subscription-expiry   — body: { expiryDate: "ISO-date" }
 * GET  /api/ops/tenants/{tenantId}/resource-snapshot        — Feign 聚合：products, customers, suppliers
 * POST /api/ops/ai-usage/record                             — body: { tenantId, tokens, module, ts }
 * GET  /api/ops/ai-usage/rankings                           — query: period=day|week|month, drillTenantId?
 * GET  /api/ops/referrals/qualified?groupBy=referrerCode   — 有效订阅事件列表或分组：每组含 code、referrer、bank、events[]
 * GET  /api/ops/referrals/groups/{groupKey}/payee           — 推荐人收款信息（同组共用）
 * PATCH /api/ops/referrals/events/{eventId}/settlement      — body: { status: "PENDING"|"PAID" } 按单条有效订阅
 * POST /api/ops/referrals/groups/{groupKey}/settle-all-pending — 批量将组内待结标为已结（可选）
 * POST /api/ops/site-announcements                          — 或写入配置中心；前端演示用 localStorage
 * GET  /api/ops/audit-logs                                  — 敏感操作分页
 * GET/PUT /api/ops/catalog/subscription-plans             — 仅年付：priceOriginalYear、priceCurrentYear、discountLabel；discountPercentOff 由原价/现价自动推导
 */
(function () {
    'use strict';

    var AUDIT_KEY = 'tm_ops_audit_log_v1';
    var ANNOUNCE_KEY = 'tm_ops_site_announcement_v1';
    var TENANTS_KEY = 'tm_ops_demo_tenants_v1';
    var REFERRAL_KEY = 'tm_ops_demo_referrals_v1';
    var refExpandedGroupKeys = new Set();
    var selectedBankGroupKey = '';

    var ROUTES = {
        tenants: { file: './modules/ops/tenants-lifecycle.html', title: '租户与生命周期' },
        plans: { file: './modules/ops/plan-catalog-by-merchant.html', title: '订阅套餐（商户类型）' },
        'quota-ai': { file: './modules/ops/quota-ai-metering.html', title: '配额与 AI 计量' },
        referral: { file: './modules/ops/referral-settlement.html', title: '推荐与结算' },
        announce: { file: './modules/ops/announce-audit.html', title: '公告与审计' }
    };

    var industryLabel = { WHOLESALE: '批发', FOREIGN: '外贸', ECOM: '电商', FACTORY: '工贸一体' };

    function nowIso() {
        return new Date().toISOString();
    }

    function loadAudit() {
        try {
            var raw = localStorage.getItem(AUDIT_KEY);
            var a = raw ? JSON.parse(raw) : [];
            return Array.isArray(a) ? a : [];
        } catch (e) {
            return [];
        }
    }

    function appendAudit(action, detail) {
        var list = loadAudit();
        list.unshift({
            ts: nowIso(),
            operator: 'ops@platform',
            action: action,
            detail: detail || ''
        });
        if (list.length > 200) list = list.slice(0, 200);
        try {
            localStorage.setItem(AUDIT_KEY, JSON.stringify(list));
        } catch (e) { /* ignore */ }
    }

    function loadTenants() {
        try {
            var raw = localStorage.getItem(TENANTS_KEY);
            if (raw) {
                var t = JSON.parse(raw);
                if (Array.isArray(t) && t.length) return t;
            }
        } catch (e) { /* ignore */ }
        return [
            { id: 't-wh-001', name: '华南灯具批发', industry: 'WHOLESALE', frozen: false, expiry: '2026-08-01', users: 42, roles: { admin: 2, ops: 5, other: 35 } },
            { id: 't-fr-002', name: '远航外贸', industry: 'FOREIGN', frozen: false, expiry: '2026-12-15', users: 28, roles: { admin: 1, ops: 3, other: 24 } },
            { id: 't-ec-003', name: '跨境小铺 A', industry: 'ECOM', frozen: true, expiry: '2026-03-01', users: 12, roles: { admin: 1, ops: 2, other: 9 } },
            { id: 't-fa-004', name: '精工制造工贸', industry: 'FACTORY', frozen: false, expiry: '2027-01-10', users: 86, roles: { admin: 3, ops: 12, other: 71 } },
            { id: 't-wh-005', name: '义乌百货联盟', industry: 'WHOLESALE', frozen: false, expiry: '2026-06-20', users: 19, roles: { admin: 1, ops: 1, other: 17 } }
        ];
    }

    function saveTenants(list) {
        try {
            localStorage.setItem(TENANTS_KEY, JSON.stringify(list));
        } catch (e) { /* ignore */ }
    }

    function defaultReferrals() {
        var jinBank = '开户行：招商银行深圳分行\n户名：Jin\n账号：6225 **** **** 9012';
        var liBank = '开户行：工商银行广州支行\n户名：Li Wei\n账号：3602 **** **** 4411';
        return [
            { id: 'ref-evt-001', code: 'GIGA-JIN-8821', referrer: 'Jin', refereeTenant: '跨境小铺 A', firstSubAt: '2026-04-02T10:00:00.000Z', settlement: 'PENDING', bank: jinBank },
            { id: 'ref-evt-002', code: 'GIGA-JIN-8821', referrer: 'Jin', refereeTenant: '精工制造工贸', firstSubAt: '2026-04-18T09:20:00.000Z', settlement: 'PENDING', bank: jinBank },
            { id: 'ref-evt-003', code: 'GIGA-JIN-8821', referrer: 'Jin', refereeTenant: '义乌百货联盟', firstSubAt: '2026-05-06T11:00:00.000Z', settlement: 'PAID', bank: jinBank },
            { id: 'ref-evt-004', code: 'TM-778201', referrer: 'Li Wei', refereeTenant: '华南灯具批发', firstSubAt: '2026-05-01T14:30:00.000Z', settlement: 'PAID', bank: liBank },
            { id: 'ref-evt-005', code: 'TM-778201', referrer: 'Li Wei', refereeTenant: '远航外贸', firstSubAt: '2026-05-09T16:45:00.000Z', settlement: 'PENDING', bank: liBank }
        ];
    }

    function referralGroupKeyFromEvent(e) {
        return String(e.code || '') + '\u0000' + String(e.referrer || '');
    }

    function groupReferralEvents(events) {
        var m = {};
        events.forEach(function (e) {
            var k = referralGroupKeyFromEvent(e);
            if (!m[k]) {
                m[k] = { key: k, code: e.code, referrer: e.referrer, bank: String(e.bank || ''), records: [] };
            }
            m[k].records.push(e);
            if (e.bank) m[k].bank = String(e.bank);
        });
        return Object.keys(m).map(function (k) {
            return m[k];
        }).sort(function (a, b) {
            return b.records.length - a.records.length || a.code.localeCompare(b.code);
        });
    }

    function encodeGroupKey(k) {
        return encodeURIComponent(k);
    }

    function decodeGroupKey(enc) {
        try {
            return decodeURIComponent(enc);
        } catch (err) {
            return '';
        }
    }

    function loadReferrals() {
        try {
            var raw = localStorage.getItem(REFERRAL_KEY);
            if (raw) {
                var r = JSON.parse(raw);
                if (Array.isArray(r) && r.length) return r;
            }
        } catch (e) { /* ignore */ }
        return defaultReferrals();
    }

    function saveReferrals(list) {
        try {
            localStorage.setItem(REFERRAL_KEY, JSON.stringify(list));
        } catch (e) { /* ignore */ }
    }

    var mockQuotaByTenant = [
        { name: '精工制造工贸', products: 8420, customers: 1205, suppliers: 318 },
        { name: '华南灯具批发', products: 2100, customers: 890, suppliers: 56 },
        { name: '远航外贸', products: 980, customers: 420, suppliers: 120 },
        { name: '跨境小铺 A', products: 5600, customers: 3100, suppliers: 12 },
        { name: '义乌百货联盟', products: 12000, customers: 450, suppliers: 88 }
    ];

    var mockAiRank = {
        day: [
            { tenant: '精工制造工贸', tokens: 420000, extract: 280000, chat: 140000 },
            { tenant: '跨境小铺 A', tokens: 310000, extract: 200000, chat: 110000 },
            { tenant: '华南灯具批发', tokens: 120000, extract: 90000, chat: 30000 }
        ],
        week: [
            { tenant: '精工制造工贸', tokens: 2100000, extract: 1400000, chat: 700000 },
            { tenant: '华南灯具批发', tokens: 980000, extract: 720000, chat: 260000 },
            { tenant: '远航外贸', tokens: 760000, extract: 500000, chat: 260000 }
        ],
        month: [
            { tenant: '精工制造工贸', tokens: 8900000, extract: 5200000, chat: 3700000 },
            { tenant: '跨境小铺 A', tokens: 6200000, extract: 4100000, chat: 2100000 },
            { tenant: '华南灯具批发', tokens: 4100000, extract: 3000000, chat: 1100000 }
        ]
    };

    var PLAN_CATALOG_MERCHANT_KEYS = ['WHOLESALE', 'FOREIGN', 'ECOM', 'FACTORY'];
    var PLAN_CATALOG_STORAGE_KEY = 'tm_ops_subscription_catalog_v1';

    /** 订阅档位出厂默认（仅年付：原价 / 现价；减免比例存库时自动按二者计算） */
    var DEFAULT_PLAN_CATALOG = {
        WHOLESALE: [
            { id: 'plan-wh-1', name: '启航会员', priceOriginalYear: 1990, priceCurrentYear: 1990, discountLabel: '', promoNote: '', maxUsers: 5, maxProducts: 3000, maxSuppliers: 80, maxCustomers: 1200 },
            { id: 'plan-wh-2', name: '专业会员', priceOriginalYear: 3990, priceCurrentYear: 3990, discountLabel: '', promoNote: '', maxUsers: 15, maxProducts: 12000, maxSuppliers: 200, maxCustomers: 8000 },
            { id: 'plan-wh-3', name: '旗舰会员', priceOriginalYear: 8990, priceCurrentYear: 8990, discountLabel: '', promoNote: '', maxUsers: 50, maxProducts: 50000, maxSuppliers: 500, maxCustomers: 30000 }
        ],
        FOREIGN: [
            { id: 'plan-fr-1', name: '启航会员', priceOriginalYear: 2990, priceCurrentYear: 2990, discountLabel: '', promoNote: '', maxUsers: 5, maxProducts: 5000, maxSuppliers: 150, maxCustomers: 2500 },
            { id: 'plan-fr-2', name: '跨境专业版', priceOriginalYear: 5990, priceCurrentYear: 5990, discountLabel: '', promoNote: '', maxUsers: 20, maxProducts: 20000, maxSuppliers: 400, maxCustomers: 12000 },
            { id: 'plan-fr-3', name: '全球旗舰版', priceOriginalYear: 12990, priceCurrentYear: 12990, discountLabel: '', promoNote: '', maxUsers: 60, maxProducts: 80000, maxSuppliers: 800, maxCustomers: 50000 }
        ],
        ECOM: [
            { id: 'plan-ec-1', name: '启航会员', priceOriginalYear: 2490, priceCurrentYear: 2490, discountLabel: '', promoNote: '', maxUsers: 8, maxProducts: 50000, maxSuppliers: 40, maxCustomers: 15000 },
            { id: 'plan-ec-2', name: '店群专业版', priceOriginalYear: 4990, priceCurrentYear: 4990, discountLabel: '', promoNote: '', maxUsers: 25, maxProducts: 200000, maxSuppliers: 120, maxCustomers: 80000 },
            { id: 'plan-ec-3', name: '多平台旗舰版', priceOriginalYear: 9990, priceCurrentYear: 9990, discountLabel: '', promoNote: '', maxUsers: 80, maxProducts: 800000, maxSuppliers: 300, maxCustomers: 300000 }
        ],
        FACTORY: [
            { id: 'plan-fa-1', name: '启航会员', priceOriginalYear: 2590, priceCurrentYear: 2590, discountLabel: '', promoNote: '', maxUsers: 6, maxProducts: 8000, maxSuppliers: 300, maxCustomers: 1500 },
            { id: 'plan-fa-2', name: '产销协同版', priceOriginalYear: 5290, priceCurrentYear: 5290, discountLabel: '', promoNote: '', maxUsers: 18, maxProducts: 35000, maxSuppliers: 800, maxCustomers: 6000 },
            { id: 'plan-fa-3', name: '工贸旗舰版', priceOriginalYear: 10990, priceCurrentYear: 10990, discountLabel: '', promoNote: '', maxUsers: 55, maxProducts: 120000, maxSuppliers: 2000, maxCustomers: 25000 }
        ]
    };

    function cloneDefaultPlanCatalog() {
        var o = JSON.parse(JSON.stringify(DEFAULT_PLAN_CATALOG));
        PLAN_CATALOG_MERCHANT_KEYS.forEach(function (k) {
            o[k] = (o[k] || []).map(function (item) {
                return normalizePlan(item);
            });
        });
        return o;
    }

    /** 由原价、现价推导标价减免比例（百分比整数，现价≥原价时为 0） */
    function computeDiscountPercentFromYearPrices(originalYear, currentYear) {
        var o = Math.max(0, parseInt(originalYear, 10) || 0);
        var c = Math.max(0, parseInt(currentYear, 10) || 0);
        if (o <= 0 || c >= o) return 0;
        var off = Math.round((1 - c / o) * 100);
        return Math.min(99, Math.max(0, off));
    }

    /** 兼容旧字段：仅年付场景下等价于原价 */
    function effectivePlanPrice(listPrice, discountPercentOff) {
        var p = Number(listPrice) || 0;
        var off = Math.min(99, Math.max(0, parseInt(discountPercentOff, 10) || 0));
        return Math.max(0, Math.round(p * (100 - off) / 100));
    }

    function normalizePlan(raw, stableIdFallback) {
        var p = raw && typeof raw === 'object' ? raw : {};
        var rawId = p.id != null ? String(p.id).trim() : '';
        var fb = stableIdFallback != null ? String(stableIdFallback).trim() : '';
        var id = rawId || fb || ('plan-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6));

        var origY = Math.max(0, parseInt(p.priceOriginalYear, 10) || 0);
        if (!origY) origY = Math.max(0, parseInt(p.priceYearly, 10) || 0);

        var curY = Math.max(0, parseInt(p.priceCurrentYear, 10) || 0);
        if (!curY && origY) {
            var legacyOff = Math.min(99, Math.max(0, parseInt(p.discountPercentOff, 10) || 0));
            curY = Math.round(origY * (100 - legacyOff) / 100);
        }
        if (!curY) curY = origY;

        if (curY > origY && origY > 0) curY = origY;

        var off = computeDiscountPercentFromYearPrices(origY, curY);

        return {
            id: id,
            name: String(p.name || '未命名套餐').trim() || '未命名套餐',
            priceOriginalYear: origY,
            priceCurrentYear: curY,
            discountPercentOff: off,
            discountLabel: String(p.discountLabel != null ? p.discountLabel : '').trim(),
            promoNote: String(p.promoNote != null ? p.promoNote : '').trim(),
            maxUsers: Math.max(0, parseInt(p.maxUsers, 10) || 0),
            maxProducts: Math.max(0, parseInt(p.maxProducts, 10) || 0),
            maxSuppliers: Math.max(0, parseInt(p.maxSuppliers, 10) || 0),
            maxCustomers: Math.max(0, parseInt(p.maxCustomers, 10) || 0),
            priceYearly: origY,
            priceMonthly: 0
        };
    }

    function loadSubscriptionCatalog() {
        var base = cloneDefaultPlanCatalog();
        try {
            var stored = localStorage.getItem(PLAN_CATALOG_STORAGE_KEY);
            if (!stored) return base;
            var o = JSON.parse(stored);
            if (!o || typeof o !== 'object') return base;
            PLAN_CATALOG_MERCHANT_KEYS.forEach(function (k) {
                if (Array.isArray(o[k]) && o[k].length) {
                    base[k] = o[k].map(function (item, idx) {
                        return normalizePlan(item, 'mig-' + k + '-' + idx);
                    });
                }
            });
            return base;
        } catch (e) {
            return base;
        }
    }

    function saveSubscriptionCatalog(catalog) {
        try {
            localStorage.setItem(PLAN_CATALOG_STORAGE_KEY, JSON.stringify(catalog));
        } catch (e) { /* ignore */ }
    }

    var currentIndustry = 'ALL';
    var currentAiPeriod = 'day';

    function el(id) {
        return document.getElementById(id);
    }

    function setActiveNav(route) {
        document.querySelectorAll('.tm-ops-nav-btn').forEach(function (btn) {
            var r = btn.getAttribute('data-ops-route');
            if (r === route) {
                btn.classList.add('tm-ops-nav-active');
            } else {
                btn.classList.remove('tm-ops-nav-active');
            }
        });
        var titleEl = el('tm-ops-page-title');
        if (titleEl && ROUTES[route]) titleEl.textContent = ROUTES[route].title;
    }

    function fetchHtml(url) {
        return fetch(url, { cache: 'no-store' }).then(function (res) {
            if (!res.ok) throw new Error(res.statusText);
            return res.text();
        });
    }

    function loadModule(route) {
        var cfg = ROUTES[route];
        if (!cfg) return Promise.resolve();
        var root = el('tm-ops-view-root');
        if (!root) return Promise.resolve();
        setActiveNav(route);
        return fetchHtml(cfg.file + '?t=' + Date.now()).then(function (html) {
            root.innerHTML = html;
            if (route === 'tenants') initTenantsPage();
            else if (route === 'plans') initPlanCatalogPage();
            else if (route === 'quota-ai') initQuotaAiPage();
            else if (route === 'referral') initReferralPage();
            else if (route === 'announce') initAnnouncePage();
        }).catch(function () {
            root.innerHTML = '<div class="tm-ops-glass rounded-tm-3xl p-8 text-center text-rose-600 text-sm">模块加载失败：' + cfg.file + '</div>';
        });
    }

    function formatTokens(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return String(n);
    }

    function initPlanCatalogPage() {
        var catalog = loadSubscriptionCatalog();
        var currentMerchant = 'WHOLESALE';

        function persist(detail) {
            saveSubscriptionCatalog(catalog);
            appendAudit('PLAN_CATALOG_UPDATE', (detail || '') + ' merchant=' + currentMerchant);
            var hint = el('ops-plan-save-hint');
            if (hint) {
                hint.textContent = '已保存 · ' + new Date().toLocaleString();
                hint.classList.remove('text-slate-400');
                hint.classList.add('text-emerald-600', 'font-bold');
            }
        }

        function renderTabs() {
            var root = el('ops-plan-merchant-tabs');
            if (!root) return;
            root.querySelectorAll('.ops-plan-tab').forEach(function (btn) {
                var m = btn.getAttribute('data-merchant');
                var on = m === currentMerchant;
                btn.className = on
                    ? 'ops-plan-tab px-4 py-2 rounded-2xl text-xs font-bold border-2 border-ops-600 bg-ops-600 text-white shadow-md'
                    : 'ops-plan-tab px-4 py-2 rounded-2xl text-xs font-bold border border-slate-200 bg-white/90 text-slate-600 hover:border-ops-300';
            });
            var lbl = el('ops-plan-merchant-label');
            if (lbl) lbl.textContent = industryLabel[currentMerchant] || currentMerchant;
        }

        function renderTable() {
            var tbody = el('ops-plan-table-body');
            if (!tbody) return;
            var rows = catalog[currentMerchant] || [];
            tbody.innerHTML = rows.map(function (p) {
                var orig = p.priceOriginalYear != null ? p.priceOriginalYear : p.priceYearly || 0;
                var cur = p.priceCurrentYear != null ? p.priceCurrentYear : orig;
                var off = computeDiscountPercentFromYearPrices(orig, cur);
                var zhe = orig > 0 ? (Math.round((cur / orig) * 1000) / 100).toFixed(1) : '—';
                var discCell = off > 0
                    ? ('<span class="font-black text-rose-600">约 −' + off + '%</span>' +
                        '<div class="text-[10px] text-slate-500 mt-0.5">约合 ' + zhe + ' 折</div>' +
                        (p.discountLabel ? '<div class="text-[10px] text-slate-500 mt-0.5 max-w-[160px] leading-snug">' + escapeHtml(p.discountLabel) + '</div>' : ''))
                    : ('<span class="text-slate-400">无</span>' +
                        (p.discountLabel ? '<div class="text-[10px] text-slate-500 mt-0.5 max-w-[160px] leading-snug">' + escapeHtml(p.discountLabel) + '</div>' : ''));
                return (
                    '<tr class="hover:bg-ops-50/50">' +
                    '<td class="px-4 py-3 font-semibold text-slate-800">' + escapeHtml(p.name) + '</td>' +
                    '<td class="px-4 py-3 font-mono text-slate-600">¥' + escapeHtml(String(orig)) + '<span class="text-slate-400 font-normal text-[10px]">/年</span></td>' +
                    '<td class="px-4 py-3 font-mono text-ops-800 font-bold">¥' + escapeHtml(String(cur)) + '<span class="text-slate-400 font-normal text-[10px]">/年</span></td>' +
                    '<td class="px-4 py-3">' + discCell + '</td>' +
                    '<td class="px-4 py-3 text-right font-mono text-slate-800">' + escapeHtml(String(p.maxUsers)) + '</td>' +
                    '<td class="px-4 py-3 text-right font-mono text-slate-700">' + escapeHtml(String(p.maxProducts)) + '</td>' +
                    '<td class="px-4 py-3 text-right font-mono text-slate-700">' + escapeHtml(String(p.maxSuppliers)) + '</td>' +
                    '<td class="px-4 py-3 text-right font-mono text-slate-700">' + escapeHtml(String(p.maxCustomers)) + '</td>' +
                    '<td class="px-4 py-3 text-right whitespace-nowrap">' +
                    '<button type="button" class="ops-plan-edit px-3 py-1.5 rounded-xl text-[10px] font-bold bg-ops-50 text-ops-700 border border-ops-200 hover:bg-ops-100" data-plan-id="' + escapeHtml(p.id) + '">编辑</button>' +
                    '</td></tr>'
                );
            }).join('');
        }

        function refresh() {
            renderTabs();
            renderTable();
        }

        function openPlanModal(planId) {
            var modal = el('ops-plan-modal');
            var delBtn = el('ops-plan-modal-delete');
            var title = el('ops-plan-modal-title');
            var idField = el('ops-plan-modal-plan-id');
            if (!modal || !idField) return;
            var list = catalog[currentMerchant] || [];
            var isNew = !planId;
            var p = isNew ? {} : list.find(function (x) {
                return x.id === planId;
            });
            if (!isNew && !p) return;
            idField.value = isNew ? '' : planId;
            if (title) title.textContent = isNew ? '新增档位' : '编辑套餐';
            if (delBtn) {
                delBtn.classList.toggle('hidden', isNew);
            }
            el('ops-plan-field-name').value = p && p.name ? p.name : '';
            var origOpen = p && (p.priceOriginalYear != null ? p.priceOriginalYear : p.priceYearly);
            var curOpen = p && (p.priceCurrentYear != null ? p.priceCurrentYear : origOpen);
            el('ops-plan-field-price-original-y').value = origOpen != null ? origOpen : 0;
            el('ops-plan-field-price-current-y').value = curOpen != null ? curOpen : 0;
            el('ops-plan-field-discount-label').value = p && p.discountLabel ? p.discountLabel : '';
            el('ops-plan-field-promo-note').value = p && p.promoNote ? p.promoNote : '';
            el('ops-plan-field-max-users').value = p && p.maxUsers != null ? p.maxUsers : 0;
            el('ops-plan-field-max-products').value = p && p.maxProducts != null ? p.maxProducts : 0;
            el('ops-plan-field-max-suppliers').value = p && p.maxSuppliers != null ? p.maxSuppliers : 0;
            el('ops-plan-field-max-customers').value = p && p.maxCustomers != null ? p.maxCustomers : 0;
            updateModalPreview();
            modal.classList.remove('hidden');
        }

        function closePlanModal() {
            var modal = el('ops-plan-modal');
            if (modal) modal.classList.add('hidden');
        }

        function readModalPlan() {
            return normalizePlan({
                id: el('ops-plan-modal-plan-id').value.trim(),
                name: el('ops-plan-field-name').value,
                priceOriginalYear: el('ops-plan-field-price-original-y').value,
                priceCurrentYear: el('ops-plan-field-price-current-y').value,
                discountLabel: el('ops-plan-field-discount-label').value,
                promoNote: el('ops-plan-field-promo-note').value,
                maxUsers: el('ops-plan-field-max-users').value,
                maxProducts: el('ops-plan-field-max-products').value,
                maxSuppliers: el('ops-plan-field-max-suppliers').value,
                maxCustomers: el('ops-plan-field-max-customers').value
            });
        }

        function updateModalPreview() {
            var pv = el('ops-plan-modal-discount-auto');
            if (!pv) return;
            var o = Math.max(0, parseInt(el('ops-plan-field-price-original-y').value, 10) || 0);
            var cRaw = Math.max(0, parseInt(el('ops-plan-field-price-current-y').value, 10) || 0);
            var c = o > 0 ? Math.min(o, cRaw) : cRaw;
            if (o <= 0) {
                pv.textContent = '请填写年付原价后，系统将自动根据原价与现价计算减免比例。';
                return;
            }
            if (cRaw > o) {
                pv.textContent = '现价高于原价时，保存后将按无溢价处理（现价=原价），减免 0%（10.0 折）。';
                return;
            }
            var off = computeDiscountPercentFromYearPrices(o, c);
            var zhe = (Math.round((c / o) * 1000) / 100).toFixed(1);
            pv.textContent = '基于年付原价 ¥' + o + ' 与现价 ¥' + c + '，系统自动减免约 ' + off + '%（约合 ' + zhe + ' 折）。保存时写入该比例。';
        }

        function saveFromModal() {
            var row = readModalPlan();
            var list = catalog[currentMerchant] || (catalog[currentMerchant] = []);
            var existingId = el('ops-plan-modal-plan-id').value.trim();
            if (!existingId) {
                list.push(row);
                persist('新增 id=' + row.id + ' ' + row.name);
            } else {
                var idx = list.findIndex(function (x) {
                    return x.id === existingId;
                });
                if (idx < 0) return;
                row.id = existingId;
                list[idx] = row;
                persist('更新 id=' + row.id + ' ' + row.name);
            }
            closePlanModal();
            refresh();
        }

        function deleteFromModal() {
            var existingId = el('ops-plan-modal-plan-id').value.trim();
            if (!existingId) return;
            if (!confirm('确定删除该档位？')) return;
            var list = catalog[currentMerchant] || [];
            catalog[currentMerchant] = list.filter(function (x) {
                return x.id !== existingId;
            });
            persist('删除 id=' + existingId);
            closePlanModal();
            refresh();
        }

        var tabRoot = el('ops-plan-merchant-tabs');
        if (tabRoot) {
            tabRoot.addEventListener('click', function (e) {
                var b = e.target.closest('[data-merchant]');
                if (!b) return;
                currentMerchant = b.getAttribute('data-merchant') || 'WHOLESALE';
                refresh();
            });
        }

        var tbody = el('ops-plan-table-body');
        if (tbody) {
            tbody.addEventListener('click', function (e) {
                var ed = e.target.closest('.ops-plan-edit');
                if (!ed) return;
                openPlanModal(ed.getAttribute('data-plan-id'));
            });
        }

        var btnAdd = el('ops-plan-btn-add');
        if (btnAdd) btnAdd.addEventListener('click', function () {
            openPlanModal(null);
        });

        var btnReset = el('ops-plan-btn-reset-merchant');
        if (btnReset) {
            btnReset.addEventListener('click', function () {
                if (!confirm('将「' + (industryLabel[currentMerchant] || currentMerchant) + '」下所有档位恢复为系统默认（当前编辑会丢失），确定？')) return;
                catalog[currentMerchant] = (cloneDefaultPlanCatalog()[currentMerchant] || []).map(normalizePlan);
                persist('恢复默认');
                refresh();
            });
        }

        var modal = el('ops-plan-modal');
        var mclose = el('ops-plan-modal-close');
        if (mclose) mclose.addEventListener('click', closePlanModal);
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closePlanModal();
            });
        }
        var msave = el('ops-plan-modal-save');
        if (msave) msave.addEventListener('click', saveFromModal);
        var mdel = el('ops-plan-modal-delete');
        if (mdel) mdel.addEventListener('click', deleteFromModal);

        ['ops-plan-field-price-original-y', 'ops-plan-field-price-current-y'].forEach(function (fid) {
            var node = el(fid);
            if (node) node.addEventListener('input', updateModalPreview);
        });

        refresh();
    }

    function updateTenantStats(list, filter) {
        var rows = filter === 'ALL' ? list : list.filter(function (t) {
            return t.industry === filter;
        });
        var tenants = rows.length;
        var users = rows.reduce(function (s, t) {
            return s + (t.users || 0);
        }, 0);
        var admin = 0;
        var ops = 0;
        var other = 0;
        rows.forEach(function (t) {
            var r = t.roles || {};
            admin += r.admin || 0;
            ops += r.ops || 0;
            other += r.other || 0;
        });
        var st = el('ops-stat-tenants');
        var su = el('ops-stat-users');
        var sr = el('ops-stat-roles');
        if (st) st.textContent = String(tenants);
        if (su) su.textContent = String(users);
        if (sr) sr.textContent = admin + ' / ' + ops + ' / ' + other;
    }

    function renderTenantRows(list, filter) {
        var tbody = el('ops-tenant-table-body');
        if (!tbody) return;
        var rows = filter === 'ALL' ? list : list.filter(function (t) {
            return t.industry === filter;
        });
        tbody.innerHTML = rows.map(function (t) {
            var frozen = t.frozen ? '<span class="text-rose-600 font-bold">已冻结</span>' : '<span class="text-emerald-600 font-bold">正常</span>';
            var ind = industryLabel[t.industry] || t.industry;
            return (
                '<tr class="hover:bg-ops-50/50">' +
                '<td class="px-4 py-3 font-semibold text-slate-800">' + escapeHtml(t.name) + '<span class="block text-[10px] font-mono text-slate-400">' + escapeHtml(t.id) + '</span></td>' +
                '<td class="px-4 py-3">' + escapeHtml(ind) + '</td>' +
                '<td class="px-4 py-3">' + frozen + '</td>' +
                '<td class="px-4 py-3 font-mono text-slate-600">' + escapeHtml(t.expiry) + '</td>' +
                '<td class="px-4 py-3 text-right space-x-1 whitespace-nowrap">' +
                '<button type="button" class="ops-act-freeze px-2 py-1 rounded-xl text-[10px] font-bold border border-slate-200 hover:bg-slate-50" data-id="' + escapeHtml(t.id) + '">' + (t.frozen ? '解冻' : '冻结') + '</button>' +
                '<button type="button" class="ops-act-edit px-2 py-1 rounded-xl text-[10px] font-bold bg-ops-600 text-white hover:bg-ops-700" data-id="' + escapeHtml(t.id) + '">权益/到期</button>' +
                '</td></tr>'
            );
        }).join('');
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function initTenantsPage() {
        var list = loadTenants();
        currentIndustry = 'ALL';

        function refresh() {
            updateTenantStats(list, currentIndustry);
            renderTenantRows(list, currentIndustry);
        }
        refresh();

        var filterRoot = el('ops-industry-filter');
        if (filterRoot) {
            filterRoot.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-industry]');
                if (!btn) return;
                currentIndustry = btn.getAttribute('data-industry') || 'ALL';
                filterRoot.querySelectorAll('.ops-filter-chip').forEach(function (b) {
                    var on = b.getAttribute('data-industry') === currentIndustry;
                    b.className = on
                        ? 'ops-filter-chip px-4 py-2 rounded-2xl text-xs font-bold border-2 border-ops-600 bg-ops-600 text-white shadow-md'
                        : 'ops-filter-chip px-4 py-2 rounded-2xl text-xs font-bold border border-slate-200 bg-white/90 text-slate-600 hover:border-ops-300';
                });
                refresh();
            });
        }

        var tbody = el('ops-tenant-table-body');
        if (tbody) {
            tbody.addEventListener('click', function (e) {
                var fr = e.target.closest('.ops-act-freeze');
                var ed = e.target.closest('.ops-act-edit');
                if (fr) {
                    var id = fr.getAttribute('data-id');
                    var t = list.find(function (x) {
                        return x.id === id;
                    });
                    if (!t) return;
                    t.frozen = !t.frozen;
                    saveTenants(list);
                    appendAudit(t.frozen ? 'FREEZE_TENANT' : 'UNFREEZE_TENANT', id + ' ' + t.name);
                    refresh();
                    return;
                }
                if (ed) {
                    var tid = ed.getAttribute('data-id');
                    var tenant = list.find(function (x) {
                        return x.id === tid;
                    });
                    if (!tenant) return;
                    el('ops-modal-tenant-id').value = tenant.id;
                    el('ops-modal-tenant-title').textContent = '运维：' + tenant.name;
                    el('ops-modal-tenant-sub').textContent = '赠送试用将累加至到期日；或直接指定到期日（二者可只填一项）。';
                    el('ops-input-trial-months').value = '1';
                    el('ops-input-trial-note').value = '';
                    el('ops-input-expiry-date').value = tenant.expiry || '';
                    el('ops-modal-tenant').classList.remove('hidden');
                }
            });
        }

        function closeModal() {
            var modal = el('ops-modal-tenant');
            if (modal) modal.classList.add('hidden');
        }
        var m = el('ops-modal-tenant');
        var mclose = el('ops-modal-tenant-close');
        if (m && mclose) {
            mclose.addEventListener('click', closeModal);
            m.addEventListener('click', function (e) {
                if (e.target === m) closeModal();
            });
        }
        var saveBtn = el('ops-btn-save-tenant-ops');
        if (!saveBtn) return;
        saveBtn.addEventListener('click', function () {
            var tid = el('ops-modal-tenant-id').value;
            var tenant = list.find(function (x) {
                return x.id === tid;
            });
            if (!tenant) return;
            var months = parseInt(el('ops-input-trial-months').value, 10) || 0;
            var note = el('ops-input-trial-note').value.trim();
            var dateStr = el('ops-input-expiry-date').value;
            if (months > 0) {
                var d = new Date(tenant.expiry || Date.now());
                d.setMonth(d.getMonth() + months);
                tenant.expiry = d.toISOString().slice(0, 10);
                appendAudit('TRIAL_GRANT', tid + ' +' + months + '月 活动:' + (note || '-') );
            }
            if (dateStr) {
                tenant.expiry = dateStr;
                appendAudit('SUBSCRIPTION_EXPIRY_SET', tid + ' -> ' + dateStr + ' 备注:' + (note || '-'));
            }
            saveTenants(list);
            closeModal();
            refresh();
        });
    }

    function initQuotaAiPage() {
        var cards = el('ops-quota-cards');
        if (cards) {
            cards.innerHTML = mockQuotaByTenant.map(function (q) {
                return (
                    '<div class="rounded-2xl border border-indigo-100 bg-white/80 p-4">' +
                    '<p class="text-[10px] font-bold text-slate-400 uppercase truncate">' + escapeHtml(q.name) + '</p>' +
                    '<div class="mt-2 grid grid-cols-3 gap-2 text-center">' +
                    '<div><p class="text-lg font-black text-ops-700 font-mono">' + q.products + '</p><p class="text-[9px] text-slate-500">产品</p></div>' +
                    '<div><p class="text-lg font-black text-ops-700 font-mono">' + q.customers + '</p><p class="text-[9px] text-slate-500">客户</p></div>' +
                    '<div><p class="text-lg font-black text-ops-700 font-mono">' + q.suppliers + '</p><p class="text-[9px] text-slate-500">供应商</p></div>' +
                    '</div></div>'
                );
            }).join('');
        }

        function renderRank(period) {
            currentAiPeriod = period;
            var data = mockAiRank[period] || mockAiRank.day;
            var tbody = el('ops-ai-rank-body');
            if (!tbody) return;
            tbody.innerHTML = data.map(function (row, i) {
                return (
                    '<tr class="hover:bg-ops-50/40">' +
                    '<td class="px-4 py-2 font-mono font-bold text-ops-600">' + (i + 1) + '</td>' +
                    '<td class="px-4 py-2 font-semibold">' + escapeHtml(row.tenant) + '</td>' +
                    '<td class="px-4 py-2 font-mono">' + formatTokens(row.tokens) + '</td>' +
                    '<td class="px-4 py-2 text-slate-600">' + formatTokens(row.extract) + ' / ' + formatTokens(row.chat) + '</td>' +
                    '<td class="px-4 py-2 text-right"><button type="button" class="ops-ai-drill text-[10px] font-bold text-ops-600 hover:underline" data-tenant="' + escapeHtml(row.tenant) + '">明细</button></td>' +
                    '</tr>'
                );
            }).join('');

            var tabs = el('ops-ai-period-tabs');
            if (tabs) {
                tabs.querySelectorAll('.ops-period').forEach(function (b) {
                    var on = b.getAttribute('data-period') === period;
                    b.className = on
                        ? 'ops-period px-4 py-1.5 rounded-xl text-[11px] font-bold bg-white text-ops-700 shadow-sm'
                        : 'ops-period px-4 py-1.5 rounded-xl text-[11px] font-bold text-slate-500';
                });
            }
        }

        var tabRoot = el('ops-ai-period-tabs');
        if (tabRoot) {
            tabRoot.addEventListener('click', function (e) {
                var b = e.target.closest('[data-period]');
                if (!b) return;
                renderRank(b.getAttribute('data-period') || 'day');
            });
        }

        var rankBody = el('ops-ai-rank-body');
        var detail = el('ops-ai-detail');
        if (rankBody && detail) {
            rankBody.addEventListener('click', function (e) {
                var b = e.target.closest('.ops-ai-drill');
                if (!b) return;
                var name = b.getAttribute('data-tenant');
                detail.innerHTML =
                    '<p class="font-bold text-slate-700">' + escapeHtml(name) + ' · ' + currentAiPeriod + ' 维度</p>' +
                    '<p>示例调用链：BillingService.recordAiUsage → OpsService 聚合。</p>' +
                    '<p class="text-[10px] text-slate-400 mt-2">最近流水（演示）：</p>' +
                    '<ul class="list-disc pl-4 space-y-1">' +
                    '<li>2026-05-11 09:12 · EXTRACT · 4.2k tokens</li>' +
                    '<li>2026-05-11 08:40 · CHAT · 1.1k tokens</li>' +
                    '<li>2026-05-10 22:05 · EXTRACT · 8.0k tokens</li>' +
                    '</ul>';
            });
        }
        renderRank('day');
    }

    function initReferralPage() {
        var list = loadReferrals();

        function renderSummary(groups) {
            var box = el('ops-ref-summary-cards');
            if (!box) return;
            var totalEv = list.length;
            var pending = list.filter(function (x) {
                return x.settlement !== 'PAID';
            }).length;
            var paid = list.filter(function (x) {
                return x.settlement === 'PAID';
            }).length;
            var multi = groups.filter(function (g) {
                return g.records.length > 1;
            }).length;
            function card(label, val, sub) {
                return (
                    '<div class="tm-ops-glass rounded-2xl p-4 border border-indigo-100/80">' +
                    '<p class="text-[10px] font-bold text-slate-400 uppercase">' + escapeHtml(label) + '</p>' +
                    '<p class="mt-1 text-xl font-black text-ops-700 font-mono">' + escapeHtml(val) + '</p>' +
                    (sub ? '<p class="text-[10px] text-slate-500 mt-0.5">' + escapeHtml(sub) + '</p>' : '') +
                    '</div>'
                );
            }
            box.innerHTML =
                card('推荐分组', String(groups.length), '按 推荐码+推荐人 聚合') +
                card('有效订阅笔数', String(totalEv), '每条 = 一次首订') +
                card('待结算', String(pending), '需在明细中或批量处理') +
                card('多租户推荐组', String(multi), '单组 ≥2 笔有效订阅');
        }

        function render() {
            var tbody = el('ops-referral-body');
            if (!tbody) return;
            var groups = groupReferralEvents(list);
            renderSummary(groups);
            var rows = [];
            groups.forEach(function (g) {
                var enc = encodeGroupKey(g.key);
                var expanded = refExpandedGroupKeys.has(g.key);
                var pendingN = g.records.filter(function (r) {
                    return r.settlement !== 'PAID';
                }).length;
                var paidN = g.records.filter(function (r) {
                    return r.settlement === 'PAID';
                }).length;
                var caret = expanded ? 'ph-caret-down' : 'ph-caret-right';
                rows.push(
                    '<tr class="hover:bg-ops-50/40 bg-white/70">' +
                    '<td class="px-2 py-3 align-middle">' +
                    '<button type="button" class="ops-ref-toggle w-8 h-8 rounded-xl flex items-center justify-center text-ops-600 hover:bg-ops-50 border border-transparent hover:border-ops-200" data-group-key="' + escapeHtml(enc) + '" title="展开/收起">' +
                    '<i class="ph ' + caret + ' text-lg"></i></button></td>' +
                    '<td class="px-4 py-3 font-mono text-xs font-semibold text-slate-800">' + escapeHtml(g.code) + '</td>' +
                    '<td class="px-4 py-3 font-semibold">' + escapeHtml(g.referrer) + '</td>' +
                    '<td class="px-4 py-3"><span class="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-ops-100 text-ops-800 font-black font-mono">' + g.records.length + '</span></td>' +
                    '<td class="px-4 py-3 text-[11px]"><span class="text-amber-600 font-bold">待 ' + pendingN + '</span> · <span class="text-emerald-600 font-bold">已 ' + paidN + '</span></td>' +
                    '<td class="px-4 py-3 text-right whitespace-nowrap">' +
                    '<button type="button" class="ops-bank px-3 py-1.5 rounded-xl text-[10px] font-bold bg-ops-50 text-ops-700 border border-ops-200 hover:bg-ops-100" data-group-key="' + escapeHtml(enc) + '">收款信息</button>' +
                    '</td></tr>'
                );
                var detailHidden = expanded ? '' : 'hidden';
                var innerRows = g.records.slice().sort(function (a, b) {
                    return String(b.firstSubAt).localeCompare(String(a.firstSubAt));
                }).map(function (r) {
                    var st = r.settlement === 'PAID'
                        ? '<span class="text-emerald-600 font-bold">已结算</span>'
                        : '<span class="text-amber-600 font-bold">待结算</span>';
                    return (
                        '<tr class="border-b border-indigo-100/60 last:border-0">' +
                        '<td class="py-2 pr-3 font-medium text-slate-800">' + escapeHtml(r.refereeTenant) + '</td>' +
                        '<td class="py-2 px-2 font-mono text-[10px] text-slate-500 whitespace-nowrap">' + escapeHtml(String(r.firstSubAt).slice(0, 10)) + '</td>' +
                        '<td class="py-2 px-2">' + st + '</td>' +
                        '<td class="py-2 pl-2 text-right whitespace-nowrap">' +
                        '<button type="button" class="ops-ref-mark-paid mr-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-40" data-record-id="' + escapeHtml(r.id) + '"' + (r.settlement === 'PAID' ? ' disabled' : '') + '>标已结</button>' +
                        '<button type="button" class="ops-ref-mark-pending px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 disabled:opacity-40" data-record-id="' + escapeHtml(r.id) + '"' + (r.settlement !== 'PAID' ? ' disabled' : '') + '>改待结</button>' +
                        '</td></tr>'
                    );
                }).join('');
                rows.push(
                    '<tr class="ops-ref-expand-row ' + detailHidden + ' bg-slate-50/90">' +
                    '<td colspan="6" class="p-0">' +
                    '<div class="px-3 py-3 pl-4 md:pl-14 border-t border-indigo-100/80">' +
                    '<p class="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider">组内有效订阅明细（逐笔结算）</p>' +
                    '<div class="overflow-x-auto rounded-2xl border border-indigo-100/60 bg-white/90">' +
                    '<table class="w-full text-left text-xs min-w-[520px]">' +
                    '<thead class="bg-ops-50/60 text-[10px] uppercase font-bold text-ops-800">' +
                    '<tr><th class="px-3 py-2">被推荐租户</th><th class="px-3 py-2">首订日</th><th class="px-3 py-2">状态</th><th class="px-3 py-2 text-right">操作</th></tr></thead>' +
                    '<tbody>' + innerRows + '</tbody></table></div></div></td></tr>'
                );
            });
            tbody.innerHTML = rows.join('');
        }

        function closeBank() {
            var modal = el('ops-modal-bank');
            if (modal) modal.classList.add('hidden');
        }

        function openBankModal(groupKey) {
            selectedBankGroupKey = groupKey;
            var groups = groupReferralEvents(list);
            var g = groups.find(function (x) {
                return x.key === groupKey;
            });
            if (!g) return;
            el('ops-modal-bank-sub').textContent = g.referrer + ' · ' + g.code;
            el('ops-modal-bank-content').textContent = g.bank || '（未登记收款信息）';
            var cnt = el('ops-modal-bank-count');
            if (cnt) cnt.textContent = String(g.records.length);
            el('ops-modal-bank').classList.remove('hidden');
        }

        function settleRecord(recordId, status) {
            var r = list.find(function (x) {
                return x.id === recordId;
            });
            if (!r) return;
            r.settlement = status;
            saveReferrals(list);
            appendAudit('REFERRAL_EVENT_SETTLEMENT', recordId + ' ' + status);
            render();
        }

        function batchSettleGroupPending(groupKey) {
            var n = 0;
            list.forEach(function (e) {
                if (referralGroupKeyFromEvent(e) === groupKey && e.settlement !== 'PAID') {
                    e.settlement = 'PAID';
                    n++;
                }
            });
            if (n === 0) return;
            saveReferrals(list);
            appendAudit('REFERRAL_SETTLEMENT_BATCH', groupKey + ' n=' + n);
            closeBank();
            render();
        }

        render();

        var tbody = el('ops-referral-body');
        if (tbody) {
            tbody.addEventListener('click', function (e) {
                var tgl = e.target.closest('.ops-ref-toggle');
                if (tgl) {
                    var k = decodeGroupKey(tgl.getAttribute('data-group-key') || '');
                    if (!k) return;
                    if (refExpandedGroupKeys.has(k)) refExpandedGroupKeys.delete(k);
                    else refExpandedGroupKeys.add(k);
                    render();
                    return;
                }
                var bank = e.target.closest('.ops-bank');
                if (bank) {
                    var gk = decodeGroupKey(bank.getAttribute('data-group-key') || '');
                    if (gk) openBankModal(gk);
                    return;
                }
                var mp = e.target.closest('.ops-ref-mark-paid');
                if (mp && !mp.disabled) {
                    settleRecord(mp.getAttribute('data-record-id'), 'PAID');
                    return;
                }
                var mpen = e.target.closest('.ops-ref-mark-pending');
                if (mpen && !mpen.disabled) {
                    settleRecord(mpen.getAttribute('data-record-id'), 'PENDING');
                }
            });
        }

        var bclose = el('ops-modal-bank-close');
        var bmodal = el('ops-modal-bank');
        var bbatch = el('ops-btn-bank-batch-paid');
        var bcloseOnly = el('ops-btn-bank-close-only');
        if (bclose) bclose.addEventListener('click', closeBank);
        if (bcloseOnly) bcloseOnly.addEventListener('click', closeBank);
        if (bmodal) {
            bmodal.addEventListener('click', function (e) {
                if (e.target === bmodal) closeBank();
            });
        }
        if (bbatch) {
            bbatch.addEventListener('click', function () {
                if (selectedBankGroupKey) batchSettleGroupPending(selectedBankGroupKey);
            });
        }
    }

    function renderAudit() {
        var box = el('ops-audit-log');
        if (!box) return;
        var logs = loadAudit();
        if (!logs.length) {
            box.innerHTML = '<p class="text-slate-400">暂无记录</p>';
            return;
        }
        box.innerHTML = logs.map(function (l) {
            return (
                '<div class="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2">' +
                '<span class="text-[10px] font-mono text-slate-400">' + escapeHtml(l.ts.slice(0, 19).replace('T', ' ')) + '</span>' +
                '<span class="ml-2 text-[10px] font-black text-ops-700">' + escapeHtml(l.action) + '</span>' +
                '<p class="text-slate-600 mt-0.5">' + escapeHtml(l.detail) + '</p>' +
                '</div>'
            );
        }).join('');
    }

    function initAnnouncePage() {
        renderAudit();
        var pub = el('ops-btn-publish-ann');
        var clr = el('ops-btn-clear-ann');
        if (!pub || !clr) return;
        pub.addEventListener('click', function () {
            var html = el('ops-ann-html').value.trim();
            var vf = el('ops-ann-from').value;
            var vt = el('ops-ann-to').value;
            if (!html) {
                alert('请填写 HTML 内容');
                return;
            }
            var payload = {
                id: 'ann-' + Date.now(),
                html: html,
                validFrom: vf ? new Date(vf).toISOString() : new Date(0).toISOString(),
                validTo: vt ? new Date(vt).toISOString() : new Date('2099-12-31').toISOString()
            };
            try {
                localStorage.setItem(ANNOUNCE_KEY, JSON.stringify(payload));
            } catch (e) { /* ignore */ }
            appendAudit('SITE_ANNOUNCEMENT_PUBLISH', payload.id);
            renderAudit();
            alert('已发布。请打开租户 index.html 查看顶部公告条。');
        });
        clr.addEventListener('click', function () {
            try {
                localStorage.removeItem(ANNOUNCE_KEY);
            } catch (e) { /* ignore */ }
            appendAudit('SITE_ANNOUNCEMENT_CLEAR', '');
            renderAudit();
        });
    }

    function bindNav() {
        document.querySelectorAll('[data-ops-route]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var route = btn.getAttribute('data-ops-route');
                if (route) {
                    location.hash = route;
                    loadModule(route);
                }
            });
        });
    }

    function boot() {
        bindNav();
        var hash = (location.hash || '').replace(/^#/, '');
        var route = ROUTES[hash] ? hash : 'tenants';
        if (!ROUTES[hash]) location.hash = route;
        loadModule(route);
    }

    window.TM_OPS = {
        loadModule: loadModule,
        appendAudit: appendAudit,
        loadAudit: loadAudit
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
    window.addEventListener('hashchange', function () {
        var hash = (location.hash || '').replace(/^#/, '');
        if (ROUTES[hash]) loadModule(hash);
    });
})();
