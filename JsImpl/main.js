// 模块加载函数
function loadDashboard() {
    fetch('./modules/dashboard/dashboard.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('view-dashboard').innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading dashboard:', error);
        });
}

function loadSmartOps() {
    const timestamp = new Date().getTime();
    fetch(`./modules/SmartOps/SmartOps.html?t=${timestamp}`)
        .then(response => response.text())
        .then(data => {
            document.getElementById('view-biz').innerHTML = data;
            setTimeout(() => {
                if (typeof window.initBizAccountManager === 'function') {
                    window.initBizAccountManager();
                }
            }, 0);
        })
        .catch(error => {
            console.error('Error loading SmartOps:', error);
        });
}

function loadCRM() {
    const timestamp = new Date().getTime();
    fetch(`./modules/crm/crm.html?t=${timestamp}`, { cache: 'no-store' })
        .then(response => response.text())
        .then(data => {
            document.getElementById('view-crm').innerHTML = data;
            setTimeout(() => {
                initCrmAlphabetIndex();
            }, 0);
        })
        .catch(error => {
            console.error('Error loading CRM:', error);
        });
}

function loadProductCenter() {
    // 添加时间戳参数，强制浏览器加载最新版本的文件
    const timestamp = new Date().getTime();
    fetch(`./modules/product-center/product-center.html?t=${timestamp}`)
        .then(response => response.text())
        .then(data => {
            document.getElementById('view-supply').innerHTML = data;
            // 直接调用产品中心初始化函数
            setTimeout(() => {
                if (typeof window.initProductCenter === 'function') {
                    window.initProductCenter();
                }
            }, 50);
        })
        .catch(error => {
            console.error('Error loading product center:', error);
        });
}

// ========== 进货单据（供应商管理列表 + 编辑弹窗） ==========
window.PURCHASE_ORDER_STATUSES = ['草稿', '待审核', '审核通过', '部分入库', '全部入库', '审核驳回', '已作废'];

window.purchaseSuggestionHiddenSuppliers = window.purchaseSuggestionHiddenSuppliers || [];

window.purchaseOrdersCatalog = window.purchaseOrdersCatalog || [
    {
        id: 'PUR-2026-001',
        date: '2026-02-25',
        supplier: '深圳照明科技集团',
        total: 12500,
        status: '全部入库',
        source: '图片识别 (OCR)',
        paymentAccount: '对公付款-建行',
        lines: [
            { productName: '金色镂空户外灯 (G-8821)', sku: 'G-882101', qty: 1000, unitPrice: 10.2, unit: '箱', batch: '2602A', subtotal: 10200 },
            { productName: '定制包材组件', sku: 'PKG-01', qty: 5000, unitPrice: 0.46, unit: '件', batch: '', subtotal: 2300 }
        ]
    },
    {
        id: 'PUR-2026-002',
        date: '2026-02-23',
        supplier: '东莞红运包装制品',
        total: 3200,
        status: '部分入库',
        source: '语音输入',
        paymentAccount: '对公付款-建行',
        lines: [
            { productName: '瓦楞纸箱 (标准型)', sku: 'BOX-S', qty: 800, unitPrice: 4, unit: '件', batch: 'V-0223', subtotal: 3200 }
        ]
    }
];

window.poFormContext = window.poFormContext || { supplierName: null };

function formatPurchaseDisplayDate(iso) {
    if (!iso) return '';
    const p = iso.split('-');
    if (p.length === 3) return `${p[0]}.${p[1]}.${p[2]}`;
    return iso;
}

function formatCNYAmount(n) {
    const v = Number(n) || 0;
    return '¥' + v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getPurchaseStatusBadgeClass(status) {
    const map = {
        '草稿': 'bg-slate-100 text-slate-600',
        '待审核': 'bg-amber-50 text-amber-700',
        '审核通过': 'bg-sky-50 text-sky-700',
        '部分入库': 'bg-orange-50 text-orange-600',
        '全部入库': 'bg-emerald-50 text-emerald-700',
        '审核驳回': 'bg-red-50 text-red-600',
        '已作废': 'bg-slate-200 text-slate-500'
    };
    return map[status] || 'bg-slate-50 text-slate-600';
}

function nextPurchaseOrderId() {
    const list = window.purchaseOrdersCatalog || [];
    let maxSeq = 0;
    list.forEach(po => {
        const m = /^PUR-2026-(\d+)$/.exec(po.id);
        if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
    });
    return 'PUR-2026-' + String(maxSeq + 1).padStart(3, '0');
}

function hideSupplierFromPurchaseSuggestions(supplierName) {
    const arr = window.purchaseSuggestionHiddenSuppliers;
    if (supplierName && !arr.includes(supplierName)) arr.push(supplierName);
}

window.removeSupplierPurchaseSuggestion = function(supplierName) {
    hideSupplierFromPurchaseSuggestions(supplierName);
    if (typeof window.refreshPurchaseSuggestionModalContent === 'function') {
        window.refreshPurchaseSuggestionModalContent();
    }
    if (typeof showToast === 'function') showToast('已移除该供应商的进货建议');
};

window.refreshPurchaseOrdersTable = function() {
    const tbody = document.getElementById('purchase-orders-tbody');
    if (!tbody || !window.purchaseOrdersCatalog) return;
    const rows = window.purchaseOrdersCatalog.map(po => {
        const badge = getPurchaseStatusBadgeClass(po.status);
        return `
            <tr onclick="openPurchaseDetail('${po.id}')" class="hover:bg-slate-50/80 transition-all cursor-pointer group">
                <td class="px-6 py-4 font-mono text-slate-400">${formatPurchaseDisplayDate(po.date)}</td>
                <td class="px-6 py-4">
                    <p class="font-bold text-slate-800">${po.id}</p>
                    <p class="text-[9px] text-slate-300 font-medium">提取源：${po.source || '—'}</p>
                </td>
                <td class="px-6 py-4"><span class="font-bold text-brand-600">${po.supplier}</span></td>
                <td class="px-6 py-4 text-right font-mono font-bold col-hide-mobile">${formatCNYAmount(po.total)}</td>
                <td class="px-6 py-4 text-center"><span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${badge}">${po.status}</span></td>
                <td class="px-6 py-4 text-right"><i class="ph ph-caret-right text-slate-300 group-hover:text-brand-500 transition-colors"></i></td>
            </tr>
        `;
    }).join('');
    tbody.innerHTML = rows;
};

function buildPoStatusOptionsHtml(selected) {
    return window.PURCHASE_ORDER_STATUSES.map(s =>
        `<option value="${s}"${s === selected ? ' selected' : ''}>${s}</option>`
    ).join('');
}

function buildProductOptionsForPoForm(selectedId) {
    const list = typeof window.getProductCenterProductList === 'function' ? window.getProductCenterProductList() : [];
    let html = '<option value="">选择产品</option>';
    list.forEach(p => {
        const sel = String(p.id) === String(selectedId) ? ' selected' : '';
        html += `<option value="${p.id}"${sel}>${p.name}</option>`;
    });
    return html;
}

function poFormRowHtml(productId, qty, unitPrice, unit, batch) {
    const opts = buildProductOptionsForPoForm(productId || '');
    const u = unit || '件';
    const sub = (Number(qty) || 0) * (Number(unitPrice) || 0);
    return `
        <tr class="po-form-line" data-po-line>
            <td class="px-2 py-2 align-middle">
                <select class="form-input w-full text-xs po-line-product">${opts}</select>
            </td>
            <td class="px-2 py-2 align-middle"><input type="number" min="0" step="1" class="form-input w-full text-xs text-center po-line-qty" value="${qty != null ? qty : ''}" /></td>
            <td class="px-2 py-2 align-middle"><input type="number" min="0" step="0.01" class="form-input w-full text-xs text-center po-line-price" value="${unitPrice != null ? unitPrice : ''}" /></td>
            <td class="px-2 py-2 align-middle">
                <select class="form-input w-full text-xs text-center po-line-unit">
                    <option value="件"${u === '件' ? ' selected' : ''}>件</option>
                    <option value="箱"${u === '箱' ? ' selected' : ''}>箱</option>
                    <option value="kg"${u === 'kg' ? ' selected' : ''}>kg</option>
                    <option value="盒"${u === '盒' ? ' selected' : ''}>盒</option>
                </select>
            </td>
            <td class="px-2 py-2 align-middle"><input type="text" class="form-input w-full text-xs text-center po-line-batch" value="${batch != null ? String(batch).replace(/"/g, '&quot;') : ''}" placeholder="—" /></td>
            <td class="px-2 py-2 align-middle text-right font-mono font-bold text-slate-800 po-line-sub">${formatCNYAmount(sub)}</td>
            <td class="px-2 py-2 align-middle text-center">
                <button type="button" class="p-1.5 text-risk-high hover:bg-red-50 rounded-lg transition-colors" onclick="poFormRemoveLine(this)" title="删除"><i class="ph ph-trash text-lg"></i></button>
            </td>
        </tr>
    `;
}

window.poFormRecalcTotal = function() {
    const tbody = document.getElementById('po-form-lines-tbody');
    const out = document.getElementById('po-form-total-display');
    if (!tbody || !out) return;
    let sum = 0;
    tbody.querySelectorAll('tr[data-po-line]').forEach(tr => {
        const q = parseFloat(tr.querySelector('.po-line-qty')?.value) || 0;
        const p = parseFloat(tr.querySelector('.po-line-price')?.value) || 0;
        const sub = q * p;
        sum += sub;
        const cell = tr.querySelector('.po-line-sub');
        if (cell) cell.textContent = formatCNYAmount(sub);
    });
    out.textContent = formatCNYAmount(sum);
};

window.poFormOnProductChange = function(selectEl) {
    const tr = selectEl.closest('tr');
    if (!tr) return;
    const id = selectEl.value;
    const list = typeof window.getProductCenterProductList === 'function' ? window.getProductCenterProductList() : [];
    const prod = list.find(p => String(p.id) === String(id));
    const priceInput = tr.querySelector('.po-line-price');
    if (prod && priceInput && !priceInput.dataset.touched) {
        priceInput.value = prod.purchasePrice != null ? prod.purchasePrice : '';
    }
    window.poFormRecalcTotal();
};

window.poFormAddLine = function() {
    const tbody = document.getElementById('po-form-lines-tbody');
    if (!tbody) return;
    tbody.insertAdjacentHTML('beforeend', poFormRowHtml('', '', '', '件', ''));
    window.poFormRecalcTotal();
};

window.poFormRemoveLine = function(btn) {
    const tr = btn.closest('tr');
    if (tr) tr.remove();
    window.poFormRecalcTotal();
};

document.addEventListener('input', function(e) {
    if (!e.target.closest('#purchase-order-form-modal')) return;
    if (e.target.classList.contains('po-line-qty') || e.target.classList.contains('po-line-price')) {
        window.poFormRecalcTotal();
    }
});
document.addEventListener('change', function(e) {
    if (!e.target.closest('#purchase-order-form-modal')) return;
    if (e.target.classList.contains('po-line-product')) {
        window.poFormOnProductChange(e.target);
    }
    if (e.target.classList.contains('po-line-unit')) {
        window.poFormRecalcTotal();
    }
});

window.openPurchaseOrderFormModal = function(payload) {
    const modal = document.getElementById('purchase-order-form-modal');
    if (!modal) return;
    const supplier = payload && payload.supplierName ? payload.supplierName : '';
    const lines = (payload && payload.lines) || [];
    window.poFormContext = { supplierName: supplier, fromSuggestion: !!(payload && payload.fromSuggestion) };

    const title = document.getElementById('po-form-title');
    if (title) title.textContent = payload && payload.title ? payload.title : '编辑进货单';

    const supSel = document.getElementById('po-form-supplier');
    if (supSel) {
        supSel.innerHTML = `<option value="${supplier.replace(/"/g, '&quot;')}">${supplier}</option>`;
        supSel.value = supplier;
    }

    const st = document.getElementById('po-form-status');
    if (st) {
        const defaultStatus = payload && payload.defaultStatus ? payload.defaultStatus : '草稿';
        st.innerHTML = buildPoStatusOptionsHtml(defaultStatus);
        st.disabled = !!(payload && payload.fromSuggestion);
    }

    const dt = document.getElementById('po-form-date');
    if (dt) {
        const d = payload && payload.date ? payload.date : new Date().toISOString().slice(0, 10);
        dt.value = d;
    }

    const tbody = document.getElementById('po-form-lines-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        if (lines.length) {
            lines.forEach(l => {
                tbody.insertAdjacentHTML('beforeend', poFormRowHtml(l.productId, l.qty, l.unitPrice, l.unit || '件', l.batch || ''));
            });
        } else {
            tbody.insertAdjacentHTML('beforeend', poFormRowHtml('', '', '', '件', ''));
        }
    }

    window.poFormRecalcTotal();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

window.closePurchaseOrderFormModal = function() {
    const modal = document.getElementById('purchase-order-form-modal');
    if (modal) modal.classList.add('hidden');
    const sug = document.getElementById('purchase-suggestion-modal');
    if (sug && !sug.classList.contains('hidden')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
};

window.openPurchaseOrderFormFromSuggestion = function(supplierName) {
    const grouped = typeof window.getVisibleOutOfStockPurchaseGroups === 'function'
        ? window.getVisibleOutOfStockPurchaseGroups()
        : null;
    if (!grouped || !grouped[supplierName]) {
        if (typeof showToast === 'function') showToast('未找到该供应商的缺货建议');
        return;
    }
    const rows = grouped[supplierName];
    const lines = rows.map(r => ({
        productId: r.id,
        qty: r.suggest,
        unitPrice: r.unitCost,
        unit: '件',
        batch: ''
    }));
    window.openPurchaseOrderFormModal({
        supplierName,
        lines,
        fromSuggestion: true,
        defaultStatus: '待审核',
        title: '编辑进货单',
        date: new Date().toISOString().slice(0, 10)
    });
};

window.savePurchaseOrderForm = function() {
    const ctx = window.poFormContext || {};
    const supplier = document.getElementById('po-form-supplier')?.value || '';
    const status = document.getElementById('po-form-status')?.value || '草稿';
    const dateStr = document.getElementById('po-form-date')?.value || new Date().toISOString().slice(0, 10);
    const payment = document.getElementById('po-form-payment')?.value || '';
    const tbody = document.getElementById('po-form-lines-tbody');
    if (!tbody || !supplier) return;

    const list = typeof window.getProductCenterProductList === 'function' ? window.getProductCenterProductList() : [];
    const lines = [];
    let total = 0;
    tbody.querySelectorAll('tr[data-po-line]').forEach(tr => {
        const pid = tr.querySelector('.po-line-product')?.value;
        const qty = parseFloat(tr.querySelector('.po-line-qty')?.value) || 0;
        const unitPrice = parseFloat(tr.querySelector('.po-line-price')?.value) || 0;
        const unit = tr.querySelector('.po-line-unit')?.value || '件';
        const batch = tr.querySelector('.po-line-batch')?.value || '';
        if (!pid && qty === 0 && unitPrice === 0) return;
        const prod = list.find(p => String(p.id) === String(pid));
        const productName = prod ? prod.name : (pid ? '未命名产品' : '');
        const sku = prod ? prod.sku : '';
        const subtotal = qty * unitPrice;
        total += subtotal;
        if (!pid) return;
        lines.push({ productName, sku, qty, unitPrice, unit, batch, subtotal });
    });

    if (!lines.length) {
        if (typeof showToast === 'function') showToast('请至少保留一行有效商品');
        else alert('请至少保留一行有效商品');
        return;
    }

    const finalStatus = ctx.fromSuggestion ? '待审核' : status;

    const newPo = {
        id: nextPurchaseOrderId(),
        date: dateStr,
        supplier,
        total,
        status: finalStatus,
        source: ctx.fromSuggestion ? '产品中心 · 缺货建议生成' : '手工录入',
        paymentAccount: payment,
        lines
    };
    window.purchaseOrdersCatalog.unshift(newPo);
    if (ctx.fromSuggestion) {
        hideSupplierFromPurchaseSuggestions(supplier);
        if (typeof window.refreshPurchaseSuggestionModalContent === 'function') {
            window.refreshPurchaseSuggestionModalContent();
        }
    }
    window.refreshPurchaseOrdersTable();
    window.closePurchaseOrderFormModal();
    if (typeof showToast === 'function') showToast('进货单据已保存：' + newPo.id + '（' + finalStatus + '）');
    else alert('已保存');
};

function loadSupplier() {
    // 添加时间戳参数，强制浏览器加载最新版本的文件
    const timestamp = new Date().getTime();
    fetch(`./modules/supply-chain/supply-chain.html?t=${timestamp}`)
        .then(response => response.text())
        .then(data => {
            document.getElementById('view-supplier').innerHTML = data;
            if (typeof window.refreshPurchaseOrdersTable === 'function') {
                window.refreshPurchaseOrdersTable();
            }
        })
        .catch(error => {
            console.error('Error loading supplier:', error);
        });
}

// 页面加载时加载默认模块
window.onload = function() {
    loadDashboard();
    if (typeof syncSidebarMembershipBadge === 'function') syncSidebarMembershipBadge();
};

function switchTab(tabId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById('view-' + tabId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
        btn.classList.remove('active-nav', 'bg-slate-800', 'text-brand-500', 'text-brand-600');
        btn.classList.add('text-slate-400');
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('bg-slate-800', 'text-brand-500', 'text-brand-600', 'active-nav');
            btn.classList.remove('text-slate-400');
        }
    });

    const titles = { 'dashboard': '工作台', 'biz': '智能经营', 'crm': '客户管理 CRM', 'supply': '产品中心', 'supplier': '供应商管理' };
    if (document.getElementById('page-title')) document.getElementById('page-title').innerText = titles[tabId];
    document.getElementById('content-area').scrollTop = 0;

    // 加载对应模块
    if (tabId === 'dashboard') loadDashboard();
    else if (tabId === 'biz') loadSmartOps();
    else if (tabId === 'crm') loadCRM();
    else if (tabId === 'supply') loadProductCenter();
    else if (tabId === 'supplier') loadSupplier();
}

function openAIAnalysis() { document.getElementById('ai-modal').classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeAIAnalysis() { document.getElementById('ai-modal').classList.add('hidden'); document.body.style.overflow = ''; }

// 手机端侧边栏切换
function toggleSidebar() {
    const sb = document.getElementById('main-sidebar');
    const ol = document.getElementById('sidebar-overlay');
    if (sb) sb.classList.toggle('open');
    if (ol) ol.classList.toggle('hidden');
}

// --- 会员账户与子账号（本地持久化演示） ---
const MEMBERSHIP_STORAGE_KEY = 'tm_membership_account_v1';
const MEMBER_PREMIUM_SUBUSER_MAX = 4;
const MEMBER_SUBUSER_ROLES = ['管理员', '运营', '仓库', '财务', '只读'];

function defaultMembershipAccount() {
    return {
        subscribed: false,
        plan: null,
        expiryDate: '',
        referralCode: 'GIGA-JIN-8821',
        subUsers: []
    };
}

function loadMembershipAccount() {
    try {
        const raw = localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
        if (!raw) return defaultMembershipAccount();
        const o = JSON.parse(raw);
        const base = defaultMembershipAccount();
        return {
            ...base,
            ...o,
            subUsers: Array.isArray(o.subUsers) ? o.subUsers : []
        };
    } catch (e) {
        return defaultMembershipAccount();
    }
}

window.membershipAccount = loadMembershipAccount();

window.saveMembershipAccount = function() {
    try {
        localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(window.membershipAccount));
    } catch (e) { /* ignore */ }
    syncSidebarMembershipBadge();
};

function syncSidebarMembershipBadge() {
    const label = document.getElementById('sidebar-member-label');
    if (!label) return;
    const m = window.membershipAccount;
    if (!m || !m.subscribed || !m.plan) {
        label.textContent = '试用版本';
        return;
    }
    if (m.plan === 'starter') label.textContent = '启航会员';
    else if (m.plan === 'premium') label.textContent = '优享会员';
    else label.textContent = '试用版本';
}

function formatMembershipExpiryDisplay(iso) {
    if (!iso) return '—';
    const p = String(iso).split('-');
    if (p.length !== 3) return iso;
    return `${p[0]}年${parseInt(p[1], 10)}月${parseInt(p[2], 10)}日`;
}

function membershipPlanLabel(plan) {
    if (plan === 'starter') return '启航会员';
    if (plan === 'premium') return '优享会员';
    return '—';
}

function buildSubUserRoleOptionsHtml(selected) {
    return MEMBER_SUBUSER_ROLES.map(r =>
        `<option value="${r}"${r === selected ? ' selected' : ''}>${r}</option>`
    ).join('');
}

function renderMemberSubUsersTable() {
    const tbody = document.getElementById('member-subusers-tbody');
    const roleSel = document.getElementById('member-new-user-role');
    const badge = document.getElementById('member-subuser-count-badge');
    const hint = document.getElementById('member-subuser-limit-hint');
    if (!tbody) return;

    const list = window.membershipAccount.subUsers || [];
    const used = list.length;
    if (badge) badge.textContent = `已创建 ${used} / ${MEMBER_PREMIUM_SUBUSER_MAX}（不含主账号）`;
    if (hint) {
        hint.textContent = used >= MEMBER_PREMIUM_SUBUSER_MAX
            ? '已达优享版子账号上限，请先删除用户后再新建。'
            : `优享版含主账号共 5 个席位，您还可创建 ${MEMBER_PREMIUM_SUBUSER_MAX - used} 个子账号。`;
    }
    tbody.innerHTML = list.map(u => `
        <tr class="hover:bg-slate-50/80">
            <td class="px-4 py-3 font-bold text-slate-800">${escapeMemberHtml(u.name)}</td>
            <td class="px-4 py-3">
                <select class="form-input w-full text-xs member-subuser-role" data-user-id="${escapeMemberHtml(u.id)}" onchange="memberSubUserRoleChange(this.dataset.userId, this.value)">
                    ${buildSubUserRoleOptionsHtml(u.role)}
                </select>
            </td>
            <td class="px-4 py-3 text-center">
                <button type="button" class="p-1.5 text-risk-high hover:bg-red-50 rounded-lg transition" title="删除" onclick="memberDeleteSubUser(${JSON.stringify(String(u.id))})">
                    <i class="ph ph-trash text-lg"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="3" class="px-4 py-8 text-center text-slate-400 text-xs">暂无子账号，请在下方新建。</td></tr>';
}

function escapeMemberHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');
}

function renderMemberModalPanels() {
    const m = window.membershipAccount;
    const sumBox = document.getElementById('member-subscribed-summary');
    const premBox = document.getElementById('member-premium-users-section');
    const planEl = document.getElementById('member-summary-plan');
    const expEl = document.getElementById('member-summary-expiry');
    const refEl = document.getElementById('member-summary-referral');
    const refInline = document.getElementById('member-referral-inline');

    const code = m.referralCode || '—';
    if (refInline) refInline.textContent = code;

    if (m.subscribed && m.plan) {
        if (sumBox) sumBox.classList.remove('hidden');
        if (planEl) planEl.textContent = membershipPlanLabel(m.plan);
        if (expEl) expEl.textContent = formatMembershipExpiryDisplay(m.expiryDate);
        if (refEl) refEl.textContent = code;
    } else {
        if (sumBox) sumBox.classList.add('hidden');
    }

    if (m.subscribed && m.plan === 'premium') {
        if (premBox) premBox.classList.remove('hidden');
        const newRole = document.getElementById('member-new-user-role');
        if (newRole) newRole.innerHTML = buildSubUserRoleOptionsHtml(MEMBER_SUBUSER_ROLES[1]);
        renderMemberSubUsersTable();
    } else if (premBox) {
        premBox.classList.add('hidden');
    }
}

window.memberSubscribePlan = function(plan) {
    const m = window.membershipAccount;
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 1);
    m.subscribed = true;
    m.plan = plan;
    m.expiryDate = exp.toISOString().slice(0, 10);
    if (plan === 'starter') {
        m.subUsers = [];
    }
    window.saveMembershipAccount();
    renderMemberModalPanels();
    if (typeof showToast === 'function') {
        showToast(plan === 'premium' ? '已订阅优享会员（演示）' : '已订阅启航会员（演示）');
    }
};

window.memberAddSubUser = function() {
    const m = window.membershipAccount;
    if (!m.subscribed || m.plan !== 'premium') return;
    const list = m.subUsers || [];
    if (list.length >= MEMBER_PREMIUM_SUBUSER_MAX) {
        if (typeof showToast === 'function') showToast('子账号已达上限（4 个）');
        else alert('子账号已达上限');
        return;
    }
    const nameInput = document.getElementById('member-new-user-name');
    const roleSel = document.getElementById('member-new-user-role');
    const name = (nameInput && nameInput.value || '').trim();
    const role = roleSel && roleSel.value ? roleSel.value : MEMBER_SUBUSER_ROLES[1];
    if (!name) {
        if (typeof showToast === 'function') showToast('请输入用户名称');
        else alert('请输入用户名称');
        return;
    }
    if (list.some(u => u.name === name)) {
        if (typeof showToast === 'function') showToast('该名称已存在');
        return;
    }
    list.push({
        id: 'su_' + Date.now().toString(36),
        name,
        role
    });
    m.subUsers = list;
    window.saveMembershipAccount();
    if (nameInput) nameInput.value = '';
    renderMemberSubUsersTable();
    if (typeof showToast === 'function') showToast('子账号已创建');
};

window.memberDeleteSubUser = function(userId) {
    if (!userId || !confirm('确定删除该子账号？')) return;
    const m = window.membershipAccount;
    m.subUsers = (m.subUsers || []).filter(u => String(u.id) !== String(userId));
    window.saveMembershipAccount();
    renderMemberSubUsersTable();
    if (typeof showToast === 'function') showToast('已删除子账号');
};

window.memberSubUserRoleChange = function(userId, newRole) {
    if (!userId) return;
    const m = window.membershipAccount;
    const u = (m.subUsers || []).find(x => String(x.id) === String(userId));
    if (u) {
        u.role = newRole;
        window.saveMembershipAccount();
        if (typeof showToast === 'function') showToast('角色已更新');
    }
};

function syncPosterReferralFromAccount() {
    const code = (window.membershipAccount && window.membershipAccount.referralCode) || 'GIGA-JIN-8821';
    const el = document.getElementById('poster-ref-code');
    if (el) el.textContent = code;
    const qr = document.getElementById('poster-qr');
    if (qr) {
        const enc = encodeURIComponent('TradeMind-' + code);
        qr.src = 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + enc;
    }
}

// --- <用户订阅>语音逻辑 (修复版) ---
function computeLaunchDiscountLabel(originPrice, launchPrice) {
    if (!originPrice || !launchPrice || originPrice <= 0) return '首发优惠';
    const discount = (launchPrice / originPrice * 10).toFixed(1);
    const savePercent = Math.round((1 - launchPrice / originPrice) * 100);
    return `首发 ${discount} 折 · 立省 ${savePercent}%`;
}

function initMemberPricing() {
    const launch = { origin: 2388, price: 888 };
    const plus = { origin: 5888, price: 1288 };

    const launchDiscount = computeLaunchDiscountLabel(launch.origin, launch.price);
    const plusDiscount = computeLaunchDiscountLabel(plus.origin, plus.price);

    const launchDiscountEl = document.getElementById('plan-launch-discount');
    const plusDiscountEl = document.getElementById('plan-plus-discount');
    const plusRibbonEl = document.getElementById('plan-plus-discount-ribbon');
    const launchBadgeEl = document.getElementById('plan-launch-badge');

    if (launchDiscountEl) launchDiscountEl.innerText = launchDiscount;
    if (plusDiscountEl) plusDiscountEl.innerText = plusDiscount;
    if (plusRibbonEl) plusRibbonEl.innerText = plusDiscount.split('·')[0].trim();
    if (launchBadgeEl) launchBadgeEl.innerText = launchDiscount.split('·')[0].trim();
}

// 会员弹窗控制
function openMemberModal() {
    window.membershipAccount = loadMembershipAccount();
    initMemberPricing();
    renderMemberModalPanels();
    document.getElementById('member-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
function closeMemberModal() { document.getElementById('member-modal').classList.add('hidden'); document.body.style.overflow = ''; }

// 品牌海报控制
function showPoster() {
    syncPosterReferralFromAccount();
    document.getElementById('poster-modal').classList.remove('hidden');
}
function closePoster() { document.getElementById('poster-modal').classList.add('hidden'); }
/**
* 核心功能：生成并下载海报照片
*/
async function downloadPoster() {
    const saveBtn = event.currentTarget;
    const originalText = saveBtn.innerHTML;

    // 改变按钮状态
    saveBtn.innerHTML = '<i class="ph ph-circle-notch animate-spin text-lg"></i> 生成中...';
    saveBtn.disabled = true;

    const element = document.getElementById('poster-capture-area');

    try {
        const canvas = await html2canvas(element, {
            backgroundColor: null,
            useCORS: true, // 允许加载跨域图片(二维码)
            scale: 3,      // 提升清晰度
            borderRadius: 40
        });

        // 转为图片并下载
        const link = document.createElement('a');
        const refCode = (document.getElementById('poster-ref-code')?.innerText || 'TM-REF').replace(/\s+/g, '');
        link.download = `TradeMind-Invite-${refCode}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error('海报生成失败:', err);
        alert('保存失败，请稍后重试');
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// --- <工作台>语音逻辑 (修复版) ---
let recTimer;
function openVoiceModal() { document.getElementById('voice-modal').classList.remove('hidden'); setVoiceUI('ready'); }
function setVoiceUI(s) {
    document.getElementById('voice-ready-ui').classList.toggle('hidden', s !== 'ready');
    document.getElementById('voice-active-ui').classList.toggle('hidden', s !== 'active');
    document.getElementById('voice-processing-ui').classList.toggle('hidden', s !== 'processing');
}
function startVoiceRecording() {
    setVoiceUI('active');
    document.getElementById('voice-pulse-icon').classList.add('recording-pulse');
    let sec = 0;
    recTimer = setInterval(() => { sec++; document.getElementById('voice-timer').innerText = `00:${sec.toString().padStart(2, '0')}`; }, 1000);
}
function stopVoiceRecording() {
    clearInterval(recTimer);
    document.getElementById('voice-pulse-icon').classList.remove('recording-pulse');
    setVoiceUI('processing'); // 切换到 AI 处理中状态

    // 核心修复：模拟处理闭环
    setTimeout(() => {
        closeVoiceModal();
        showToast("语音解析成功，已生成草稿单据");
    }, 2000);
}

function closeVoiceModal() { document.getElementById('voice-modal').classList.add('hidden'); clearInterval(recTimer); document.getElementById('voice-timer').innerText = "00:00"; }

// --- 拍照逻辑 (修复版) ---
function openPhotoModal() { document.getElementById('photo-modal').classList.remove('hidden'); resetPhoto(); }
function handlePhotoSelected(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('image-preview').src = e.target.result;
            document.getElementById('photo-preview-area').classList.remove('hidden');
            // 核心修复：选择图片后，手动移除按钮的禁用状态
            const btn = document.getElementById('photo-submit-btn');
            btn.disabled = false;
        };
        reader.readAsDataURL(input.files[0]);
    }
}
function resetPhoto() { document.getElementById('photo-preview-area').classList.add('hidden'); document.getElementById('photo-submit-btn').disabled = true; }
function submitPhoto() { closePhotoModal(); showToast("识别任务已提交 AI 队列"); }
function closePhotoModal() { document.getElementById('photo-modal').classList.add('hidden'); }

// --- 4. 文本解析逻辑 (修复清空动作) ---
function handleTextSubmit() {
    const el = document.getElementById('orderTextInput');
    if (!el.value.trim()) {
        alert("请先粘贴订单文本");
        return;
    }
    showToast("文本内容已提交 AI 解析");
    el.value = ""; // 核心修复：提交后清空内容
}

// 弹窗 Tab 切换 (订单核对)
function switchAuditTab(tab) {
    document.querySelectorAll('.sub-pane').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('pane-' + tab).classList.remove('hidden');
    document.getElementById('tab-' + tab).classList.add('active');
}

// 进行中单据详情：基础数据与状态配置
const orderDetailMap = {
    'INV-2026-0082': {
        customerName: 'John Smith',
        deliveryDate: '2026-04-25',
        status: '待仓库捡货',
        receiptAccount: '默认收款账户'
    },
    'INV-2026-0079': {
        customerName: 'Satoshi Nakamoto',
        deliveryDate: '2026-04-27',
        status: '待支付尾款',
        receiptAccount: '默认收款账户'
    }
};

const orderStatusClassMap = {
    '待仓库捡货': 'text-[9px] text-brand-600 font-bold',
    '待支付尾款': 'text-[9px] text-orange-500 font-bold',
    '待发货': 'text-[9px] text-blue-600 font-bold',
    '已发货': 'text-[9px] text-blue-500 font-bold',
    '已完成': 'text-[9px] text-emerald-600 font-bold',
    '已退款': 'text-[9px] text-slate-500 font-bold'
};

let activeOrderDetailId = '';

//  进行中单据：详情查看逻辑
function openOrderDetail(orderId) {
    const detail = orderDetailMap[orderId];
    activeOrderDetailId = orderId;
    document.getElementById('detail-order-id').innerText = orderId;

    if (detail) {
        document.getElementById('detail-customer-name').value = detail.customerName;
        document.getElementById('detail-delivery-date').value = detail.deliveryDate;
        document.getElementById('detail-order-status').value = detail.status;
        document.getElementById('detail-receipt-account').value = detail.receiptAccount || '默认收款账户';
    } else {
        document.getElementById('detail-customer-name').value = '';
        document.getElementById('detail-delivery-date').value = '';
        document.getElementById('detail-order-status').value = '待仓库捡货';
        document.getElementById('detail-receipt-account').value = '默认收款账户';
    }

    const modal = document.getElementById('order-detail-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function handleDetailStatusChange(newStatus) {
    if (!activeOrderDetailId) return;

    if (!orderDetailMap[activeOrderDetailId]) {
        orderDetailMap[activeOrderDetailId] = {
            customerName: '',
            deliveryDate: '',
            status: newStatus
        };
    } else {
        orderDetailMap[activeOrderDetailId].status = newStatus;
    }

    const label = document.getElementById(`order-status-label-${activeOrderDetailId}`);
    if (label) {
        label.innerText = newStatus;
        label.className = orderStatusClassMap[newStatus] || 'text-[9px] text-slate-500 font-bold';
    }
}

function handleDetailReceiptAccountChange(newAccount) {
    if (!activeOrderDetailId) return;
    if (!orderDetailMap[activeOrderDetailId]) return;
    orderDetailMap[activeOrderDetailId].receiptAccount = newAccount;
}

function closeOrderDetail() {
    const modal = document.getElementById('order-detail-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    activeOrderDetailId = '';
}

function deletePendingDraft(triggerBtn) {
    const targetCard = triggerBtn.closest('.group');
    if (!targetCard) return;
    targetCard.remove();
    showToast('草稿单据已删除');
}

// 弹窗开关
function toggleAuditModalVisibility(visible) {
    const auditModals = document.querySelectorAll('[id="audit-modal"]');
    auditModals.forEach((modal) => {
        if (visible) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    });
    document.body.style.overflow = visible ? 'hidden' : '';
}

function openAuditModal(name) {
    const auditCustomerInput = document.getElementById('audit-customer-name');
    if (auditCustomerInput && name) {
        auditCustomerInput.value = name;
    }

    const auditDeliveryDate = document.getElementById('audit-delivery-date');
    if (auditDeliveryDate) {
        auditDeliveryDate.value = '2026-04-25';
    }

    const auditReceiptAccount = document.getElementById('audit-receipt-account');
    if (auditReceiptAccount) {
        auditReceiptAccount.value = '默认收款账户';
    }

    toggleAuditModalVisibility(true);
}
function closeAuditModal() {
    toggleAuditModalVisibility(false);
}

window.openAuditModal = openAuditModal;
window.closeAuditModal = closeAuditModal;

// 高级信息抽屉切换
function toggleAdvanced(type) {
    const drawer = document.getElementById('drawer-' + type);
    const icon = document.getElementById('icon-' + type);
    drawer.classList.toggle('open');
    icon.classList.toggle('ph-caret-up');
    icon.classList.toggle('ph-caret-down');
}

// 单位弹窗开关
function openUnitModal() { document.getElementById('unit-modal').classList.remove('hidden'); }
function closeUnitModal() { document.getElementById('unit-modal').classList.add('hidden'); }

// 模拟报表切换逻辑 (补全)
function switchReport(type) {
    document.querySelectorAll('.report-tab').forEach(btn => btn.classList.remove('report-active'));
    event.target.closest('.report-tab').classList.add('report-active');
    const container = document.getElementById('report-visual-container');
    const title = document.getElementById('report-display-title');
    container.style.opacity = '0';
    setTimeout(() => {
        container.style.opacity = '1';
        if (type === 'rev') {
            title.innerText = '营收走势 (近6个月)';
            container.innerHTML = `<div class="bar-item-slim h-[40%] bg-slate-100"></div><div class="bar-item-slim h-[55%] bg-slate-100"></div><div class="bar-item-slim h-[45%] bg-slate-100"></div><div class="bar-item-slim h-[70%] bg-brand-100"></div><div class="bar-item-slim h-[85%] shadow-lg"></div><div class="bar-item-slim h-[92%] shadow-lg"></div>`;
        } else if (type === 'stock') {
            title.innerText = '实时库存健康状况分布';
            container.innerHTML = `<div class="donut-ring"><div class="donut-hole"><p class="text-[10px] text-slate-400 font-bold">健康度</p><p class="text-2xl font-mono font-bold text-brand-600">82%</p></div></div>`;
        }
    }, 300);
}

// --- 手动订单逻辑 ---
function openManualOrderModal() {
    document.getElementById('manual-order-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    calculateManualTotal();
}

function closeManualOrderModal() {
    document.getElementById('manual-order-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

function addOrderRow() {
    const tbody = document.querySelector('#manual-order-table tbody');
    const newRow = tbody.rows[0].cloneNode(true);
    newRow.querySelector('.qty-input').value = 1;
    newRow.querySelector('.price-input').value = 0;
    newRow.querySelector('.row-total').innerText = "$0.00";
    tbody.appendChild(newRow);

    // 绑定新行的下拉联动
    const selects = newRow.querySelectorAll('.product-select');
    selects.forEach(s => {
        s.addEventListener('change', function () {
            newRow.querySelector('.price-input').value = this.value;
            calculateManualTotal();
        });
    });
}

// 核心功能：自动计算总金额
function calculateManualTotal() {
    let grandTotal = 0;
    const rows = document.querySelectorAll('#manual-order-table tbody tr');

    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
        const price = parseFloat(row.querySelector('.price-input').value) || 0;
        const subtotal = qty * price;
        row.querySelector('.row-total').innerText = `$${subtotal.toFixed(2)}`;
        grandTotal += subtotal;
    });

    document.getElementById('manual-grand-total').innerText = `$${grandTotal.toFixed(2)}`;
}

// 监听现有第一行的选择变化
document.querySelectorAll('.product-select').forEach(s => {
    s.addEventListener('change', function () {
        this.closest('tr').querySelector('.price-input').value = this.value;
        calculateManualTotal();
    });
});

// 确认入库逻辑
function saveManualOrder() {
    const grandTotal = document.getElementById('manual-grand-total').innerText;
    if (grandTotal === "$0.00") return alert("请添加有效商品和金额");

    // 模拟入库：在右侧列表新增一项
    const list = document.getElementById('inprogress-list');
    const newItem = document.createElement('div');
    newItem.className = "p-4 border border-slate-50 rounded-xl bg-white hover:border-brand-500 transition-all cursor-pointer flex justify-between items-center group fade-in";
    const newId = "INV-MANUAL-" + Math.floor(Math.random() * 9000 + 1000);
    newItem.onclick = function () { openViewDetail('新录入客户', 'MANUAL'); };
    newItem.innerHTML = `
                                            <div><p class="text-xs font-bold text-slate-800 group-hover:text-brand-600 transition-colors">${newId}</p>
                                            <div class="flex items-center gap-2 mt-1"><span class="text-[9px] text-slate-400 uppercase tracking-tighter">手动录入单据</span><span class="w-1 h-1 bg-brand-500 rounded-full"></span><span class="text-[9px] text-brand-600 font-bold">待发货</span></div></div>
                                            <div class="text-[11px] font-mono font-bold text-slate-900">${grandTotal}</div>`;
    list.prepend(newItem);

    closeManualOrderModal();
    alert("订单已成功入库并生成履约任务。");
}

// --- 详情查看逻辑 (包含来源标识) ---
function openViewDetail(customer, sourceKey) {
    const sources = {
        'AUDIO': '音频提取',
        'PHOTO': '图片提取',
        'TEXT': '文字提取',
        'MANUAL': '手动添加'
    };
    document.getElementById('detail-customer-display').innerText = customer;
    document.getElementById('detail-source-display').innerText = "提取源：" + (sources[sourceKey] || "系统生成");
    document.getElementById('view-detail-modal').classList.remove('hidden');
}

function closeViewDetail() { document.getElementById('view-detail-modal').classList.add('hidden'); }

// --- 智能经营交互逻辑 ---
function switchReport(type) {
    // 修复：确保 active 状态切换到正确的按钮上
    document.querySelectorAll('.report-tab').forEach(btn => btn.classList.remove('report-active'));
    // 如果点击的是按钮内部元素，强制寻找最近的 button 标签
    const targetBtn = event.target.closest('.report-tab');
    if (targetBtn) targetBtn.classList.add('report-active');

    const container = document.getElementById('report-visual-container');
    const labelContainer = document.getElementById('report-label-container');
    const title = document.getElementById('report-display-title');
    const legend = document.getElementById('report-legend');

    container.style.opacity = '0';

    setTimeout(() => {
        container.style.opacity = '1';
        if (type === 'rev') {
            title.innerText = '营收趋势分析 (近6个月)';
            if (legend) {
                legend.style.display = 'flex';
                legend.innerHTML = `
                                                                                            <span class="flex items-center gap-1"><span class="w-2 h-2 bg-brand-500 rounded-full"></span> 实绩</span>
                                                                                            <span class="flex items-center gap-1"><span class="w-2 h-2 bg-slate-200 rounded-full"></span> 历史</span>
                                                                                            <span class="flex items-center gap-1"><span class="w-2 h-0.5 border-t border-brand-500 border-dashed"></span> 预测</span>
                                                                                        `;
            }

            // 重新定义容器布局：[Y轴区域] + [主绘图区]
            container.className = 'flex-1 flex flex-row items-stretch overflow-hidden pt-4';

            container.innerHTML = `
                                                                                            <!-- 1. Y轴刻度区域 -->
                                                                                            <div class="flex flex-col justify-between mb-8 pb-1 axis-text shrink-0 text-right w-10 pr-3 border-r border-slate-100">
                                                                                                <span>20k</span>
                                                                                                <span>15k</span>
                                                                                                <span>10k</span>
                                                                                                <span>5k</span>
                                                                                                <span class="text-slate-300">0</span>
                                                                                            </div>

                                                                                            <!-- 2. 主绘图区 -->
                                                                                            <div class="relative flex-1 flex items-end justify-between px-2 md:px-6">
                                                                                                <!-- 背景水平辅助网格线 -->
                                                                                                <div class="absolute inset-0 flex flex-col justify-between mb-8 pb-1 pointer-events-none">
                                                                                                    <div class="w-full border-t border-slate-50 border-dashed"></div>
                                                                                                    <div class="w-full border-t border-slate-50 border-dashed"></div>
                                                                                                    <div class="w-full border-t border-slate-50 border-dashed"></div>
                                                                                                    <div class="w-full border-t border-slate-50 border-dashed"></div>
                                                                                                    <div class="w-full"></div> <!-- 底部基准线 -->
                                                                                                </div>

                                                                                            <!-- 数据列：[柱体 + 标签] 强绑定 -->

                                                                                            <!-- 8月：历史 -->
                                                                                            <div class="flex flex-col items-center flex-1 h-full justify-end z-10">
                                                                                                <div class="bar-item-slim bg-slate-100 h-[40%] hover:bg-slate-200 transition-colors"></div>
                                                                                                <span class="axis-text mt-3">08月</span>
                                                                                            </div>

                                                                                            <!-- 9月：历史 -->
                                                                                            <div class="flex flex-col items-center flex-1 h-full justify-end z-10">
                                                                                                <div class="bar-item-slim bg-slate-100 h-[52%] hover:bg-slate-200 transition-colors"></div>
                                                                                                <span class="axis-text mt-3">09月</span>
                                                                                            </div>

                                                                                            <!-- 10月：历史 -->
                                                                                            <div class="flex flex-col items-center flex-1 h-full justify-end z-10">
                                                                                                <div class="bar-item-slim bg-slate-100 h-[45%] hover:bg-slate-200 transition-colors"></div>
                                                                                                <span class="axis-text mt-3">10月</span>
                                                                                            </div>

                                                                                            <!-- 11月：实绩上涨 -->
                                                                                            <div class="flex flex-col items-center flex-1 h-full justify-end z-10">
                                                                                                <div class="bar-item-slim bg-brand-100 h-[68%] border-t-2 border-brand-500"></div>
                                                                                                <span class="axis-text mt-3">11月</span>
                                                                                            </div>

                                                                                            <!-- 12月：实绩高峰 -->
                                                                                            <div class="flex flex-col items-center flex-1 h-full justify-end z-10">
                                                                                                <div class="bar-item-slim h-[82%] shadow-lg shadow-brand-500/10"></div>
                                                                                                <span class="axis-text mt-3">12月</span>
                                                                                            </div>

                                                                                            <!-- 1月：当前/预测 -->
                                                                                            <div class="flex flex-col items-center flex-1 h-full justify-end z-10">
                                                                                                <div class="bar-item-slim h-[92%] bg-brand-50 border-2 border-dashed border-brand-400 opacity-80"></div>
                                                                                                <span class="axis-text mt-3 text-brand-600 font-bold">预测01</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    `;
            // 隐藏旧的外部 Label 容器，防止布局位移
            if (labelContainer) {
                labelContainer.innerHTML = '';
                labelContainer.className = "hidden";
            }
        }
        else if (type === 'stock') {
            title.innerText = '实时库存健康状况分布';
            if (legend) legend.style.display = 'none';
            container.className = 'flex-1 flex flex-col items-center justify-center';

            /**
             * 精确数学计算 (半径 r=70, 周长 C ≈ 439.82)
             * 1. 正常 (绿色): 82%  => 长度 360.65
             * 2. 积压 (黄色): 10%  => 长度 43.98
             * 3. 缺货 (红色): 8%   => 长度 35.19
             *
             * 移除 stroke-linecap，使用默认的 butt (平头)，确保衔接严丝合缝
             */
            container.innerHTML = `
                                                                                            <div class="chart-container-svg fade-in">
                                                                                            <svg width="180" height="180" viewBox="0 0 160 160">
                                                                                                <!-- 底部背景圆环 -->
                                                                                                <circle cx="80" cy="80" r="70" stroke="#F1F5F9" stroke-width="15" fill="none" />

                                                                                                <!-- 正常 (82%) - 起点: 12点钟 -->
                                                                                                <circle cx="80" cy="80" r="70" stroke="#14B8A6" stroke-width="15" fill="none"
                                                                                                    stroke-dasharray="360.65 439.82"
                                                                                                    stroke-dashoffset="0"
                                                                                                    transform="rotate(-90 80 80)" />

                                                                                                <!-- 积压 (10%) - 起点: 紧随绿色终点 -->
                                                                                                <circle cx="80" cy="80" r="70" stroke="#F59E0B" stroke-width="15" fill="none"
                                                                                                    stroke-dasharray="43.98 439.82"
                                                                                                    stroke-dashoffset="-360.65"
                                                                                                    transform="rotate(-90 80 80)" />

                                                                                                <!-- 缺货 (8%) - 起点: 紧随黄色终点 -->
                                                                                                <circle cx="80" cy="80" r="70" stroke="#F43F5E" stroke-width="15" fill="none"
                                                                                                    stroke-dasharray="35.19 439.82"
                                                                                                    stroke-dashoffset="-404.63"
                                                                                                    transform="rotate(-90 80 80)" />
                                                                                            </svg>
                                                                                            <div class="donut-text-box">
                                                                                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">健康度</p>
                                                                                                <p class="text-3xl font-mono font-bold text-brand-600">82%</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <!-- 图例展示 -->
                                                                                        <div class="flex gap-6 mt-8 text-[11px] font-bold">
                                                                                            <span class="flex items-center gap-1.5"><span class="w-3 h-3 bg-brand-500 rounded-sm"></span> 正常 82%</span>
                                                                                            <span class="flex items-center gap-1.5"><span class="w-3 h-3 bg-yellow-500 rounded-sm"></span> 积压 10%</span>
                                                                                            <span class="flex items-center gap-1.5"><span class="w-3 h-3 bg-red-500 rounded-sm"></span> 缺货 8%</span>
                                                                                        </div>`;
            labelContainer.innerHTML = '';
        }
        else if (type === 'profit') {
            title.innerText = '销售盈利报表 (Top 3 利润贡献)';
            if (legend) {
                legend.style.display = 'flex';
                legend.innerHTML = `
                                                                                            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background: linear-gradient(to bottom, #FBBF24, #D97706);"></span> 第一名</span>
                                                                                            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background: linear-gradient(to bottom, #34D399, #059669);"></span> 第二名</span>
                                                                                            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background: linear-gradient(to bottom, #22D3EE, #0891B2);"></span> 第三名</span>
                                                                                        `;
            }

            container.className = 'flex-1 flex flex-col w-full px-4 md:px-10 justify-center gap-8';

            container.innerHTML = `
                                                                                                <!-- Top 1 -->
                                                                                                <div class="w-full fade-in group">
                                                                                                    <div class="flex justify-between items-end mb-2.5">
                                                                                                        <div class="flex items-center gap-3">
                                                                                                            <span class="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-yellow-300 to-yellow-600 text-white text-xs font-black rounded-lg shadow-md ring-2 ring-yellow-100">1</span>
                                                                                                            <div>
                                                                                                                <p class="text-sm font-bold text-slate-900 tracking-tight">金色镂空户外灯具 (V3)</p>
                                                                                                                <p class="text-[10px] text-slate-400 font-medium">中东/欧美市场畅销款</p>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div class="text-right">
                                                                                                            <p class="text-[10px] text-yellow-600 font-bold uppercase tracking-widest">Gross Profit</p>
                                                                                                            <p class="text-lg font-mono font-black text-slate-900">$42,000</p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-[1px]">
                                                                                                        <div class="h-full rounded-full transition-all duration-1000 shadow-sm group-hover:brightness-110"
                                                                                                            style="width: 92%; background: linear-gradient(90deg, #FDE68A 0%, #F59E0B 100%); box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);"></div>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <!-- Top 2 -->
                                                                                                <div class="w-full fade-in group" style="animation-delay: 0.1s">
                                                                                                    <div class="flex justify-between items-end mb-2.5">
                                                                                                        <div class="flex items-center gap-3">
                                                                                                            <span class="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-emerald-300 to-emerald-600 text-white text-xs font-black rounded-lg shadow-md ring-2 ring-emerald-100">2</span>
                                                                                                            <div>
                                                                                                                <p class="text-sm font-bold text-slate-800 tracking-tight">智能感应极简香薰机</p>
                                                                                                                <p class="text-[10px] text-slate-400 font-medium">东南亚区域利润之星</p>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div class="text-right">
                                                                                                            <p class="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Gross Profit</p>
                                                                                                            <p class="text-lg font-mono font-black text-slate-800">$28,500</p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-[1px]">
                                                                                                        <div class="h-full rounded-full transition-all duration-1000 group-hover:brightness-110"
                                                                                                            style="width: 65%; background: linear-gradient(90deg, #6EE7B7 0%, #059669 100%); box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);"></div>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <!-- Top 3 -->
                                                                                                <div class="w-full fade-in group" style="animation-delay: 0.2s">
                                                                                                    <div class="flex justify-between items-end mb-2.5">
                                                                                                        <div class="flex items-center gap-3">
                                                                                                            <span class="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-cyan-300 to-cyan-600 text-white text-xs font-black rounded-lg shadow-md ring-2 ring-cyan-100">3</span>
                                                                                                            <div>
                                                                                                                <p class="text-sm font-bold text-slate-800 tracking-tight">多功能户外折叠桌板</p>
                                                                                                                <p class="text-[10px] text-slate-400 font-medium">高频爆款薄利多销</p>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div class="text-right">
                                                                                                            <p class="text-[10px] text-cyan-600 font-bold uppercase tracking-widest">Gross Profit</p>
                                                                                                            <p class="text-lg font-mono font-black text-slate-800">$14,200</p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-[1px]">
                                                                                                        <div class="h-full rounded-full transition-all duration-1000 group-hover:brightness-110"
                                                                                                            style="width: 35%; background: linear-gradient(90deg, #67E8F9 0%, #0891B2 100%); box-shadow: 0 2px 8px rgba(8, 145, 178, 0.2);"></div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            `;

            // 同步隐藏底部 Label
            if (labelContainer) {
                labelContainer.innerHTML = '';
                labelContainer.style.display = "none";
            }
        }
        else if (type === 'finance') {
            title.innerText = '往来账务分析 (应收账款账龄)';
            if (legend) {
                legend.style.display = 'flex';
                legend.innerHTML = `
                                                                                        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background: #10B981;"></span> 健康</span>
                                                                                        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background: #F59E0B;"></span> 关注</span>
                                                                                        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background: #EA580C;"></span> 风险</span>
                                                                                        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background: #F43F5E;"></span> 高危</span>
                                                                                    `;
            }

            // 容器布局：[Y轴区域] + [绘图主区]
            container.className = 'flex-1 flex flex-row items-stretch overflow-hidden pt-6';

            container.innerHTML = `
                                                                                        <!-- 1. Y轴刻度区域 -->
                                                                                        <div class="flex flex-col justify-between mb-9 pb-1 axis-text shrink-0 text-right w-12 pr-3 border-r border-slate-100">
                                                                                            <span>$40k</span>
                                                                                            <span>$30k</span>
                                                                                            <span>$20k</span>
                                                                                            <span>$10k</span>
                                                                                            <span class="text-slate-300">0</span>
                                                                                        </div>

                                                                                        <!-- 2. 绘图主区 -->
                                                                                        <div class="relative flex-1 flex items-end justify-around px-2 md:px-12">
                                                                                            <!-- 背景辅助水平网格线 -->
                                                                                            <div class="absolute inset-0 flex flex-col justify-between mb-9 pb-1 pointer-events-none">
                                                                                                <div class="w-full border-t border-slate-50 border-dashed"></div>
                                                                                                <div class="w-full border-t border-slate-50 border-dashed"></div>
                                                                                                <div class="w-full border-t border-slate-50 border-dashed"></div>
                                                                                                <div class="w-full border-t border-slate-50 border-dashed"></div>
                                                                                            </div>

                                                                                            <!-- 账龄柱状列 -->

                                                                                            <!-- 0-30D：健康绿 -->
                                                                                            <div class="flex flex-col items-center flex-1 h-full justify-end z-10 group">
                                                                                                <div class="bar-item-slim transition-all group-hover:scale-x-110"
                                                                                                    style="background: linear-gradient(180deg, #34D399 0%, #10B981 100%); height: 85%; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);"></div>
                                                                                                <span class="axis-text mt-3 tracking-tighter">0-30D</span>
                                                                                            </div>

                                                                                            <!-- 31-60D：关注黄 -->
                                                                                            <div class="flex flex-col items-center flex-1 h-full justify-end z-10 group">
                                                                                                <div class="bar-item-slim transition-all group-hover:scale-x-110"
                                                                                                    style="background: linear-gradient(180deg, #FBBF24 0%, #F59E0B 100%); height: 48%; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);"></div>
                                                                                                <span class="axis-text mt-3 tracking-tighter">31-60D</span>
                                                                                            </div>

                                                                                            <!-- 61-90D：风险橙 -->
                                                                                            <div class="flex flex-col items-center flex-1 h-full justify-end z-10 group">
                                                                                                <div class="bar-item-slim transition-all group-hover:scale-x-110"
                                                                                                    style="background: linear-gradient(180deg, #FB923C 0%, #EA580C 100%); height: 28%; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);"></div>
                                                                                                <span class="axis-text mt-3 tracking-tighter">61-90D</span>
                                                                                            </div>

                                                                                            <!-- >90D：高危红 -->
                                                                                            <div class="flex flex-col items-center flex-1 h-full justify-end z-10 group">
                                                                                                <div class="bar-item-slim animate-pulse transition-all group-hover:scale-x-110"
                                                                                                    style="background: linear-gradient(180deg, #FB7185 0%, #F43F5E 100%); height: 15%; box-shadow: 0 4px 15px rgba(244, 63, 94, 0.3);"></div>
                                                                                                <span class="axis-text mt-3 text-pink-600 font-bold tracking-tighter">>90D</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    `;

            // 彻底清空并隐藏旧的外部容器
            if (labelContainer) {
                labelContainer.innerHTML = '';
                labelContainer.style.display = "none";
            }
        }
    }, 300);
}

// --- 客户CRM交互逻辑 ---
const CRM_ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function initCrmAlphabetIndex() {
    const indexContainer = document.getElementById('crm-letter-index');
    const listContainer = document.getElementById('customer-list-container');
    if (!indexContainer || !listContainer) return;

    indexContainer.innerHTML = CRM_ALPHABETS.map(letter =>
        `<button type="button" class="crm-letter-btn block w-5 h-4 text-[9px] font-black text-slate-400 rounded-md transition-colors" data-letter="${letter}" onclick="scrollCrmToLetter('${letter}')">${letter}</button>`
    ).join('');

    const cards = listContainer.querySelectorAll('.customer-card');
    cards.forEach(card => {
        if (card.dataset.initial) return;
        const nameEl = card.querySelector('.card-name');
        const nameText = nameEl ? nameEl.textContent.trim() : '';
        const initial = nameText ? nameText.charAt(0).toUpperCase() : '';
        if (initial && /^[A-Z]$/.test(initial)) {
            card.dataset.initial = initial;
        }
    });

    setActiveCrmLetter('A');
}

function setActiveCrmLetter(letter) {
    const buttons = document.querySelectorAll('#crm-letter-index .crm-letter-btn');
    buttons.forEach(btn => {
        const isActive = btn.dataset.letter === letter;
        btn.classList.toggle('bg-brand-500', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('shadow-sm', isActive);
        btn.classList.toggle('text-slate-400', !isActive);
    });
}

function scrollCrmToLetter(letter) {
    const listContainer = document.getElementById('customer-list-container');
    if (!listContainer) return;
    setActiveCrmLetter(letter);

    const target = listContainer.querySelector(`.customer-card[data-initial="${letter}"]`);
    if (!target) return;

    const top = target.offsetTop - listContainer.offsetTop - 8;
    listContainer.scrollTo({
        top: Math.max(top, 0),
        behavior: 'smooth'
    });
}

/**
* CRM 手机端详情显示逻辑
*/
function showCrmDetail(customerName) {
    // 1. 更新详情页数据 (此处仅演示名称)
    document.getElementById('crm-detail-name').innerText = customerName;

    // 2. 针对手机端的显示切换
    if (window.innerWidth < 768) {
        document.getElementById('crm-list-pane').classList.add('hidden');
        document.getElementById('crm-detail-pane').classList.remove('hidden');
        // 自动回到顶部
        document.getElementById('crm-detail-pane').scrollTop = 0;
    }
}

/**
 * CRM 手机端返回列表逻辑
 */
function hideCrmDetail() {
    if (window.innerWidth < 768) {
        const listPane = document.getElementById('crm-list-pane');
        const detailPane = document.getElementById('crm-detail-pane');
        if (listPane) listPane.classList.remove('hidden');
        if (detailPane) detailPane.classList.add('hidden');
    }
}

/**
 * 优化原有的 Tab 切换逻辑
 * 确保每次切换回 CRM 标签时，在手机端默认显示列表
 */
const originalSwitchTab = window.switchTab;
window.switchTab = function(tabId) {
    if (tabId === 'crm') {
        hideCrmDetail(); // 重置视图
    }
    if (typeof originalSwitchTab === 'function') {
        originalSwitchTab(tabId);
    }
};

function switchCustomerDetail(name, info, phone) {
    const detailName = document.getElementById('crm-detail-name');
    if (detailName) {
        detailName.innerText = name;
    }
    updateCrmPhoneCard(name, phone);
    hideCrmPhoneCard();
    showCrmDetail(name);
}

function updateCrmPhoneCard(name, phone) {
    const safeName = name || 'Ahmed Al-Fayed';
    const safePhone = phone || '+971 50 123 4567';
    const customerName = document.getElementById('crm-phone-customer-name');
    const phoneText = document.getElementById('crm-phone-number');
    if (customerName) customerName.innerText = safeName;
    if (phoneText) phoneText.innerText = safePhone;
}

function toggleCrmPhoneCard(event) {
    if (event) event.stopPropagation();
    const card = document.getElementById('crm-phone-card');
    if (!card) return;
    card.classList.toggle('hidden');
}

function hideCrmPhoneCard() {
    const card = document.getElementById('crm-phone-card');
    if (!card) return;
    card.classList.add('hidden');
}

function copyCrmPhone(event) {
    if (event) event.stopPropagation();
    const phoneText = document.getElementById('crm-phone-number');
    if (!phoneText) return;
    const phone = phoneText.innerText || '';
    navigator.clipboard.writeText(phone).then(() => {
        if (typeof showToast === 'function') showToast('电话号码已复制');
    }).catch(() => {
        if (typeof showToast === 'function') showToast('复制失败，请手动复制');
    });
}

document.addEventListener('click', function(event) {
    const card = document.getElementById('crm-phone-card');
    if (!card || card.classList.contains('hidden')) return;
    if (!card.contains(event.target)) {
        hideCrmPhoneCard();
    }
});

// CRM AI 建议弹窗
function openCrmAiModal() {
    const modal = document.getElementById('crm-ai-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeCrmAiModal() {
    const modal = document.getElementById('crm-ai-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function generateCrmMarketingSuggestion() {
    const suggestionText = document.getElementById('crm-ai-suggestion-text');
    const suggestionBtn = document.getElementById('crm-ai-suggestion-btn');
    if (!suggestionText || !suggestionBtn) return;

    suggestionBtn.disabled = true;
    suggestionBtn.innerText = '生成中...';
    suggestionBtn.classList.add('opacity-70');

    setTimeout(() => {
        suggestionText.innerText = '建议优先触达“斋月备货”主题：围绕金色复古款进行组合推荐，附加 5% 早鸟优惠，并在 48 小时内二次跟进促单。';
        suggestionBtn.disabled = false;
        suggestionBtn.innerText = '重新生成营销建议';
        suggestionBtn.classList.remove('opacity-70');
    }, 650);
}

function generateCrmMarketingScript() {
    const loading = document.getElementById('crm-ai-script-loading');
    const result = document.getElementById('crm-ai-script-result');
    const text = document.getElementById('crm-ai-script-text');
    const button = document.getElementById('crm-ai-script-btn');
    if (!loading || !result || !text || !button) return;

    loading.classList.remove('hidden');
    result.classList.add('hidden');
    button.disabled = true;
    button.classList.add('opacity-70');
    button.innerText = '生成中...';

    setTimeout(() => {
        text.innerText = 'Hi Ahmed，考虑到您去年斋月档期的采购节奏，我们为您准备了 2026 金色复古灯饰新款目录。本周确认可享 5% 专属早鸟优惠，是否方便我现在发您完整款式与报价？';
        loading.classList.add('hidden');
        result.classList.remove('hidden');
        button.disabled = false;
        button.classList.remove('opacity-70');
        button.innerText = '重新生成话术';
    }, 1200);
}

// 3. 客户列表实时过滤
function filterCrmList() {
    const input = document.getElementById('crmSearchInput').value.toUpperCase();
    const cards = document.querySelectorAll('.customer-card');
    cards.forEach(card => {
        const text = card.innerText.toUpperCase();
        card.style.display = text.includes(input) ? "" : "none";
    });
}

// 产品中心相关函数
function filterInventoryTable() {
    const input = document.getElementById('inventorySearch').value.toUpperCase();
    const rows = document.querySelectorAll('#existingProdTable tbody tr');
    rows.forEach(row => {
        const name = row.querySelector('.product-name-cell').innerText.toUpperCase();
        const sku = row.querySelector('.product-sku-cell').innerText.toUpperCase();
        row.style.display = (name.includes(input) || sku.includes(input)) ? "" : "none";
    });
}

function openPurchaseSuggestionModal() {
    const modal = document.getElementById('purchase-suggestion-modal');
    const content = document.getElementById('purchase-suggestion-content');
    
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    // 模拟API调用获取产品数据
    setTimeout(() => {
        // 模拟产品数据
        const products = [
            {
                id: 1,
                name: "金色镂空户外灯具 (V3)",
                sku: "G-882101",
                stock: 1240,
                warning_stock: 100,
                supplier_id: 1,
                supplierName: "深圳照明科技",
                price: 10.20
            },
            {
                id: 2,
                name: "多功能露营折叠桌",
                sku: "CP-T2-04",
                stock: 42,
                warning_stock: 100,
                supplier_id: 2,
                supplierName: "广州户外用品有限公司",
                price: 48.00
            },
            {
                id: 3,
                name: "智能感应香薰机",
                sku: "AI-Aroma-01",
                stock: 85,
                warning_stock: 100,
                supplier_id: 1,
                supplierName: "深圳照明科技",
                price: 25.50
            }
        ];
        
        // 筛选出库存低于预警值的产品
        const suggestions = products.filter(p => p.stock <= p.warning_stock);
        
        // 按供应商分组
        const groupedBySupplier = suggestions.reduce((acc, p) => {
            const key = p.supplierName || '未知供应商';
            if (!acc[key]) acc[key] = [];
            acc[key].push({
                id: p.id,
                name: p.name,
                sku: p.sku,
                current: p.stock,
                warning: p.warning_stock,
                suggest: Math.max(0, p.warning_stock * 2 - p.stock),
                price: p.price
            });
            return acc;
        }, {});
        
        // 渲染进货建议
        renderPurchaseSuggestion(groupedBySupplier);
    }, 1000);
}

function renderPurchaseSuggestion(groupedBySupplier) {
    const content = document.getElementById('purchase-suggestion-content');
    if (!content) return;
    
    let html = '';
    
    Object.entries(groupedBySupplier).forEach(([supplier, products]) => {
        let supplierTotal = 0;
        
        html += `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                <h3 class="text-sm font-bold text-slate-800">${supplier}</h3>
            </div>
            
            <!-- 桌面端表格 -->
            <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-50/50 text-[10px] text-slate-400 font-black uppercase tracking-tighter border-b border-slate-100">
                        <tr>
                            <th class="px-6 py-4">产品名 (SKU)</th>
                            <th class="px-6 py-4 text-right">缺货状态</th>
                            <th class="px-6 py-4 text-right">建议采购</th>
                            <th class="px-6 py-4 text-right">预估小计</th>
                        </tr>
                    </thead>
                    <tbody class="text-xs divide-y divide-slate-50">
        `;
        
        products.forEach(product => {
            const subtotal = product.suggest * product.price;
            supplierTotal += subtotal;
            
            html += `
                        <tr>
                            <td class="px-6 py-4">
                                <div>
                                    <p class="font-bold text-slate-800">${product.name}</p>
                                    <p class="text-[10px] text-slate-400 font-mono">SKU: ${product.sku}</p>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-right font-mono font-bold ${product.current <= product.warning ? 'text-risk-high' : 'text-slate-900'}">
                                ${product.current} / ${product.warning}
                            </td>
                            <td class="px-6 py-4 text-right">
                                <input type="number" value="${product.suggest}" min="0" class="w-20 px-2 py-1 border border-slate-200 rounded text-xs text-right">
                            </td>
                            <td class="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                $${subtotal.toFixed(2)}
                            </td>
                        </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            
            <!-- 手机端卡片 -->
            <div class="md:hidden space-y-4 p-4">
        `;
        
        products.forEach(product => {
            const subtotal = product.suggest * product.price;
            
            html += `
                <div class="border border-slate-100 rounded-xl p-4">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <i class="ph ph-package text-xl"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-bold text-slate-800">${product.name}</p>
                            <p class="text-[10px] text-slate-400 font-mono">SKU: ${product.sku}</p>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-slate-500">缺货状态</span>
                            <span class="font-mono font-bold ${product.current <= product.warning ? 'text-risk-high' : 'text-slate-900'}">
                                ${product.current} / ${product.warning}
                            </span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-slate-500">建议采购</span>
                            <input type="number" value="${product.suggest}" min="0" class="w-20 px-2 py-1 border border-slate-200 rounded text-xs text-right">
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-slate-500">预估小计</span>
                            <span class="font-mono font-bold text-slate-900">$${subtotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
            
            <div class="px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
                <span class="text-sm font-bold text-slate-800">供应商总计</span>
                <span class="font-mono font-bold text-slate-900">$${supplierTotal.toFixed(2)}</span>
            </div>
        </div>
        `;
    });
    
    content.innerHTML = html;
}

function closePurchaseSuggestionModal() {
    const modal = document.getElementById('purchase-suggestion-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function savePurchaseOrder() {
    // 模拟保存进货单
    closePurchaseSuggestionModal();
    showToast('进货单已保存');
}

function showToast(message) {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.innerText = message;
    
    // 添加到页面
    document.body.appendChild(toast);
    
    // 2秒后移除
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 500);
    }, 2000);
}

// 供应商编辑相关函数
function openSupplierEditModal(supplierName, contact, phone, rating) {
    const modal = document.getElementById('supplier-edit-modal');
    if (modal) {
        // 填充表单数据
        if (supplierName) {
            document.getElementById('supplier-name').value = supplierName;
        }
        if (contact) {
            document.getElementById('supplier-contact').value = contact;
        }
        if (phone) {
            document.getElementById('supplier-phone').value = phone;
        }
        if (rating) {
            document.getElementById('supplier-rating').value = rating;
        }
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeSupplierEditModal() {
    const modal = document.getElementById('supplier-edit-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function saveSupplierEdit() {
    // 获取表单数据
    const name = document.getElementById('supplier-name').value;
    const contact = document.getElementById('supplier-contact').value;
    const phone = document.getElementById('supplier-phone').value;
    const rating = document.getElementById('supplier-rating').value;
    
    // 模拟保存操作
    console.log('保存供应商信息:', { name, contact, phone, rating });
    
    // 关闭弹窗并显示提示
    closeSupplierEditModal();
    showToast('供应商信息已保存');
}

// 仓库管理相关函数
function openWarehouseDrawer() {
    const drawer = document.getElementById('warehouse-drawer');
    if (drawer) {
        drawer.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeWarehouseDrawer() {
    const drawer = document.getElementById('warehouse-drawer');
    if (drawer) {
        drawer.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function saveWarehouse() {
    // 模拟保存操作
    closeWarehouseDrawer();
    showToast('仓库信息已保存');
}

// 客户编辑弹窗逻辑
function openClientEditModal(mode, name) {
    const modal = document.getElementById('client-edit-modal');
    const title = document.getElementById('client-modal-title');
    if (mode === 'new') {
        title.innerText = "新增客户资料";
        document.getElementById('cust-name').value = "";
        document.getElementById('cust-phone').value = "";
    } else {
        title.innerText = "编辑客户详情";
        document.getElementById('cust-name').value = name === 'Ahmed' ? "Ahmed Al-Fayed" : "John Smith";
    }
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeClientEditModal() { document.getElementById('client-edit-modal').classList.add('hidden'); document.body.style.overflow = ''; }

function toggleAdvanced() {
    const drawer = document.getElementById('advanced-drawer');
    const icon = document.getElementById('advanced-icon');
    drawer.classList.toggle('open');
    icon.classList.toggle('ph-caret-up');
    icon.classList.toggle('ph-caret-down');
}

function confirmDeleteClient(name) { if (confirm(`确定删除客户 [${name}] 吗？`)) alert('删除成功'); }
function saveClient() { alert('客户资料已更新。'); closeClientEditModal(); }

// --- 产品中心交互逻辑 ---
function openWorkshopModal() {
    const modal = document.getElementById('workshop-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
function closeWorkshopModal() {
    document.getElementById('workshop-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

function openClearanceModal() {
    const modal = document.getElementById('clearance-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
function closeClearanceModal() {
    document.getElementById('clearance-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

function openCostAnalysis(sku) {
    const modal = document.getElementById('cost-analysis-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
function closeCostAnalysis() {
    document.getElementById('cost-analysis-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

// 模拟请求新品分析报告
function requestNewProductAnalysis(pName) {
    // 1. 关闭选择弹窗
    closeProductSelectModal();
    // 2. 更新报告内的标题名称
    document.getElementById('analysisTargetName').innerText = "研讨目标：" + pName;
    // 3. 打开分析报告大弹窗
    const reportModal = document.getElementById('new-product-report-modal');
    reportModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // 防止背景滚动
}

// 关闭分析报告
function closeNewProductReport() {
    const reportModal = document.getElementById('new-product-report-modal');
    reportModal.classList.add('hidden');
    document.body.style.overflow = '';
}

// 产品中心产品库过滤逻辑
function filterProducts() {
    let input = document.getElementById('prodSearchInput').value.toUpperCase();
    let rows = document.querySelectorAll('.product-row');

    rows.forEach(row => {
        let text = row.innerText.toUpperCase();
        // 实时匹配名称或 SKU
        if (text.includes(input)) {
            row.style.display = ""; // 显示
        } else {
            row.style.display = "none"; // 隐藏
        }
    });
}

// 现有产品库实时搜索 (按名称或 SKU)
function filterInventoryTable() {
    const filter = document.getElementById('inventorySearch').value.toUpperCase();
    const rows = document.querySelectorAll('#existingProdTable .product-row');
    rows.forEach(row => {
        const name = row.querySelector('.product-name-cell').innerText.toUpperCase();
        const sku = row.querySelector('.product-sku-cell').innerText.toUpperCase();
        row.style.display = (name.includes(filter) || sku.includes(filter)) ? "" : "none";
    });
}

// ============== 产品中心完整代码 ==============

// ============== 产品数据模型 ==============
window.products = [
    {
        id: 1,
        name: '金色镂空户外灯具 (V3)',
        sku: 'G-882101',
        category1: '户外照明',
        category2: '装饰灯具',
        supplier: '深圳照明科技',
        region: '中东市场',
        price: 12.50,
        purchasePrice: 8.50,
        stock: 1240,
        salesVolume: 5820,
        icon: 'lightbulb',
        stockStatus: '充足'
    },
    {
        id: 2,
        name: '多功能露营折叠桌',
        sku: 'CP-T2-04',
        category1: '户外装备',
        category2: '露营用品',
        supplier: '广州户外用品厂',
        region: '欧美市场',
        price: 48.00,
        purchasePrice: 32.00,
        stock: 42,
        salesVolume: 3250,
        icon: 'layout',
        stockStatus: '缺货'
    },
    {
        id: 3,
        name: '便携无叶挂脖扇 (V2)',
        sku: 'FAN-002',
        category1: '户外照明',
        category2: '实用灯具',
        supplier: '深圳照明科技',
        region: '东南亚市场',
        price: 18.90,
        purchasePrice: 12.50,
        stock: 380,
        salesVolume: 8450,
        icon: 'fan',
        stockStatus: '预警'
    },
    {
        id: 4,
        name: '太阳能庭院灯',
        sku: 'SOLAR-001',
        category1: '户外照明',
        category2: '实用灯具',
        supplier: '深圳照明科技',
        region: '全球市场',
        price: 35.00,
        purchasePrice: 24.00,
        stock: 1680,
        salesVolume: 4580,
        icon: 'sun',
        stockStatus: '充足'
    },
    {
        id: 5,
        name: '野营帐篷4人款',
        sku: 'TENT-4',
        category1: '户外装备',
        category2: '露营用品',
        supplier: '广州户外用品厂',
        region: '欧美市场',
        price: 89.00,
        purchasePrice: 58.00,
        stock: 210,
        salesVolume: 2150,
        icon: 'tent',
        stockStatus: '充足'
    }
];

window.filterState = {
    category1: null,
    category2: null,
    supplier: null,
    stockStatus: null,
    searchText: ''
};

window.suppliers = ['全部', '深圳照明科技', '广州户外用品厂', '大连大发制冷厂'];
window.stockStatuses = ['全部', '充足', '预警', '缺货'];
window.categories = [
    { name: '户外照明', subcategories: ['装饰灯具', '实用灯具'] },
    { name: '户外装备', subcategories: ['露营用品'] }
];

window.TM_MOCK_WAREHOUSES = [
    { id: 1, name: '主仓库', location: '深圳市宝安区福永街道' },
    { id: 2, name: '备用仓库', location: '深圳市龙岗区平湖街道' }
];

window.TM_MOCK_WAREHOUSE_STOCKS = {
    1: [
        { id: 1, name: '金色镂空户外灯具 (V3)', sku: 'G-882101', price: 12.50, qty: 1240, boxes: 20, packs: 40 },
        { id: 2, name: '多功能露营折叠桌', sku: 'CP-T2-04', price: 48.00, qty: 42, boxes: 1, packs: 2 },
        { id: 3, name: '便携无叶挂脖扇 (V2)', sku: 'FAN-002', price: 18.90, qty: 380, boxes: 6, packs: 20 },
        { id: 4, name: '太阳能庭院灯', sku: 'SOLAR-001', price: 35.00, qty: 1680, boxes: 28, packs: 0 },
        { id: 5, name: '野营帐篷4人款', sku: 'TENT-4', price: 89.00, qty: 210, boxes: 3, packs: 30 }
    ],
    2: [
        { id: 1, name: '金色镂空户外灯具 (V3)', sku: 'G-882101', price: 12.50, qty: 560, boxes: 9, packs: 20 },
        { id: 2, name: '多功能露营折叠桌', sku: 'CP-T2-04', price: 48.00, qty: 180, boxes: 3, packs: 0 },
        { id: 3, name: '便携无叶挂脖扇 (V2)', sku: 'FAN-002', price: 18.90, qty: 950, boxes: 15, packs: 50 }
    ]
};

window.formatStock = function(qty, boxes, packs) {
    if (boxes && packs) {
        return boxes + '箱 ' + packs + '包';
    } else if (boxes) {
        return boxes + '箱';
    } else if (packs) {
        return packs + '包';
    }
    return qty + '件';
};

if (!window.TM_UI) {
    window.TM_UI = {};
}
if (!window.TM_UI.toast) {
    window.TM_UI.toast = function(msg) {
        alert(msg);
    };
}

window.currentProduct = null;

// ============== 全局暴露函数 ==============

window.toggleDropdown = function(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        return;
    }
    
    document.querySelectorAll('[id$="-dropdown"]').forEach(d => {
        if (d.id !== dropdownId) {
            d.classList.add('hidden');
            const filterId = d.id.replace('-dropdown', '-filter');
            const filterEl = document.getElementById(filterId);
            if (filterEl) {
                const caretIcon = filterEl.querySelector('.ph-caret-down, .ph-caret-up');
                if (caretIcon) {
                    caretIcon.classList.remove('ph-caret-up', 'rotate-180', 'text-teal-500');
                    caretIcon.classList.add('ph-caret-down');
                }
            }
        }
    });
    
    const isHidden = dropdown.classList.contains('hidden');
    dropdown.classList.toggle('hidden');
    
    const filterId = dropdownId.replace('-dropdown', '-filter');
    const filterEl = document.getElementById(filterId);
    if (filterEl) {
        const caretIcon = filterEl.querySelector('.ph-caret-down, .ph-caret-up');
        if (caretIcon) {
            if (isHidden) {
                caretIcon.classList.remove('ph-caret-down');
                caretIcon.classList.add('ph-caret-up', 'rotate-180', 'text-teal-500');
            } else {
                caretIcon.classList.remove('ph-caret-up', 'rotate-180', 'text-teal-500');
                caretIcon.classList.add('ph-caret-down');
            }
        }
    }
    
    if (event) event.stopPropagation();
};

window.selectCategory = function(category1, category2) {
    window.filterState.category1 = category1;
    window.filterState.category2 = category2;
    
    const label = document.getElementById('category-label');
    const btn = document.getElementById('category-filter').querySelector('button');
    
    if (category1 && category2) {
        label.textContent = `${category1} > ${category2}`;
        btn.classList.add('bg-white', 'ring-2', 'ring-teal-500/20', 'shadow-md');
    } else if (category1) {
        label.textContent = category1;
        btn.classList.add('bg-white', 'ring-2', 'ring-teal-500/20', 'shadow-md');
    } else {
        label.textContent = '产品类别';
        btn.classList.remove('bg-white', 'ring-2', 'ring-teal-500/20', 'shadow-md');
    }
    
    document.getElementById('category-dropdown').classList.add('hidden');
    const filterEl = document.getElementById('category-filter');
    if (filterEl) {
        const caretIcon = filterEl.querySelector('.ph-caret-down, .ph-caret-up');
        if (caretIcon) {
            caretIcon.classList.remove('ph-caret-up', 'rotate-180', 'text-teal-500');
            caretIcon.classList.add('ph-caret-down');
        }
    }
    window.updateResetButton();
    window.filterProducts();
};

window.selectSupplier = function(supplier) {
    window.filterState.supplier = supplier;
    
    const label = document.getElementById('supplier-label');
    const btn = document.getElementById('supplier-filter').querySelector('button');
    
    if (supplier && supplier !== '全部') {
        label.textContent = supplier;
        btn.classList.add('bg-white', 'ring-2', 'ring-teal-500/20', 'shadow-md');
    } else {
        label.textContent = '供应商';
        btn.classList.remove('bg-white', 'ring-2', 'ring-teal-500/20', 'shadow-md');
    }
    
    document.getElementById('supplier-dropdown').classList.add('hidden');
    const supplierFilterEl = document.getElementById('supplier-filter');
    if (supplierFilterEl) {
        const caretIcon = supplierFilterEl.querySelector('.ph-caret-down, .ph-caret-up');
        if (caretIcon) {
            caretIcon.classList.remove('ph-caret-up', 'rotate-180', 'text-teal-500');
            caretIcon.classList.add('ph-caret-down');
        }
    }
    window.updateResetButton();
    window.filterProducts();
};

window.selectStockStatus = function(status) {
    window.filterState.stockStatus = status;
    
    const label = document.getElementById('stock-label');
    const btn = document.getElementById('stock-filter').querySelector('button');
    
    if (status && status !== '全部') {
        label.textContent = status;
        btn.classList.add('bg-white', 'ring-2', 'ring-teal-500/20', 'shadow-md');
    } else {
        label.textContent = '库存情况';
        btn.classList.remove('bg-white', 'ring-2', 'ring-teal-500/20', 'shadow-md');
    }
    
    document.getElementById('stock-dropdown').classList.add('hidden');
    const stockFilterEl = document.getElementById('stock-filter');
    if (stockFilterEl) {
        const caretIcon = stockFilterEl.querySelector('.ph-caret-down, .ph-caret-up');
        if (caretIcon) {
            caretIcon.classList.remove('ph-caret-up', 'rotate-180', 'text-teal-500');
            caretIcon.classList.add('ph-caret-down');
        }
    }
    window.updateResetButton();
    window.filterProducts();
};

window.updateResetButton = function() {
    const resetBtn = document.getElementById('reset-filter-btn');
    if (!resetBtn) return;
    
    const hasActiveFilter = window.filterState.category1 || window.filterState.supplier || window.filterState.stockStatus || window.filterState.searchText;
    if (hasActiveFilter) {
        resetBtn.classList.remove('hidden');
        resetBtn.classList.add('flex', 'items-center');
    } else {
        resetBtn.classList.add('hidden');
        resetBtn.classList.remove('flex', 'items-center');
    }
};

window.resetFilters = function() {
    window.filterState = { category1: null, category2: null, supplier: null, stockStatus: null, searchText: '' };
    const searchInput = document.getElementById('inventorySearch');
    if (searchInput) searchInput.value = '';
    
    document.getElementById('category-label').textContent = '产品类别';
    document.getElementById('supplier-label').textContent = '供应商';
    document.getElementById('stock-label').textContent = '库存情况';
    
    document.querySelectorAll('#category-filter button, #supplier-filter button, #stock-filter button').forEach(btn => {
        btn.classList.remove('bg-white', 'ring-2', 'ring-teal-500/20', 'shadow-md');
    });
    
    window.updateResetButton();
    window.filterProducts();
};

window.filterInventoryTable = function() {
    const searchInput = document.getElementById('inventorySearch');
    if (searchInput) {
        window.filterState.searchText = searchInput.value;
        window.filterProducts();
    }
};

window.filterProducts = function() {
    let filtered = [...window.products];
    
    if (window.filterState.searchText) {
        const searchLower = window.filterState.searchText.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchLower) || p.sku.toLowerCase().includes(searchLower)
        );
    }
    
    if (window.filterState.category1) {
        filtered = filtered.filter(p => p.category1 === window.filterState.category1);
        if (window.filterState.category2) {
            filtered = filtered.filter(p => p.category2 === window.filterState.category2);
        }
    }
    
    if (window.filterState.supplier && window.filterState.supplier !== '全部') {
        filtered = filtered.filter(p => p.supplier === window.filterState.supplier);
    }
    
    if (window.filterState.stockStatus && window.filterState.stockStatus !== '全部') {
        filtered = filtered.filter(p => p.stockStatus === window.filterState.stockStatus);
    }
    
    window.renderProducts(filtered);
};

window.renderProducts = function(productList) {
    const sortedProducts = [...productList].sort((a, b) => b.salesVolume - a.salesVolume);
    window.renderDesktopTable(sortedProducts);
    window.renderMobileCards(sortedProducts);
};

window.renderDesktopTable = function(productList) {
    const tbody = document.querySelector('#existingProdTable tbody');
    if (!tbody) return;
    
    if (productList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center gap-3">
                        <i class="ph ph-package text-4xl text-slate-300"></i>
                        <p class="text-slate-400 font-bold">暂无产品</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = productList.map(product => `
        <tr onclick="window.openProductDetail(${product.id})" class="product-row hover:bg-slate-50 transition-all cursor-pointer group">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                        <i class="ph ph-${product.icon} text-xl"></i>
                    </div>
                    <div>
                        <p class="font-bold text-slate-800 product-name-cell">${product.name}</p>
                        <p class="text-[10px] text-slate-400 font-mono product-sku-cell uppercase mt-1">SKU: ${product.sku}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 col-hide-mobile">
                <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold">${product.region}</span>
            </td>
            <td class="px-6 py-4 text-right font-mono font-bold text-slate-500 col-hide-mobile">
                $${product.price.toFixed(2)}
            </td>
            <td class="px-6 py-4 text-right font-mono font-bold text-brand-600 col-hide-mobile">
                $${product.purchasePrice.toFixed(2)}
            </td>
            <td class="px-6 py-4 text-right">
                <p class="font-mono font-bold ${window.getStockColor(product.stockStatus)} tracking-tighter">
                    ${product.stock.toLocaleString()} <span class="text-[9px] text-slate-400 uppercase">Pcs</span>
                </p>
                <div class="w-16 h-1 bg-slate-100 rounded-full mt-1.5 ml-auto overflow-hidden md:block hidden">
                    <div class="w-[${window.getStockPercentage(product.stock)}%] ${window.getStockBgColor(product.stockStatus)} h-full ${product.stockStatus === '缺货' ? 'animate-pulse' : ''}"></div>
                </div>
            </td>
            <td class="px-6 py-4 text-right whitespace-nowrap">
                <div class="flex justify-end gap-1">
                    <button onclick="event.stopPropagation(); window.openProductDetail(${product.id})" title="编辑" class="action-icon-btn">
                        <i class="ph ph-pencil-simple-line text-lg"></i>
                    </button>
                    <button onclick="event.stopPropagation(); window.confirmDeleteProduct('${product.name}')" title="删除" class="action-icon-btn delete">
                        <i class="ph ph-trash text-lg"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
};

window.renderMobileCards = function(productList) {
    const container = document.getElementById('mobile-product-cards');
    if (!container) return;
    
    if (productList.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <i class="ph ph-package text-4xl text-slate-300"></i>
                <p class="text-slate-400 font-bold mt-3">暂无产品</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = productList.map(product => `
        <div class="mobile-product-row bg-white border border-slate-200 rounded-xl shadow-sm px-3 py-2.5 cursor-pointer hover:shadow-md transition-shadow" onclick="window.openProductDetail(${product.id})">
            <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <i class="ph ph-${product.icon} text-base"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                        <p class="text-[12px] font-bold text-slate-800 truncate">${product.name}</p>
                        <span class="text-[11px] font-mono font-bold ${window.getStockColor(product.stockStatus)} shrink-0">${product.stock.toLocaleString()}</span>
                    </div>
                    <div class="flex items-center justify-between gap-2 mt-0.5">
                        <p class="text-[10px] text-slate-400 font-mono truncate">SKU: ${product.sku}</p>
                        <p class="text-[10px] text-slate-500 shrink-0">$${product.price.toFixed(2)} / $${product.purchasePrice.toFixed(2)}</p>
                    </div>
                    <div class="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                        <div class="w-[${window.getStockPercentage(product.stock)}%] ${window.getStockBgColor(product.stockStatus)} h-full ${product.stockStatus === '缺货' ? 'animate-pulse' : ''}"></div>
                    </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button onclick="event.stopPropagation(); window.openProductDetail(${product.id})" class="mobile-mini-btn">编</button>
                    <button onclick="event.stopPropagation(); window.confirmDeleteProduct('${product.name}')" class="mobile-mini-btn delete">删</button>
                </div>
            </div>
        </div>
    `).join('');
};

window.getStockColor = function(status) {
    switch(status) {
        case '充足': return 'text-slate-900';
        case '预警': return 'text-orange-500';
        case '缺货': return 'text-risk-high';
        default: return 'text-slate-900';
    }
};

window.getStockBgColor = function(status) {
    switch(status) {
        case '充足': return 'bg-brand-500';
        case '预警': return 'bg-orange-500';
        case '缺货': return 'bg-risk-high';
        default: return 'bg-brand-500';
    }
};

window.getStockPercentage = function(stock) {
    if (stock >= 1000) return 85;
    if (stock >= 500) return 60;
    if (stock >= 100) return 40;
    return 30;
};

window.getStockStatusColor = function(status) {
    switch(status) {
        case '充足': return 'bg-brand-500';
        case '预警': return 'bg-orange-500';
        case '缺货': return 'bg-risk-high';
        default: return '';
    }
};

window.initCategoryOptions = function() {
    const container = document.getElementById('category-options');
    if (!container) return;
    
    container.innerHTML = `
        <button onclick="window.selectCategory(null, null)" class="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-all border-b border-slate-50">
            全部类别
        </button>
    ` + window.categories.map(cat => `
        <div class="border-b border-slate-50">
            <button onclick="window.selectCategory('${cat.name}', null)" class="w-full text-left px-4 py-3 text-sm font-bold text-slate-800 hover:bg-teal-50 hover:text-teal-700 transition-all flex items-center justify-between">
                <span>${cat.name}</span>
                <i class="ph ph-caret-right text-slate-400"></i>
            </button>
            <div class="pl-4 bg-slate-50/30">
                ${cat.subcategories.map(sub => `
                    <button onclick="window.selectCategory('${cat.name}', '${sub}')" class="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-all">
                        <span class="ml-2">${sub}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');
};

window.initSupplierOptions = function() {
    const container = document.getElementById('supplier-options');
    if (!container) return;
    
    container.innerHTML = window.suppliers.map(supplier => `
        <button onclick="window.selectSupplier('${supplier}')" class="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-all border-b border-slate-50 last:border-b-0">
            ${supplier}
        </button>
    `).join('');
};

window.initStockOptions = function() {
    const container = document.getElementById('stock-options');
    if (!container) return;
    
    container.innerHTML = window.stockStatuses.map(status => `
        <button onclick="window.selectStockStatus('${status}')" class="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-all border-b border-slate-50 last:border-b-0 flex items-center gap-3">
            ${status !== '全部' ? `<span class="inline-block w-2.5 h-2.5 ${window.getStockStatusColor(status)} rounded-full"></span>` : ''}
            ${status}
        </button>
    `).join('');
};

window.initFilterOptions = function() {
    window.initCategoryOptions();
    window.initSupplierOptions();
    window.initStockOptions();
};

window.initProductList = function() {
    window.renderProducts(window.products);
};

window.initProductCenter = function() {
    window.initProductList();
    window.initFilterOptions();
};

window.openNewProductModal = function() {
    window.currentProduct = null;
    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;

    const titleEl = document.getElementById('detail-title');
    const skuEl = document.getElementById('detail-sku');
    const nameEl = document.getElementById('detail-product-name');
    const skuInputEl = document.getElementById('detail-product-sku-input');
    const priceEl = document.getElementById('detail-product-price');
    const stockEl = document.getElementById('detail-product-stock');
    const supplierEl = document.getElementById('detail-product-supplier');
    const warningStockEl = document.getElementById('detail-product-warning-stock');

    const newSku = `SKU-${Date.now().toString().slice(-6)}`;
    if (titleEl) titleEl.textContent = '新增产品';
    if (skuEl) skuEl.textContent = 'SKU: ' + newSku;
    if (nameEl) nameEl.value = '';
    if (skuInputEl) skuInputEl.value = newSku;
    if (priceEl) priceEl.value = '0';
    if (stockEl) stockEl.value = '0';
    if (warningStockEl) warningStockEl.value = '100';
    if (supplierEl && supplierEl.options.length > 0) supplierEl.selectedIndex = 0;

    modal.classList.remove('hidden');
};

window.openProductDetail = function(productId) {
    const product = window.products.find(p => p.id === productId || p.name === productId);
    if (product) {
        window.currentProduct = product;
        const modal = document.getElementById('product-detail-modal');
        if (modal) {
            const titleEl = document.getElementById('detail-title');
            const skuEl = document.getElementById('detail-sku');
            const nameEl = document.getElementById('detail-product-name');
            const skuInputEl = document.getElementById('detail-product-sku-input');
            const priceEl = document.getElementById('detail-product-price');
            const stockEl = document.getElementById('detail-product-stock');
            const supplierEl = document.getElementById('detail-product-supplier');
            const warningStockEl = document.getElementById('detail-product-warning-stock');
            if (titleEl) titleEl.textContent = product.name;
            if (skuEl) skuEl.textContent = 'SKU: ' + product.sku;
            if (nameEl) nameEl.value = product.name || '';
            if (skuInputEl) skuInputEl.value = product.sku || '';
            if (priceEl) priceEl.value = product.price || 0;
            if (stockEl) stockEl.value = product.stock || 0;
            if (warningStockEl) warningStockEl.value = 100;
            if (supplierEl && product.supplier) {
                const supplierOption = Array.from(supplierEl.options).find(opt => opt.text.includes(product.supplier));
                if (supplierOption) supplierEl.value = supplierOption.value;
            }
            modal.classList.remove('hidden');
        }
    }
};

window.closeProductDetail = function() {
    const modal = document.getElementById('product-detail-modal');
    if (modal) modal.classList.add('hidden');
    window.currentProduct = null;
};

window.confirmDeleteProduct = function(productName) {
    if (confirm('确定要删除产品 "' + productName + '" 吗？')) {
        window.products = window.products.filter(p => p.name !== productName);
        window.filterProducts();
    }
};

window.saveProduct = function() {
    const nameEl = document.getElementById('detail-product-name');
    const skuInputEl = document.getElementById('detail-product-sku-input');
    const priceEl = document.getElementById('detail-product-price');
    const stockEl = document.getElementById('detail-product-stock');
    const supplierEl = document.getElementById('detail-product-supplier');

    if (!nameEl || !skuInputEl || !priceEl || !stockEl || !supplierEl) {
        alert('产品信息表单未就绪，请重试。');
        return;
    }

    const name = nameEl.value.trim();
    const sku = skuInputEl.value.trim();
    const price = parseFloat(priceEl.value) || 0;
    const stock = parseInt(stockEl.value, 10) || 0;
    const supplier = supplierEl.value.trim();

    if (!name || !sku) {
        alert('请填写产品名称与 SKU 编码。');
        return;
    }

    const stockStatus = stock <= 50 ? '缺货' : stock <= 300 ? '预警' : '充足';

    if (window.currentProduct) {
        window.currentProduct.name = name;
        window.currentProduct.sku = sku;
        window.currentProduct.price = price;
        window.currentProduct.stock = stock;
        window.currentProduct.supplier = supplier;
        window.currentProduct.stockStatus = stockStatus;
        alert('产品信息已更新！');
    } else {
        const maxId = window.products.reduce((max, item) => Math.max(max, item.id || 0), 0);
        window.products.unshift({
            id: maxId + 1,
            name: name,
            sku: sku,
            category1: window.categories?.[0]?.name || '产品分类',
            category2: window.categories?.[0]?.subcategories?.[0] || '默认子类',
            supplier: supplier,
            region: '国内市场',
            price: price,
            purchasePrice: Math.max(0, +(price * 0.7).toFixed(2)),
            stock: stock,
            salesVolume: 0,
            icon: 'package',
            stockStatus: stockStatus
        });
        alert('新产品已新增到产品库！');
    }

    window.filterProducts();
    window.closeProductDetail();
};

window.toggleAdvanced = function() {
    const drawer = document.getElementById('advanced-drawer');
    const icon = document.getElementById('advanced-icon');
    if (drawer && icon) {
        drawer.classList.toggle('open');
        icon.classList.toggle('ph-caret-down');
        icon.classList.toggle('ph-caret-up');
    }
};

window.openUnitModal = function() {
    const modal = document.getElementById('unit-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeUnitModal = function() {
    const modal = document.getElementById('unit-modal');
    if (modal) modal.classList.add('hidden');
};

window.openWarehouseDrawer = function() {
    const drawer = document.getElementById('warehouse-drawer');
    if (drawer) drawer.classList.remove('hidden');
};

window.closeWarehouseDrawer = function() {
    const drawer = document.getElementById('warehouse-drawer');
    if (drawer) drawer.classList.add('hidden');
};

window.saveWarehouse = function() {
    const nameInput = document.getElementById('new-warehouse-name');
    const locationInput = document.getElementById('new-warehouse-location');
    if (nameInput && locationInput) {
        alert('仓库 "' + nameInput.value + '" 已保存！');
        nameInput.value = '';
        locationInput.value = '';
    }
};

window.openPurchaseSuggestionModal = function() {
    const modal = document.getElementById('purchase-suggestion-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closePurchaseSuggestionModal = function() {
    const modal = document.getElementById('purchase-suggestion-modal');
    if (modal) modal.classList.add('hidden');
};

window.savePurchaseOrder = function() {
    alert('进货单已保存！');
    window.closePurchaseSuggestionModal();
};

window.closeCostAnalysis = function() {
    const modal = document.getElementById('cost-analysis-modal');
    if (modal) modal.classList.add('hidden');
};

window.closeWorkshopModal = function() {
    const modal = document.getElementById('workshop-modal');
    if (modal) modal.classList.add('hidden');
};

window.closeClearanceModal = function() {
    const modal = document.getElementById('clearance-modal');
    if (modal) modal.classList.add('hidden');
};

window.openCategoryModal = function() {
    document.getElementById('category-modal').classList.remove('hidden');
};

window.closeCategoryModal = function() {
    document.getElementById('category-modal').classList.add('hidden');
};

// ============== 产品类别管理模块 ==============
let pendingDeleteId = null;

window.ProductModule = {
    currentSourceWarehouseId: null,
    currentTransferType: 'same',
    rowIdCounter: 0,
    
    openCategoryManager: function() {
        const modal = document.getElementById('category-modal-root');
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                const input = document.getElementById('new-category-input');
                if (input) input.focus();
            }, 100);
            window.ProductModule.renderCategoryEditList();
        }
    },

    closeCategoryManager: function() {
        const modal = document.getElementById('category-modal-root');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    renderCategoryEditList: function() {
        const container = document.getElementById('category-edit-list');
        if (!container) return;

        container.innerHTML = window.categories.map((category, index) => `
            <div class="group flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-md rounded-2xl mb-2 transition-all">
                <span class="font-bold text-slate-700">${category.name}</span>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="window.ProductModule.editCategory(${index})" class="p-2 text-teal-600 hover:bg-teal-50 rounded-lg">
                        <i class="ph-bold ph-pencil-simple"></i>
                    </button>
                    <button onclick="window.ProductModule.deleteCategory(${index})" class="p-2 text-rose-400 hover:bg-rose-50 rounded-lg">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        console.log('当前类别数据:', window.categories);
    },

    addCategory: function() {
        const input = document.getElementById('new-category-input');
        if (!input || !input.value.trim()) {
            return;
        }

        const newCategory = {
            name: input.value.trim(),
            subcategories: []
        };

        window.categories.push(newCategory);
        input.value = '';
        window.ProductModule.renderCategoryEditList();
        window.refreshCategoryFilter();
    },

    editCategory: function(index) {
        const category = window.categories[index];
        if (category) {
            const newName = prompt('编辑类别名称:', category.name);
            if (newName && newName.trim()) {
                category.name = newName.trim();
                window.ProductModule.renderCategoryEditList();
                window.refreshCategoryFilter();
            }
        }
    },

    deleteCategory: function(index) {
        pendingDeleteId = index;
        const confirmModal = document.getElementById('category-delete-confirm');
        if (confirmModal) {
            confirmModal.classList.remove('hidden');
        }
    },

    hideDeleteConfirm: function() {
        const confirmModal = document.getElementById('category-delete-confirm');
        if (confirmModal) {
            confirmModal.classList.add('hidden');
        }
        pendingDeleteId = null;
    },

    confirmDelete: function() {
        if (pendingDeleteId !== null) {
            window.categories.splice(pendingDeleteId, 1);
            window.ProductModule.renderCategoryEditList();
            window.refreshCategoryFilter();
            window.ProductModule.hideDeleteConfirm();
        }
    },

    openTransferModal: function(warehouseId) {
        const modal = document.getElementById('warehouse-transfer-modal');
        if (!modal) return;
        
        this.currentSourceWarehouseId = warehouseId;
        this.currentTransferType = 'same';
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        const sourceWarehouse = window.TM_MOCK_WAREHOUSES.find(w => w.id === warehouseId);
        const titleEl = document.getElementById('transfer-modal-title');
        if (titleEl && sourceWarehouse) {
            titleEl.innerText = `从 ${sourceWarehouse.name} 调拨`;
        }
        
        const targetSelect = document.getElementById('target-warehouse-select');
        if (targetSelect) {
            targetSelect.innerHTML = '<option value="">请选择目标仓库</option>' + 
                window.TM_MOCK_WAREHOUSES
                    .filter(w => w.id !== warehouseId)
                    .map(w => `<option value="${w.id}">${w.name}</option>`)
                    .join('');
        }
        
        const diffPriceCheckbox = document.getElementById('diff-price-checkbox');
        if (diffPriceCheckbox) {
            diffPriceCheckbox.checked = false;
        }
        
        this.renderProductList(warehouseId);
        this.switchTransferType(false);
        this.calculateGrandTotal();
    },
    
    closeTransferModal: function() {
        const modal = document.getElementById('warehouse-transfer-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
        this.currentSourceWarehouseId = null;
        this.currentTransferType = 'same';
    },
    
    switchTransferType: function(isDiffPrice) {
        if (isDiffPrice) {
            this.currentTransferType = 'diff';
        } else {
            this.currentTransferType = 'same';
        }
        
        const sameBtn = document.getElementById('same-price-btn');
        const diffBtn = document.getElementById('diff-price-btn');
        
        if (sameBtn) {
            if (!isDiffPrice) {
                sameBtn.classList.add('bg-brand-500', 'text-white');
                sameBtn.classList.remove('bg-slate-100', 'text-slate-700');
            } else {
                sameBtn.classList.remove('bg-brand-500', 'text-white');
                sameBtn.classList.add('bg-slate-100', 'text-slate-700');
            }
        }
        
        if (diffBtn) {
            if (isDiffPrice) {
                diffBtn.classList.add('bg-brand-500', 'text-white');
                diffBtn.classList.remove('bg-slate-100', 'text-slate-700');
            } else {
                diffBtn.classList.remove('bg-brand-500', 'text-white');
                diffBtn.classList.add('bg-slate-100', 'text-slate-700');
            }
        }
        
        const priceInputs = document.querySelectorAll('.price-input');
        priceInputs.forEach(input => {
            input.disabled = !isDiffPrice;
        });
        
        this.calculateGrandTotal();
    },
    
    renderProductList: function(warehouseId) {
        const tbody = document.getElementById('transfer-product-list');
        if (!tbody) return;
        
        this.rowIdCounter = 0;
        tbody.innerHTML = '';
    },
    
    addProductRow: function() {
        this.rowIdCounter++;
        const rowId = 'row-' + this.rowIdCounter;
        
        const products = window.TM_MOCK_WAREHOUSE_STOCKS[this.currentSourceWarehouseId] || [];
        
        const productOptions = products.map(product => 
            `<option value="${product.id}">${product.name}</option>`
        ).join('');
        
        const newRow = document.createElement('tr');
        newRow.id = rowId;
        newRow.className = 'border-b border-slate-100';
        newRow.innerHTML = `
            <td class="px-4 py-3">
                <select onchange="window.ProductModule.handleProductSelect('${rowId}', this.value)" class="w-full px-2 py-1 border border-slate-200 rounded text-sm">
                    <option value="">请选择产品</option>
                    ${productOptions}
                </select>
            </td>
            <td class="px-4 py-3">
                <input type="number" 
                       class="price-input w-24 px-2 py-1 border border-slate-200 rounded text-sm"
                       value="0"
                       disabled
                       oninput="window.ProductModule.calculateRowTotal(this)">
            </td>
            <td class="px-4 py-3">
                <input type="number" 
                       class="qty-input w-24 px-2 py-1 border border-slate-200 rounded text-sm"
                       value="1"
                       oninput="window.ProductModule.calculateRowTotal(this)">
            </td>
            <td class="px-4 py-3 text-right font-mono font-bold text-sm row-total">
                0.00
            </td>
            <td class="px-4 py-3">
                <button onclick="window.ProductModule.removeProductRow('${rowId}')" class="p-2 text-rose-400 hover:bg-rose-50 rounded-lg">
                    <i class="ph-bold ph-trash"></i>
                </button>
            </td>
        `;
        
        document.getElementById('transfer-product-list').appendChild(newRow);
    },
    
    handleProductSelect: function(rowId, productId) {
        const products = window.TM_MOCK_WAREHOUSE_STOCKS[this.currentSourceWarehouseId] || [];
        const product = products.find(p => p.id == productId);
        
        if (!product) return;
        
        const row = document.getElementById(rowId);
        if (!row) return;
        
        const priceInput = row.querySelector('.price-input');
        const qtyInput = row.querySelector('.qty-input');
        const totalEl = row.querySelector('.row-total');
        
        if (priceInput) {
            priceInput.value = product.price.toFixed(2);
        }
        
        if (qtyInput) {
            qtyInput.value = 1;
        }
        
        if (totalEl) {
            totalEl.innerText = (product.price * 1).toFixed(2);
        }
        
        this.calculateGrandTotal();
    },
    
    removeProductRow: function(rowId) {
        const row = document.getElementById(rowId);
        if (row) {
            row.remove();
            this.calculateGrandTotal();
        }
    },
    
    calculateRowTotal: function(inputElement) {
        const row = inputElement.closest('tr');
        if (!row) return;
        
        const priceInput = row.querySelector('.price-input');
        const qtyInput = row.querySelector('.qty-input');
        
        const price = parseFloat(priceInput?.value) || 0;
        const qty = parseFloat(qtyInput?.value) || 0;
        const total = price * qty;
        
        const totalEl = row.querySelector('.row-total');
        if (totalEl) {
            totalEl.innerText = total.toFixed(2);
        }
        
        this.calculateGrandTotal();
    },
    
    calculateGrandTotal: function() {
        const grandTotalEl = document.getElementById('transfer-total-value');
        if (!grandTotalEl) return;
        
        let grandTotal = 0;
        const rowTotals = document.querySelectorAll('.row-total');
        rowTotals.forEach(el => {
            const value = parseFloat(el.innerText.replace('$', '')) || 0;
            grandTotal += value;
        });
        
        grandTotalEl.innerText = grandTotal.toFixed(2);
    },
    
    confirmTransfer: function() {
        const targetSelect = document.getElementById('target-warehouse-select');
        if (!targetSelect || !targetSelect.value) {
            alert('请选择目标仓库');
            return;
        }
        
        const products = [];
        const rows = document.querySelectorAll('#transfer-product-list tr');
        rows.forEach(row => {
            const priceInput = row.querySelector('.price-input');
            if (priceInput) {
                products.push({
                    id: parseInt(priceInput.getAttribute('data-product-id')),
                    price: parseFloat(priceInput.value) || 0,
                    qty: parseInt(priceInput.getAttribute('data-qty')) || 0
                });
            }
        });
        
        const transferData = {
            sourceWarehouseId: this.currentSourceWarehouseId,
            targetWarehouseId: parseInt(targetSelect.value),
            transferType: this.currentTransferType,
            products: products
        };
        
        console.log('调拨数据包:', JSON.stringify(transferData, null, 2));
        
        this.refreshData();
        if (window.TM_UI && window.TM_UI.toast) {
            window.TM_UI.toast('调拨成功！');
        }
        this.closeTransferModal();
    },
    
    refreshData: function() {
        console.log('刷新数据...');
    }
};

window.refreshCategoryFilter = function() {
    if (typeof window.initCategoryOptions === 'function') {
        window.initCategoryOptions();
    }
};

document.addEventListener('click', function(e) {
    if (!e.target.closest('#category-filter') && 
        !e.target.closest('#supplier-filter') && 
        !e.target.closest('#stock-filter')) {
        document.querySelectorAll('[id$="-dropdown"]').forEach(d => {
            d.classList.add('hidden');
            const filterId = d.id.replace('-dropdown', '-filter');
            const filterEl = document.getElementById(filterId);
            if (filterEl) {
                const caretIcon = filterEl.querySelector('.ph-caret-down, .ph-caret-up');
                if (caretIcon) {
                    caretIcon.classList.remove('ph-caret-up', 'rotate-180', 'text-teal-500');
                    caretIcon.classList.add('ph-caret-down');
                }
            }
        });
    }
});
function closeProductDetail() { document.getElementById('product-detail-modal').classList.add('hidden'); document.body.style.overflow = ''; }

// 高级配置折叠切换
function toggleAdvanced() {
    const drawer = document.getElementById('advanced-drawer');
    const icon = document.getElementById('advanced-icon');
    drawer.classList.toggle('open');
    icon.classList.toggle('ph-caret-up');
    icon.classList.toggle('ph-caret-down');
}

// --- 供应商管理交互逻辑 ---


// --- 供应商视图切换 ---
function switchSupplierView(mode) {
    // 尝试获取元素
    const listView = document.getElementById('sup-list-view');
    const supplierView = document.getElementById('sup-supplier-view');
    const btnList = document.getElementById('btn-sup-list');
    const btnSupplier = document.getElementById('btn-sup-supplier');
    const supStatChips = document.getElementById('sup-stat-chips');

    // 检查元素是否存在
    if (!listView || !supplierView || !btnList || !btnSupplier || !supStatChips) {
        // 元素不存在，可能是模块还未加载完成
        // 延迟一段时间后重试
        setTimeout(() => {
            switchSupplierView(mode);
        }, 100);
        return;
    }

    if (mode === 'list') {
        // 显示/隐藏内容
        listView.classList.remove('hidden');
        supplierView.classList.add('hidden');

        // 处理按钮状态
        btnList.classList.add('active');
        btnSupplier.classList.remove('active');

        // 修正颜色类名冲突 (清除 Tailwind 默认的灰色)
        btnList.classList.remove('text-slate-400');
        btnSupplier.classList.add('text-slate-400');
        
        // 显示统计卡
        supStatChips.classList.remove('hidden');
    } else if (mode === 'supplier') {
        listView.classList.add('hidden');
        supplierView.classList.remove('hidden');

        btnSupplier.classList.add('active');
        btnList.classList.remove('active');

        btnSupplier.classList.remove('text-slate-400');
        btnList.classList.add('text-slate-400');
        
        // 隐藏统计卡
        supStatChips.classList.add('hidden');
    }
}

function confirmDeleteSupplier(supplierName) {
    if (confirm(`确定要删除供应商 "${supplierName}" 吗？`)) {
        // 模拟删除操作
        showToast(`供应商 "${supplierName}" 已删除`);
    }
}

// --- 进货单详情弹窗 ---
function openPurchaseDetail(id) {
    const po = (window.purchaseOrdersCatalog || []).find(p => p.id === id);
    if (!po) {
        if (typeof showToast === 'function') showToast('未找到该进货单据');
        return;
    }
    const idEl = document.getElementById('detail-purchase-id');
    if (idEl) idEl.textContent = po.id;
    const srcEl = document.getElementById('detail-purchase-source');
    if (srcEl) srcEl.textContent = '提取源：' + (po.source || '—');
    const tbody = document.getElementById('detail-purchase-lines');
    if (tbody) {
        const rows = (po.lines || []).map(line => {
            const batchOrSku = line.batch
                ? 'BATCH: ' + line.batch
                : (line.sku ? 'SKU: ' + line.sku : '');
            const sub = line.subtotal != null ? line.subtotal : (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
            return `
            <tr>
                <td class="px-6 py-4 font-bold text-slate-800">${line.productName || ''}${batchOrSku ? `<p class="text-[9px] text-slate-400 font-mono tracking-tighter mt-0.5">${batchOrSku}</p>` : ''}</td>
                <td class="px-6 py-4 text-center font-mono">${formatCNYAmount(line.unitPrice)} <span class="text-[9px] text-slate-400 italic">(${line.unit || '件'})</span></td>
                <td class="px-6 py-4 text-center font-mono font-bold text-slate-900">${Number(line.qty).toLocaleString('zh-CN')}</td>
                <td class="px-6 py-4 text-right font-mono font-black text-slate-900">${formatCNYAmount(sub)}</td>
            </tr>`;
        }).join('');
        tbody.innerHTML = rows || '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">暂无明细</td></tr>';
    }
    const tot = document.getElementById('detail-purchase-total');
    if (tot) tot.textContent = formatCNYAmount(po.total);
    document.getElementById('purchase-detail-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closePurchaseDetail() {
    document.getElementById('purchase-detail-modal').classList.add('hidden');
    document.body.style.overflow = '';
}
function saveProduct() { alert('产品数据已更新，单位配置已成功同步。'); closeProductDetail(); }

// 其他辅助函数
function showToast(message) {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-xl z-50';
    toast.innerText = message;
    
    // 添加到body
    document.body.appendChild(toast);
    
    // 3秒后移除
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 500);
    }, 3000);
}

function closeProductSelectModal() {
    const modal = document.getElementById('product-select-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function toggleCustomerDetail(show) {
    const detail = document.getElementById('customer-detail');
    if (detail) {
        if (show) {
            detail.classList.remove('hidden');
        } else {
            detail.classList.add('hidden');
        }
    }
}

// 智能经营 - 首付款账户管理
window.bizPaymentAccounts = window.bizPaymentAccounts || [
    {
        id: 1,
        type: '支付宝账户',
        accountName: 'TradeMind 主收款',
        accountNo: 'pay-trademind-001',
        holder: '杭州巨猿科技有限公司',
        isDefaultReceive: true,
        isDefaultPay: false
    },
    {
        id: 2,
        type: '微信账户',
        accountName: 'TradeMind 采购付款',
        accountNo: 'wxid_tm_pay_002',
        holder: '杭州巨猿科技有限公司',
        isDefaultReceive: false,
        isDefaultPay: true
    },
    {
        id: 3,
        type: '银行卡账户',
        accountName: '招商银行对公户',
        accountNo: '6225 88** **** 2026',
        holder: '杭州巨猿科技有限公司',
        isDefaultReceive: false,
        isDefaultPay: false
    }
];

window.bizAccountEditId = null;
window.bizAccountDeleteId = null;
window.bizAccountDetailId = null;

window.validateBizAccountNo = function(type, accountNo) {
    const raw = accountNo.trim();
    if (!raw) {
        return { valid: false, message: '账户号不能为空。', normalized: raw };
    }

    if (type === '银行卡账户') {
        const compact = raw.replace(/\s+/g, '');
        if (!/^\d+$/.test(compact)) {
            return { valid: false, message: '银行卡账户仅支持数字。', normalized: raw };
        }
        if (compact.length < 12 || compact.length > 24) {
            return { valid: false, message: '银行卡号长度应为 12-24 位。', normalized: raw };
        }
        const grouped = compact.replace(/(\d{4})(?=\d)/g, '$1 ');
        return { valid: true, normalized: grouped };
    }

    if (type === '支付宝账户') {
        const ok = /^([a-zA-Z0-9_.-]{3,64}|1\d{10}|[^@\s]+@[^@\s]+\.[^@\s]+)$/.test(raw);
        if (!ok) {
            return { valid: false, message: '支付宝账户格式不正确，请输入手机号、邮箱或字母数字账号。', normalized: raw };
        }
        return { valid: true, normalized: raw };
    }

    if (type === '微信账户') {
        const ok = /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/.test(raw);
        if (!ok) {
            return { valid: false, message: '微信账户需以字母开头，长度 6-20 位，仅支持字母数字_-.', normalized: raw };
        }
        return { valid: true, normalized: raw };
    }

    return { valid: true, normalized: raw };
};

window.ensureBizDefaultAccounts = function() {
    if (!Array.isArray(window.bizPaymentAccounts) || window.bizPaymentAccounts.length === 0) {
        return;
    }

    const receiveDefaults = window.bizPaymentAccounts.filter(item => item.isDefaultReceive);
    if (receiveDefaults.length !== 1) {
        const keeperId = receiveDefaults.length > 0 ? receiveDefaults[0].id : window.bizPaymentAccounts[0].id;
        window.bizPaymentAccounts = window.bizPaymentAccounts.map(item => ({
            ...item,
            isDefaultReceive: item.id === keeperId
        }));
    }

    const payDefaults = window.bizPaymentAccounts.filter(item => item.isDefaultPay);
    if (payDefaults.length !== 1) {
        const keeperId = payDefaults.length > 0 ? payDefaults[0].id : window.bizPaymentAccounts[0].id;
        window.bizPaymentAccounts = window.bizPaymentAccounts.map(item => ({
            ...item,
            isDefaultPay: item.id === keeperId
        }));
    }
};

window.initBizAccountManager = function() {
    window.ensureBizDefaultAccounts();
    window.renderBizPaymentAccounts();
};

window.renderBizPaymentAccounts = function() {
    const list = document.getElementById('biz-account-list');
    if (!list) return;

    if (window.bizPaymentAccounts.length === 0) {
        list.innerHTML = `
            <li class="px-4 py-8 rounded-xl border border-dashed border-slate-200 text-center">
                <div class="flex flex-col items-center gap-2 text-slate-400">
                    <i class="ph ph-wallet text-3xl"></i>
                    <p class="text-xs font-bold">暂无账户，请点击右上角 + 新增</p>
                </div>
            </li>
        `;
        return;
    }

    list.innerHTML = window.bizPaymentAccounts.map(account => `
        <li class="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-slate-50/70 transition-all">
            <div class="min-w-0">
                <p class="text-sm font-bold text-slate-800 truncate">${account.accountName}</p>
                <div class="flex items-center gap-1.5 mt-1">
                    ${account.isDefaultReceive ? '<span class="px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600 text-[9px] font-bold">收</span>' : ''}
                    ${account.isDefaultPay ? '<span class="px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-bold">付</span>' : ''}
                </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
                <button onclick="window.openBizAccountDetailModal(${account.id})" class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="详情">
                    <i class="ph ph-eye text-sm"></i>
                </button>
                <button onclick="window.openBizAccountModal(${account.id})" class="w-7 h-7 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="编辑">
                    <i class="ph ph-pencil-simple text-sm"></i>
                </button>
                <button onclick="window.openBizAccountDeleteModal(${account.id})" class="w-7 h-7 rounded-lg text-slate-400 hover:text-risk-high hover:bg-rose-50 transition-colors" title="删除">
                    <i class="ph ph-trash text-sm"></i>
                </button>
            </div>
        </li>
    `).join('');
};

window.openBizAccountDetailModal = function(accountId) {
    const account = window.bizPaymentAccounts.find(item => item.id === accountId);
    if (!account) return;

    window.bizAccountDetailId = accountId;
    const modal = document.getElementById('biz-account-detail-modal');
    if (!modal) return;

    const nameEl = document.getElementById('biz-detail-name');
    const typeEl = document.getElementById('biz-detail-type');
    const noEl = document.getElementById('biz-detail-no');
    const holderEl = document.getElementById('biz-detail-holder');
    const receiveEl = document.getElementById('biz-detail-default-receive');
    const payEl = document.getElementById('biz-detail-default-pay');

    if (nameEl) nameEl.innerText = account.accountName;
    if (typeEl) typeEl.innerText = account.type;
    if (noEl) noEl.innerText = account.accountNo;
    if (holderEl) holderEl.innerText = account.holder;
    if (receiveEl) receiveEl.classList.toggle('hidden', !account.isDefaultReceive);
    if (payEl) payEl.classList.toggle('hidden', !account.isDefaultPay);

    modal.classList.remove('hidden');
};

window.closeBizAccountDetailModal = function() {
    const modal = document.getElementById('biz-account-detail-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    window.bizAccountDetailId = null;
};

window.openBizAccountModal = function(accountId) {
    window.bizAccountEditId = typeof accountId === 'number' ? accountId : null;

    const modal = document.getElementById('biz-account-modal');
    if (!modal) return;

    const typeEl = document.getElementById('biz-account-type');
    const nameEl = document.getElementById('biz-account-name');
    const noEl = document.getElementById('biz-account-no');
    const holderEl = document.getElementById('biz-account-holder');
    const receiveEl = document.getElementById('biz-account-default-receive');
    const payEl = document.getElementById('biz-account-default-pay');
    const titleEl = document.getElementById('biz-account-modal-title');

    if (window.bizAccountEditId === null) {
        if (titleEl) titleEl.innerText = '新增首付款账户';
        if (typeEl) typeEl.value = '支付宝账户';
        if (nameEl) nameEl.value = '';
        if (noEl) noEl.value = '';
        if (holderEl) holderEl.value = '';
        if (receiveEl) receiveEl.checked = false;
        if (payEl) payEl.checked = false;
    } else {
        const target = window.bizPaymentAccounts.find(item => item.id === window.bizAccountEditId);
        if (!target) return;

        if (titleEl) titleEl.innerText = '编辑首付款账户';
        if (typeEl) typeEl.value = target.type;
        if (nameEl) nameEl.value = target.accountName;
        if (noEl) noEl.value = target.accountNo;
        if (holderEl) holderEl.value = target.holder;
        if (receiveEl) receiveEl.checked = !!target.isDefaultReceive;
        if (payEl) payEl.checked = !!target.isDefaultPay;
    }

    modal.classList.remove('hidden');
};

window.closeBizAccountModal = function() {
    const modal = document.getElementById('biz-account-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    window.bizAccountEditId = null;
};

window.saveBizAccount = function() {
    const typeEl = document.getElementById('biz-account-type');
    const nameEl = document.getElementById('biz-account-name');
    const noEl = document.getElementById('biz-account-no');
    const holderEl = document.getElementById('biz-account-holder');
    const receiveEl = document.getElementById('biz-account-default-receive');
    const payEl = document.getElementById('biz-account-default-pay');

    if (!typeEl || !nameEl || !noEl || !holderEl || !receiveEl || !payEl) return;

    const accountName = nameEl.value.trim();
    const accountNo = noEl.value.trim();
    const holder = holderEl.value.trim();

    if (!accountName || !accountNo || !holder) {
        alert('请完善账户名称、账户号和账户归属主体。');
        return;
    }

    const validation = window.validateBizAccountNo(typeEl.value, accountNo);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }

    const payload = {
        type: typeEl.value,
        accountName: accountName,
        accountNo: validation.normalized,
        holder: holder,
        isDefaultReceive: receiveEl.checked,
        isDefaultPay: payEl.checked
    };

    if (window.bizAccountEditId === null) {
        payload.id = Date.now();
        window.bizPaymentAccounts.unshift(payload);
    } else {
        window.bizPaymentAccounts = window.bizPaymentAccounts.map(item =>
            item.id === window.bizAccountEditId ? { ...item, ...payload } : item
        );
    }

    if (payload.isDefaultReceive) {
        window.bizPaymentAccounts = window.bizPaymentAccounts.map(item => ({
            ...item,
            isDefaultReceive: item.id === (window.bizAccountEditId === null ? payload.id : window.bizAccountEditId)
        }));
    }

    if (payload.isDefaultPay) {
        window.bizPaymentAccounts = window.bizPaymentAccounts.map(item => ({
            ...item,
            isDefaultPay: item.id === (window.bizAccountEditId === null ? payload.id : window.bizAccountEditId)
        }));
    }

    window.ensureBizDefaultAccounts();
    window.renderBizPaymentAccounts();
    window.closeBizAccountModal();
    if (typeof showToast === 'function') {
        showToast('账户信息已保存');
    }
};

window.openBizAccountDeleteModal = function(accountId) {
    window.bizAccountDeleteId = accountId;
    const modal = document.getElementById('biz-account-delete-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
};

window.closeBizAccountDeleteModal = function() {
    const modal = document.getElementById('biz-account-delete-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    window.bizAccountDeleteId = null;
};

window.deleteBizAccount = function() {
    if (window.bizAccountDeleteId === null) return;
    window.bizPaymentAccounts = window.bizPaymentAccounts.filter(item => item.id !== window.bizAccountDeleteId);
    window.ensureBizDefaultAccounts();
    window.renderBizPaymentAccounts();
    window.closeBizAccountDeleteModal();
    if (typeof showToast === 'function') {
        showToast('账户已删除');
    }
};

window.toggleBizDefaultReceive = function(accountId, checked) {
    const target = window.bizPaymentAccounts.find(item => item.id === accountId);
    if (!target) return;

    if (!checked && target.isDefaultReceive) {
        const defaultCount = window.bizPaymentAccounts.filter(item => item.isDefaultReceive).length;
        if (defaultCount <= 1) {
            if (typeof showToast === 'function') {
                showToast('请至少保留一个默认收款账户');
            }
            window.renderBizPaymentAccounts();
            return;
        }
    }

    if (!checked) {
        window.bizPaymentAccounts = window.bizPaymentAccounts.map(item =>
            item.id === accountId ? { ...item, isDefaultReceive: false } : item
        );
    } else {
        window.bizPaymentAccounts = window.bizPaymentAccounts.map(item => ({
            ...item,
            isDefaultReceive: item.id === accountId
        }));
    }
    window.ensureBizDefaultAccounts();
    window.renderBizPaymentAccounts();
};

window.toggleBizDefaultPay = function(accountId, checked) {
    const target = window.bizPaymentAccounts.find(item => item.id === accountId);
    if (!target) return;

    if (!checked && target.isDefaultPay) {
        const defaultCount = window.bizPaymentAccounts.filter(item => item.isDefaultPay).length;
        if (defaultCount <= 1) {
            if (typeof showToast === 'function') {
                showToast('请至少保留一个默认付款账户');
            }
            window.renderBizPaymentAccounts();
            return;
        }
    }

    if (!checked) {
        window.bizPaymentAccounts = window.bizPaymentAccounts.map(item =>
            item.id === accountId ? { ...item, isDefaultPay: false } : item
        );
    } else {
        window.bizPaymentAccounts = window.bizPaymentAccounts.map(item => ({
            ...item,
            isDefaultPay: item.id === accountId
        }));
    }
    window.ensureBizDefaultAccounts();
    window.renderBizPaymentAccounts();
};
