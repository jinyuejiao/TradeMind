/**
 * TradeMind — 批发商版首次用户导览
 * 强制：欢迎(1) + 语音录单(2)；其余清单项可选
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'tm_onboarding_wholesale_v1';
    var MERCHANT_LABEL = '批发商户';

    var ROLE_MODULES = {
        '管理员': ['dashboard', 'biz', 'crm', 'supply', 'supplier'],
        '运营': ['dashboard', 'crm', 'biz'],
        '仓库': ['dashboard', 'supply', 'supplier'],
        '财务': ['dashboard', 'biz', 'supplier'],
        '只读': ['dashboard', 'crm', 'supply', 'supplier', 'biz']
    };

    var CHECKLIST = [
        { id: 'pendingAudit', label: '待确认单据核对', tab: 'dashboard', stepKey: 'pending' },
        { id: 'inProgressTrack', label: '进行中单据跟单', tab: 'dashboard', stepKey: 'inprogress' },
        { id: 'crmCustomer', label: '客户与往来时间轴', tab: 'crm', stepKey: 'crm' },
        { id: 'productSupply', label: '产品/类别/仓库/进货建议', tab: 'supply', stepKey: 'supply' },
        { id: 'supplierPo', label: '供应商与进货单', tab: 'supplier', stepKey: 'supplierPo' },
        { id: 'bizLedger', label: '账户与往来流水', tab: 'biz', stepKey: 'biz' },
        { id: 'memberAccounts', label: '子账号管理', tab: 'member', stepKey: 'member', primaryOnly: true }
    ];

    var VOICE_EXAMPLES = [
        '华强北李总批发矿泉水 200 箱，总价 8600 元',
        '义乌王姐批发洗衣液 50 件，总价 3750 元',
        '杭州张老板批发大米 10 吨，总价 42000 元'
    ];

    var state = null;
    var root = null;
    var spotlight = null;
    var popover = null;
    var backdrop = null;
    var active = false;
    var blocking = false;
    var currentTourStep = null;
    var voiceExampleIndex = 0;
    var checklistOpen = false;

    function $(id) {
        return document.getElementById(id);
    }

    function getIndustry() {
        try {
            return String(
                (window.TM_UI_CONTEXT && window.TM_UI_CONTEXT.industry) ||
                localStorage.getItem('tm_tenant_merchant_type') ||
                'WHOLESALE'
            ).toUpperCase();
        } catch (e) {
            return 'WHOLESALE';
        }
    }

    function isPrimaryAdmin() {
        if (typeof window.isPrimaryMerchantAdmin === 'function') {
            return window.isPrimaryMerchantAdmin();
        }
        return !sessionStorage.getItem('tm_auth_subuser_role');
    }

    function getSubUserRole() {
        return sessionStorage.getItem('tm_auth_subuser_role') || '';
    }

    function getAllowedModules() {
        if (isPrimaryAdmin()) {
            return ['dashboard', 'biz', 'crm', 'supply', 'supplier', 'member'];
        }
        var role = getSubUserRole() || '运营';
        return ROLE_MODULES[role] || ROLE_MODULES['运营'];
    }

    function getMerchantDisplayLabel() {
        try {
            var type = getIndustry();
            var map = { WHOLESALE: '批发商户', FOREIGN: '外贸商户', ECOM: '电商商户', FACTORY: '工贸一体商户' };
            if (map[type]) return map[type];
            var name = localStorage.getItem('tm_tenant_merchant_display_name');
            return name ? name : MERCHANT_LABEL;
        } catch (e) {
            return MERCHANT_LABEL;
        }
    }

    function defaultState() {
        return {
            version: 1,
            welcomed: false,
            voiceDone: false,
            celebrated: false,
            dismissed: false,
            checklist: {},
            lastChecklistId: null
        };
    }

    function loadState() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return defaultState();
            var o = JSON.parse(raw);
            var base = defaultState();
            base.welcomed = !!o.welcomed;
            base.voiceDone = !!o.voiceDone;
            base.celebrated = !!o.celebrated;
            base.dismissed = !!o.dismissed;
            base.checklist = o.checklist && typeof o.checklist === 'object' ? o.checklist : {};
            base.lastChecklistId = o.lastChecklistId || null;
            return base;
        } catch (e) {
            return defaultState();
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) { /* ignore */ }
    }

    function isFullyDone() {
        return state.voiceDone && state.dismissed;
    }

    function shouldRun() {
        if (getIndustry() !== 'WHOLESALE') return false;
        if (state.dismissed && state.voiceDone) return false;
        return true;
    }

    function getFilteredChecklist() {
        var mods = getAllowedModules();
        return CHECKLIST.filter(function (item) {
            if (item.primaryOnly && !isPrimaryAdmin()) return false;
            if (item.tab === 'member') return mods.indexOf('member') !== -1;
            return mods.indexOf(item.tab) !== -1;
        });
    }

    function ensureRoot() {
        if (root) return;
        root = document.createElement('div');
        root.id = 'tm-onboarding-root';
        root.innerHTML =
            '<div class="tm-onboarding-backdrop" data-onb-backdrop></div>' +
            '<div class="tm-onboarding-spotlight hidden" data-onb-spotlight></div>' +
            '<div class="tm-onboarding-popover hidden" data-onb-popover></div>';
        document.body.appendChild(root);
        root = $('tm-onboarding-root');
        backdrop = root.querySelector('[data-onb-backdrop]');
        spotlight = root.querySelector('[data-onb-spotlight]');
        popover = root.querySelector('[data-onb-popover]');
    }

    function setActive(on) {
        active = on;
        blocking = on && !state.voiceDone;
        ensureRoot();
        root.classList.toggle('tm-onboarding--active', on);
        updateBlockBanner();
        if (!on) {
            hideSpotlight();
        }
    }

    function updateBlockBanner() {
        var id = 'tm-onboarding-block-banner';
        var el = $(id);
        if (!blocking) {
            if (el) el.remove();
            return;
        }
        if (!el) {
            el = document.createElement('div');
            el.id = id;
            el.className = 'tm-onboarding-block-banner';
            el.textContent = '新手引导：请先完成「语音录第一笔单」（步骤 2/2）';
            document.body.appendChild(el);
        }
    }

    function hideSpotlight() {
        if (spotlight) spotlight.classList.add('hidden');
        if (popover) popover.classList.add('hidden');
    }

    function waitMs(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function waitForEl(selector, maxMs) {
        maxMs = maxMs || 8000;
        var start = Date.now();
        return new Promise(function (resolve) {
            function tick() {
                var el = document.querySelector(selector);
                if (el) return resolve(el);
                if (Date.now() - start > maxMs) return resolve(null);
                requestAnimationFrame(tick);
            }
            tick();
        });
    }

    function ensureTab(tabId) {
        return new Promise(function (resolve) {
            if (typeof window.switchTab !== 'function') return resolve();
            window.switchTab(tabId);
            var delay = tabId === 'dashboard' ? 400 : 700;
            setTimeout(resolve, delay);
        });
    }

    function positionSpotlight(el, padding) {
        padding = padding == null ? 8 : padding;
        if (!el || !spotlight || !popover) return;
        var rect = el.getBoundingClientRect();
        var top = Math.max(8, rect.top - padding);
        var left = Math.max(8, rect.left - padding);
        var w = Math.min(window.innerWidth - 16, rect.width + padding * 2);
        var h = Math.min(window.innerHeight - 16, rect.height + padding * 2);
        spotlight.classList.remove('hidden');
        spotlight.style.top = top + 'px';
        spotlight.style.left = left + 'px';
        spotlight.style.width = w + 'px';
        spotlight.style.height = h + 'px';

        popover.classList.remove('hidden');
        var popRect = popover.getBoundingClientRect();
        var popW = popRect.width || 300;
        var popH = popRect.height || 160;
        var popTop = top + h + 12;
        if (popTop + popH > window.innerHeight - 12) {
            popTop = Math.max(12, top - popH - 12);
        }
        var popLeft = Math.max(12, Math.min(left, window.innerWidth - popW - 12));
        popover.style.top = popTop + 'px';
        popover.style.left = popLeft + 'px';
    }

    function showPopover(opts) {
        ensureRoot();
        setActive(true);
        var stepLabel = opts.stepLabel || '';
        popover.innerHTML =
            (stepLabel ? '<div class="tm-onboarding-popover__step">' + stepLabel + '</div>' : '') +
            '<h4 class="tm-onboarding-popover__title">' + opts.title + '</h4>' +
            '<p class="tm-onboarding-popover__body">' + opts.body + '</p>' +
            '<div class="tm-onboarding-popover__actions" data-onb-actions></div>';
        var actions = popover.querySelector('[data-onb-actions]');
        (opts.buttons || []).forEach(function (b) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tm-onboarding-btn ' + (b.primary ? 'tm-onboarding-btn--primary' : b.ghost ? 'tm-onboarding-btn--ghost' : 'tm-onboarding-btn--link');
            btn.textContent = b.label;
            btn.addEventListener('click', function () {
                if (typeof b.onClick === 'function') b.onClick();
            });
            actions.appendChild(btn);
        });
        if (opts.target) {
            requestAnimationFrame(function () {
                positionSpotlight(opts.target, opts.padding);
            });
        } else {
            hideSpotlight();
        }
    }

    function closeTourUi() {
        setActive(false);
        currentTourStep = null;
    }

    function showWelcome() {
        ensureRoot();
        setActive(true);
        var wrap = document.createElement('div');
        wrap.className = 'tm-onboarding-welcome';
        wrap.setAttribute('data-onb-welcome', '1');
        var modules = getFilteredChecklist();
        var moduleHint = modules.map(function (m) { return m.label; }).slice(0, 4).join('、');
        wrap.innerHTML =
            '<div class="tm-onboarding-welcome__card">' +
            '<div class="tm-onboarding-welcome__head">' +
            '<div class="w-12 h-12 mx-auto rounded-xl bg-brand-500/20 flex items-center justify-center"><i class="ph-bold ph-brain text-2xl text-brand-400"></i></div>' +
            '<h2>欢迎使用 TradeMind</h2>' +
            '<p>' + getMerchantDisplayLabel() + ' · 商贸智脑</p>' +
            '</div>' +
            '<div class="tm-onboarding-welcome__body">' +
            '<ul class="tm-onboarding-welcome__list">' +
            '<li><i class="ph ph-microphone-stage"></i><span><strong>步骤 1–2 必学</strong>：了解工作台，并用语音录入第一笔批发单</span></li>' +
            '<li><i class="ph ph-list-checks"></i><span>完成后可自选学习：' + moduleHint + ' 等</span></li>' +
            '</ul>' +
            '<button type="button" class="tm-onboarding-btn tm-onboarding-btn--primary w-full" data-onb-start>开始 2 步必学引导</button>' +
            '</div></div>';
        root.appendChild(wrap);
        wrap.querySelector('[data-onb-start]').addEventListener('click', function () {
            wrap.remove();
            state.welcomed = true;
            saveState();
            startMandatoryPath();
        });
    }

    function showVoiceTips(show) {
        var tips = $('voice-onboarding-tips');
        if (!tips) return;
        tips.classList.toggle('hidden', !show);
        if (show) updateVoiceExample(0);
    }

    function updateVoiceExample(idx) {
        voiceExampleIndex = idx % VOICE_EXAMPLES.length;
        var ex = $('voice-tip-example-text');
        if (ex) ex.textContent = '示例：' + VOICE_EXAMPLES[voiceExampleIndex];
        var dots = document.querySelectorAll('#voice-onboarding-tips .voice-tip-dot');
        dots.forEach(function (d, i) {
            d.classList.toggle('is-active', i === voiceExampleIndex);
        });
    }

    function bindVoiceTipsUi() {
        var tips = $('voice-onboarding-tips');
        if (!tips || tips.getAttribute('data-bound')) return;
        tips.setAttribute('data-bound', '1');
        var dotsWrap = tips.querySelector('.voice-tip-dots');
        if (dotsWrap) {
            dotsWrap.innerHTML = '';
            VOICE_EXAMPLES.forEach(function (_, i) {
                var dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'voice-tip-dot' + (i === 0 ? ' is-active' : '');
                dot.setAttribute('aria-label', '示例 ' + (i + 1));
                dot.addEventListener('click', function () { updateVoiceExample(i); });
                dotsWrap.appendChild(dot);
            });
        }
    }

    function startMandatoryPath() {
        currentTourStep = 'dashboard-intro';
        ensureTab('dashboard').then(function () {
            return waitForEl('#dashboard-ai-extract');
        }).then(function (el) {
            if (!el) el = document.querySelector('#view-dashboard section');
            showPopover({
                stepLabel: '必学 1/2',
                title: '工作台 · AI 订单提取',
                body: '批发日常开单入口在这里：语音、拍照或粘贴聊天文字，系统会生成待确认草稿。',
                target: el,
                padding: 6,
                buttons: [
                    {
                        label: '下一步',
                        primary: true,
                        onClick: function () {
                            startVoiceMandatoryStep();
                        }
                    }
                ]
            });
        });
    }

    function startVoiceMandatoryStep() {
        currentTourStep = 'voice';
        blocking = true;
        updateBlockBanner();
        var voiceBtn = document.querySelector('#dashboard-ai-extract button[onclick*="openVoiceModal"]') ||
            document.querySelector('button[onclick*="openVoiceModal"]');
        showPopover({
            stepLabel: '必学 2/2',
            title: '用语音录入第一笔单',
            body: '请点击下方「语音录入」，按提示说出批发单。格式示例将在弹窗中展示。',
            target: voiceBtn,
            padding: 10,
            buttons: [
                {
                    label: '打开语音录单',
                    primary: true,
                    onClick: function () {
                        hideSpotlight();
                        popover.classList.add('hidden');
                        if (backdrop) backdrop.style.opacity = '0';
                        root.style.pointerEvents = 'none';
                        bindVoiceTipsUi();
                        showVoiceTips(true);
                        var vm = $('voice-modal');
                        if (vm) vm.style.zIndex = '210';
                        if (typeof window.openVoiceModal === 'function') window.openVoiceModal();
                        watchVoiceModal();
                    }
                }
            ]
        });
    }

    function watchVoiceModal() {
        var modal = $('voice-modal');
        if (!modal) return;
        var obs = new MutationObserver(function () {
            if (!modal.classList.contains('hidden')) return;
            if (state.voiceDone) {
                obs.disconnect();
                onMandatoryComplete();
                return;
            }
            if (currentTourStep === 'voice') {
                resetVoiceModalLayer();
                setActive(true);
                startVoiceMandatoryStep();
            }
        });
        obs.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }

    function resetVoiceModalLayer() {
        var vm = $('voice-modal');
        if (vm) vm.style.zIndex = '';
        if (root) {
            root.style.pointerEvents = '';
            if (backdrop) backdrop.style.opacity = '';
        }
    }

    function onVoiceComplete() {
        if (state.voiceDone) return;
        state.voiceDone = true;
        saveState();
        blocking = false;
        updateBlockBanner();
        showVoiceTips(false);
        resetVoiceModalLayer();
        if (!state.celebrated) {
            state.celebrated = true;
            saveState();
            showCelebration();
        }
    }

    function showCelebration() {
        closeTourUi();
        var layer = document.createElement('div');
        layer.className = 'tm-onboarding-celebrate';
        layer.setAttribute('data-onb-celebrate', '1');
        var label = getMerchantDisplayLabel();
        layer.innerHTML =
            '<div class="tm-onboarding-celebrate__card">' +
            '<div class="tm-onboarding-celebrate__icon"><i class="ph ph-sparkle"></i></div>' +
            '<h3 class="tm-onboarding-celebrate__title">太棒了！</h3>' +
            '<p class="tm-onboarding-celebrate__text">您已掌握语音开单。<br>现在可以正式开始<br><span class="tm-onboarding-celebrate__merchant">「' + label + '」</span> 的日常经营。</p>' +
            '<button type="button" class="tm-onboarding-btn tm-onboarding-btn--primary w-full" data-onb-celebrate-ok>进入系统</button>' +
            '</div>';
        document.body.appendChild(layer);
        layer.querySelector('[data-onb-celebrate-ok]').addEventListener('click', function () {
            layer.remove();
            renderChecklistFab();
            showChecklistPanel(true);
        });
    }

    function onMandatoryComplete() {
        closeTourUi();
        renderChecklistFab();
    }

    var OPTIONAL_STEPS = {
        pending: {
            tab: 'dashboard',
            selector: '#pending-list',
            title: '待确认单据',
            body: 'AI 草稿在左侧列表。点击进入核对，确认后才会进入履约。',
            stepLabel: '可选学习'
        },
        inprogress: {
            tab: 'dashboard',
            selector: '#inprogress-list',
            title: '进行中单据',
            body: '右侧跟踪拣货、发货、尾款等状态；也可手动添加订单。',
            stepLabel: '可选学习'
        },
        crm: {
            tab: 'crm',
            selector: '#crm-list-pane, #customer-list-container',
            title: '客户 CRM',
            body: '维护客户档案；详情中的时间轴即该客户往来记录。',
            stepLabel: '可选学习',
            after: function () {
                var first = document.querySelector('#customer-list-container [onclick*="switchCustomerDetail"]');
                if (first) first.click();
            }
        },
        supply: {
            tab: 'supply',
            selector: '#inventorySearch, #view-supply',
            title: '产品中心',
            body: '管理 SKU、一级类别与仓库；缺货时可生成进货建议单。',
            stepLabel: '可选学习'
        },
        supplierPo: {
            tab: 'supplier',
            selector: '#btn-sup-list, #purchase-orders-tbody',
            title: '供应商与进货单',
            body: '查看/管理进货单据，并维护供应商目录。',
            stepLabel: '可选学习'
        },
        biz: {
            tab: 'biz',
            selector: '#biz-account-list',
            title: '智能经营 · 账户流水',
            body: '管理收付款账户，点开账户可查看往来流水（与订单收款账户不同）。',
            stepLabel: '可选学习'
        },
        member: {
            tab: 'member',
            title: '账号管理',
            body: '主账号可在此管理子账号与订阅（侧栏头像进入）。',
            stepLabel: '可选学习',
            action: function () {
                if (typeof window.openMemberModal === 'function') window.openMemberModal();
                return waitForEl('#member-btn-open-accounts', 3000);
            }
        }
    };

    function markChecklistDone(id) {
        state.checklist[id] = true;
        saveState();
        renderChecklistFab();
        if (checklistOpen) renderChecklistPanel(false);
    }

    function runOptionalStep(stepKey, checklistId) {
        var def = OPTIONAL_STEPS[stepKey];
        if (!def) return;
        currentTourStep = stepKey;
        state.lastChecklistId = checklistId;
        saveState();

        function runWithTarget(el) {
            showPopover({
                stepLabel: def.stepLabel,
                title: def.title,
                body: def.body,
                target: el,
                padding: 8,
                buttons: [
                    {
                        label: '完成',
                        primary: true,
                        onClick: function () {
                            markChecklistDone(checklistId);
                            closeTourUi();
                        }
                    },
                    {
                        label: '跳过',
                        ghost: true,
                        onClick: function () {
                            closeTourUi();
                        }
                    }
                ]
            });
        }

        if (def.tab === 'member' && def.action) {
            setActive(true);
            Promise.resolve(def.action()).then(function (el) {
                runWithTarget(el || $('member-btn-open-accounts') || $('member-modal'));
            });
            return;
        }

        ensureTab(def.tab).then(function () {
            if (typeof def.after === 'function') def.after();
            return waitForEl(def.selector, 6000);
        }).then(function (el) {
            if (!el) el = document.getElementById('view-' + def.tab);
            runWithTarget(el);
        });
    }

    function renderChecklistFab() {
        var oldFab = $('tm-onboarding-fab');
        var oldPanel = $('tm-onboarding-checklist-panel');
        if (oldFab) oldFab.remove();
        if (oldPanel) oldPanel.remove();
        if (!state.voiceDone) return;

        var items = getFilteredChecklist();
        var done = items.filter(function (it) { return state.checklist[it.id]; }).length;

        var fab = document.createElement('button');
        fab.type = 'button';
        fab.id = 'tm-onboarding-fab';
        fab.className = 'tm-onboarding-checklist-fab';
        fab.innerHTML = '<i class="ph ph-compass"></i> 功能导览 ' + done + '/' + items.length;
        fab.addEventListener('click', function () {
            showChecklistPanel(!checklistOpen);
        });
        document.body.appendChild(fab);
    }

    function renderChecklistPanel(open) {
        checklistOpen = open !== false;
        var panel = $('tm-onboarding-checklist-panel');
        if (!checklistOpen) {
            if (panel) panel.remove();
            return;
        }
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'tm-onboarding-checklist-panel';
            panel.className = 'tm-onboarding-checklist-panel';
            document.body.appendChild(panel);
        }
        var items = getFilteredChecklist();
        var done = items.filter(function (it) { return state.checklist[it.id]; }).length;
        var html = '<h3>功能导览清单</h3><p class="tm-checklist-progress">已完成 ' + done + ' / ' + items.length + '（均可跳过）</p>';
        items.forEach(function (it) {
            var isDone = !!state.checklist[it.id];
            html +=
                '<div class="tm-onboarding-checklist-item' + (isDone ? ' is-done' : '') + '">' +
                '<i class="ph ' + (isDone ? 'ph-check-circle' : 'ph-circle') + ' tm-check-icon"></i>' +
                '<button type="button" data-check-id="' + it.id + '" data-step-key="' + it.stepKey + '">' + it.label + '</button>' +
                '</div>';
        });
        html += '<button type="button" class="tm-onboarding-btn tm-onboarding-btn--link w-full mt-2" data-onb-dismiss>不再提示导览</button>';
        panel.innerHTML = html;
        panel.querySelectorAll('[data-check-id]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                runOptionalStep(btn.getAttribute('data-step-key'), btn.getAttribute('data-check-id'));
            });
        });
        var dismiss = panel.querySelector('[data-onb-dismiss]');
        if (dismiss) {
            dismiss.addEventListener('click', function () {
                state.dismissed = true;
                saveState();
                showChecklistPanel(false);
                var fab = $('tm-onboarding-fab');
                if (fab) fab.remove();
            });
        }
    }

    function showChecklistPanel(open) {
        renderChecklistPanel(open);
    }

    function init() {
        state = loadState();
        if (!shouldRun()) {
            if (state.voiceDone && !state.dismissed) renderChecklistFab();
            return;
        }
        bindVoiceTipsUi();
        if (!state.welcomed || !state.voiceDone) {
            if (!state.welcomed) {
                setTimeout(showWelcome, 500);
            } else if (!state.voiceDone) {
                setTimeout(startMandatoryPath, 500);
            }
        } else {
            renderChecklistFab();
        }
    }

    function patchSwitchTab() {
        var orig = window.switchTab;
        if (!orig || orig._tmOnboardingPatched) return;
        function wrapped(tabId) {
            if (blocking && tabId !== 'dashboard') {
                if (typeof window.showToast === 'function') {
                    window.showToast('请先完成必学引导：语音录入第一笔单');
                }
                return;
            }
            return orig.call(window, tabId);
        }
        wrapped._tmOnboardingPatched = true;
        window.switchTab = wrapped;
    }

    window.TmOnboarding = {
        isBlocking: function () { return blocking; },
        onVoiceComplete: onVoiceComplete,
        restart: function () {
            state = defaultState();
            saveState();
            var fab = $('tm-onboarding-fab');
            if (fab) fab.remove();
            showChecklistPanel(false);
            showWelcome();
        },
        openChecklist: function () {
            if (!state.voiceDone) {
                if (typeof window.showToast === 'function') window.showToast('请先完成必学步骤');
                return;
            }
            renderChecklistFab();
            showChecklistPanel(true);
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        patchSwitchTab();
        var shell = window.TM_ShellLoader && window.TM_ShellLoader.loadAll;
        var p = shell ? window.TM_ShellLoader.loadAll() : Promise.resolve();
        p.then(function () {
            return waitMs(400);
        }).then(init);
    });
})();
