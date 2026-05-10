console.log('=== product-center.js 加载成功 ===');

// 产品数据模型（库存基本单位为「当前库存总量」字段；单位换算用于展示与单据）
let products = [
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
        stockStatus: '充足',
        baseUnit: '件',
        unitConversions: [],
        warehouseStock: {},
        description: '',
        defaultPurchaseUnit: '__base__',
        defaultSalesUnit: '__base__',
        warning_stock: 200
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
        stockStatus: '缺货',
        warning_stock: 120,
        baseUnit: '件',
        unitConversions: [],
        warehouseStock: {},
        description: '',
        defaultPurchaseUnit: '__base__',
        defaultSalesUnit: '__base__'
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
        stockStatus: '预警',
        baseUnit: '根',
        unitConversions: [{ unit: '箱', perBase: 200 }, { unit: '包', perBase: 10 }],
        warehouseStock: {},
        description: '无叶挂脖设计，三档风速可调。',
        defaultPurchaseUnit: '箱',
        defaultSalesUnit: '包',
        warning_stock: 400
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
        stockStatus: '充足',
        baseUnit: '件',
        unitConversions: [],
        warehouseStock: {},
        description: '',
        defaultPurchaseUnit: '__base__',
        defaultSalesUnit: '__base__',
        warning_stock: 200
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
        stockStatus: '充足',
        baseUnit: '件',
        unitConversions: [],
        warehouseStock: {},
        description: '',
        defaultPurchaseUnit: '__base__',
        defaultSalesUnit: '__base__',
        warning_stock: 200
    },
    {
        id: 6,
        name: '露营制冷冰桶（便携 12L）',
        sku: 'COOL-12L',
        category1: '户外装备',
        category2: '露营用品',
        supplier: '大连大发制冷厂',
        region: '国内市场',
        price: 128.00,
        purchasePrice: 85.00,
        stock: 8,
        salesVolume: 920,
        icon: 'snowflake',
        stockStatus: '缺货',
        warning_stock: 50,
        baseUnit: '件',
        unitConversions: [],
        warehouseStock: {},
        description: '',
        defaultPurchaseUnit: '__base__',
        defaultSalesUnit: '__base__'
    }
];

/** 演示数据：补足多条以便验证手机端「每页 20 条」分页（正式环境由接口分页） */
(function padProductsForMobilePaginationDemo() {
    const seed = products.slice();
    let nextId = products.length + 1;
    while (products.length < 22) {
        const s = seed[(nextId - 1) % seed.length];
        products.push({
            id: nextId,
            name: s.name + ' #' + nextId,
            sku: 'SKU-' + String(nextId).padStart(4, '0'),
            category1: s.category1,
            category2: s.category2,
            supplier: s.supplier,
            region: s.region,
            price: s.price,
            purchasePrice: s.purchasePrice,
            stock: Math.max(0, (s.stock || 0) - (nextId % 17)),
            salesVolume: (s.salesVolume || 0) - nextId,
            icon: s.icon,
            stockStatus: s.stockStatus,
            warning_stock: s.warning_stock,
            baseUnit: s.baseUnit || '件',
            unitConversions: JSON.parse(JSON.stringify(s.unitConversions || [])),
            warehouseStock: {},
            description: s.description || '',
            defaultPurchaseUnit: s.defaultPurchaseUnit || '__base__',
            defaultSalesUnit: s.defaultSalesUnit || '__base__'
        });
        nextId++;
    }
})();

function ensureProductModel(p) {
    if (!p.baseUnit) p.baseUnit = '件';
    if (!Array.isArray(p.unitConversions)) p.unitConversions = [];
    if (!p.warehouseStock || typeof p.warehouseStock !== 'object') p.warehouseStock = {};
    if (typeof p.description !== 'string') p.description = '';
    if (typeof p.defaultPurchaseUnit !== 'string') p.defaultPurchaseUnit = '__base__';
    if (typeof p.defaultSalesUnit !== 'string') p.defaultSalesUnit = '__base__';
    return p;
}

function sortedConversionsDesc(conversions) {
    return [...(conversions || [])].filter(function (c) {
        return c && c.unit && Number(c.perBase) > 0;
    }).sort(function (a, b) { return Number(b.perBase) - Number(a.perBase); });
}

function formatCompoundStockUi(baseQty, baseUnit, conversions) {
    const q = Math.max(0, Math.floor(Number(baseQty) || 0));
    const bu = baseUnit || '件';
    const sorted = sortedConversionsDesc(conversions);
    if (!sorted.length) return q + bu;
    let rem = q;
    const parts = [];
    for (let i = 0; i < sorted.length; i++) {
        const per = Number(sorted[i].perBase);
        const u = sorted[i].unit;
        const n = Math.floor(rem / per);
        if (n > 0) parts.push(n + u);
        rem %= per;
    }
    if (rem > 0) parts.push(rem + bu);
    return parts.length ? parts.join('') : ('0' + bu);
}

function computeStockStatus(stock, warning) {
    const w = typeof warning === 'number' ? warning : 200;
    if (stock <= 50) return '缺货';
    if (stock <= w) return '预警';
    return '充足';
}

(function hydrateWarehouseStockFromMock() {
    const stocks = window.TM_MOCK_WAREHOUSE_STOCKS;
    const whs = window.TM_MOCK_WAREHOUSES;
    if (!stocks || !whs || !whs.length) return;
    products.forEach(function (p) {
        ensureProductModel(p);
        const ws = {};
        whs.forEach(function (w) {
            const row = (stocks[w.id] || []).find(function (r) { return r.id === p.id; });
            if (row && typeof row.qty === 'number') ws[w.name] = row.qty;
        });
        if (Object.keys(ws).length) {
            p.warehouseStock = ws;
            p.stock = Object.values(ws).reduce(function (a, b) { return a + b; }, 0);
            p.stockStatus = computeStockStatus(p.stock, getProductWarningStock(p));
        }
    });
})();

// 筛选状态
let filterState = {
    category1: null,
    category2: null,
    supplier: null,
    stockStatus: null,
    searchText: ''
};

// 供应商列表
const suppliers = ['全部', '深圳照明科技', '广州户外用品厂', '大连大发制冷厂'];

// 库存状态
const stockStatuses = ['全部', '充足', '预警', '缺货'];

// 分类数据
const categories = [
    {
        name: '户外照明',
        subcategories: ['装饰灯具', '实用灯具']
    },
    {
        name: '户外装备',
        subcategories: ['露营用品']
    }
];

// 当前选中的产品
let currentProduct = null;

/** 手机端列表分页（批发版） */
window.MOBILE_PRODUCT_PAGE_SIZE = 20;
window.mobileProductListPage = 1;
window._mobileProductFilteredList = [];

// ==================== 全局暴露函数 ====================

window.toggleDropdown = function(dropdownId) {
    console.log('=== toggleDropdown 被调用，参数:', dropdownId);
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        console.error('未找到下拉容器:', dropdownId);
        return;
    }
    
    // 关闭其他所有下拉框并重置箭头
    document.querySelectorAll('[id$="-dropdown"]').forEach(d => {
        if (d.id !== dropdownId) {
            d.classList.add('hidden');
            // 重置其他下拉框的箭头
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
    
    // 切换当前下拉框
    const isHidden = dropdown.classList.contains('hidden');
    dropdown.classList.toggle('hidden');
    
    // 更新箭头图标
    const filterId = dropdownId.replace('-dropdown', '-filter');
    const filterEl = document.getElementById(filterId);
    if (filterEl) {
        const caretIcon = filterEl.querySelector('.ph-caret-down, .ph-caret-up');
        if (caretIcon) {
            if (isHidden) {
                console.log('打开下拉框，更新箭头');
                caretIcon.classList.remove('ph-caret-down');
                caretIcon.classList.add('ph-caret-up', 'rotate-180', 'text-teal-500');
            } else {
                console.log('关闭下拉框，重置箭头');
                caretIcon.classList.remove('ph-caret-up', 'rotate-180', 'text-teal-500');
                caretIcon.classList.add('ph-caret-down');
            }
        }
    }
    
    // 阻止事件冒泡，防止触发 document 的关闭点击
    if (event) {
        event.stopPropagation();
    }
};

window.selectCategory = function(category1, category2) {
    console.log('=== selectCategory 被调用，参数:', category1, category2);
    filterState.category1 = category1;
    filterState.category2 = category2;
    
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
    // 重置箭头图标
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
    console.log('=== selectSupplier 被调用，参数:', supplier);
    filterState.supplier = supplier;
    
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
    // 重置箭头图标
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
    console.log('=== selectStockStatus 被调用，参数:', status);
    filterState.stockStatus = status;
    
    const label = document.getElementById('stock-label');
    const btn = document.getElementById('stock-filter').querySelector('button');
    
    if (status && status !== '全部') {
        label.textContent = status;
        btn.classList.add('bg-white', 'ring-2', 'ring-teal-500/20', 'shadow-md');
    } else {
        label.textContent = '库存';
        btn.classList.remove('bg-white', 'ring-2', 'ring-teal-500/20', 'shadow-md');
    }
    
    document.getElementById('stock-dropdown').classList.add('hidden');
    // 重置箭头图标
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
    console.log('=== updateResetButton 被调用 ===');
    const resetBtn = document.getElementById('reset-filter-btn');
    if (!resetBtn) return;
    
    const hasActiveFilter = filterState.category1 || filterState.supplier || filterState.stockStatus || filterState.searchText;
    
    if (hasActiveFilter) {
        resetBtn.classList.remove('hidden');
        resetBtn.classList.add('flex', 'items-center');
    } else {
        resetBtn.classList.add('hidden');
        resetBtn.classList.remove('flex', 'items-center');
    }
};

window.resetFilters = function() {
    console.log('=== resetFilters 被调用 ===');
    filterState = {
        category1: null,
        category2: null,
        supplier: null,
        stockStatus: null,
        searchText: ''
    };
    
    const searchInput = document.getElementById('inventorySearch');
    if (searchInput) {
        searchInput.value = '';
    }
    
    document.getElementById('category-label').textContent = '产品类别';
    document.getElementById('supplier-label').textContent = '供应商';
    document.getElementById('stock-label').textContent = '库存';
    
    document.querySelectorAll('#category-filter button, #supplier-filter button, #stock-filter button').forEach(btn => {
        btn.classList.remove('bg-white', 'ring-2', 'ring-teal-500/20', 'shadow-md');
    });
    
    window.updateResetButton();
    window.filterProducts();
};

window.filterInventoryTable = function() {
    console.log('=== filterInventoryTable 被调用 ===');
    const searchInput = document.getElementById('inventorySearch');
    if (searchInput) {
        filterState.searchText = searchInput.value;
        window.filterProducts();
    }
};

window.filterProducts = function() {
    console.log('=== filterProducts 被调用 ===');
    window.mobileProductListPage = 1;
    let filtered = [...products];
    
    if (filterState.searchText) {
        const searchLower = filterState.searchText.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchLower) || 
            p.sku.toLowerCase().includes(searchLower)
        );
    }
    
    if (filterState.category1) {
        filtered = filtered.filter(p => p.category1 === filterState.category1);
        if (filterState.category2) {
            filtered = filtered.filter(p => p.category2 === filterState.category2);
        }
    }
    
    if (filterState.supplier && filterState.supplier !== '全部') {
        filtered = filtered.filter(p => p.supplier === filterState.supplier);
    }
    
    if (filterState.stockStatus && filterState.stockStatus !== '全部') {
        filtered = filtered.filter(p => p.stockStatus === filterState.stockStatus);
    }
    
    console.log('筛选后产品数量:', filtered.length);
    window.renderProducts(filtered);
};

window.renderProducts = function(productList) {
    console.log('=== renderProducts 被调用，产品数量:', productList.length);
    const sortedProducts = [...productList].sort((a, b) => b.salesVolume - a.salesVolume);
    window._mobileProductFilteredList = sortedProducts;

    window.renderDesktopTable(sortedProducts);
    window.renderMobileListPaged();
};

window.renderDesktopTable = function(productList) {
    console.log('=== renderDesktopTable 被调用 ===');
    const tbody = document.querySelector('#existingProdTable tbody');
    console.log('Desktop table tbody:', tbody);
    if (!tbody) return;
    
    if (productList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center">
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
            <td class="px-6 py-4 align-top max-w-0">
                <div class="flex items-start gap-3 min-w-0">
                    <div class="w-10 h-10 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                        <i class="ph ph-${product.icon} text-xl"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="font-bold text-slate-800 product-name-cell whitespace-normal break-words leading-snug">${product.name}</p>
                        <p class="text-[10px] text-slate-400 font-mono product-sku-cell uppercase mt-1">SKU: ${product.sku}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-right font-mono font-bold text-slate-500 col-hide-mobile">
                $${product.price.toFixed(2)}
            </td>
            <td class="px-6 py-4 text-right font-mono font-bold text-brand-600 col-hide-mobile">
                $${product.purchasePrice.toFixed(2)}
            </td>
            <td class="px-6 py-4 text-right">
                <p class="font-mono font-bold ${window.getStockColor(product.stockStatus)} tracking-tighter text-[11px] md:text-xs whitespace-nowrap">
                    ${formatCompoundStockUi(product.stock, product.baseUnit, product.unitConversions)}
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

window.renderMobileListPaged = function() {
    console.log('=== renderMobileListPaged 被调用 ===');
    var container = document.getElementById('mobile-product-cards');
    var pagEl = document.getElementById('mobile-product-pagination');
    var list = window._mobileProductFilteredList || [];
    var pageSize = window.MOBILE_PRODUCT_PAGE_SIZE || 20;
    if (!container) return;

    var page = window.mobileProductListPage || 1;
    var totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    window.mobileProductListPage = page;

    if (list.length === 0) {
        container.innerHTML = `
            <div class="py-10 px-4 text-center">
                <i class="ph ph-package text-3xl text-slate-300"></i>
                <p class="text-slate-400 font-bold mt-2 text-xs">暂无产品</p>
            </div>`;
        if (pagEl) pagEl.innerHTML = '';
        return;
    }

    var start = (page - 1) * pageSize;
    var slice = list.slice(start, start + pageSize);

    container.innerHTML = slice.map(function (product) {
        var pct = window.getStockPercentage(product.stock);
        var barClass = window.getStockBgColor(product.stockStatus);
        var pulse = product.stockStatus === '缺货' ? 'animate-pulse' : '';
        return `
        <div class="mobile-product-row flex items-stretch gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-50/90 active:bg-slate-50" onclick="window.openProductDetail(${product.id})">
            <div class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                <i class="ph ph-${product.icon} text-base"></i>
            </div>
            <div class="flex-1 min-w-0 py-0">
                <div class="flex justify-between gap-2 items-start">
                    <p class="font-bold text-slate-800 text-[12px] leading-tight line-clamp-3 min-w-0">${product.name}</p>
                    <span class="font-mono text-[9px] text-slate-600 shrink-0 text-right max-w-[45%]">${formatCompoundStockUi(product.stock, product.baseUnit, product.unitConversions)}</span>
                </div>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-0 mt-0.5 text-[10px]">
                    <span class="text-slate-600">销售 <span class="font-mono font-bold">$${product.price.toFixed(2)}</span></span>
                    <span class="text-brand-600">进货 <span class="font-mono font-bold">$${product.purchasePrice.toFixed(2)}</span></span>
                </div>
                <div class="w-full max-w-[11rem] h-0.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div class="${barClass} h-full ${pulse}" style="width:${pct}%"></div>
                </div>
            </div>
            <div class="flex flex-col gap-1 justify-center shrink-0" onclick="event.stopPropagation()">
                <button type="button" onclick="window.openProductDetail(${product.id})" class="mobile-mini-btn" title="编辑"><i class="ph ph-pencil-simple"></i></button>
                <button type="button" onclick="window.confirmDeleteProductById(${product.id})" class="mobile-mini-btn delete" title="删除"><i class="ph ph-trash"></i></button>
            </div>
        </div>`;
    }).join('');

    if (pagEl) {
        var total = list.length;
        var prevDis = page <= 1 ? 'disabled' : '';
        var nextDis = page >= totalPages ? 'disabled' : '';
        pagEl.innerHTML = `
            <div class="flex flex-col gap-1.5">
                <p class="mobile-product-pagination-summary text-[9px] text-slate-500 leading-snug text-center">共 ${total} 条，第 ${page}/${totalPages} 页，每页 ${pageSize} 条</p>
                <div class="flex gap-1.5 justify-center items-center">
                    <button type="button" class="mobile-page-btn" ${prevDis} onclick="window.tmMobileProductPrevPage()" aria-label="上一页">
                        <i class="ph ph-caret-left mobile-page-btn__icon" aria-hidden="true"></i>
                        <span class="mobile-page-btn__text">上一页</span>
                    </button>
                    <button type="button" class="mobile-page-btn" ${nextDis} onclick="window.tmMobileProductNextPage()" aria-label="下一页">
                        <span class="mobile-page-btn__text">下一页</span>
                        <i class="ph ph-caret-right mobile-page-btn__icon" aria-hidden="true"></i>
                    </button>
                </div>
            </div>`;
    }
};

window.confirmDeleteProductById = function(productId) {
    var p = products.find(function (x) { return x.id === productId; });
    if (p) window.confirmDeleteProduct(p.name);
};

window.tmMobileProductPrevPage = function() {
    window.mobileProductListPage = (window.mobileProductListPage || 1) - 1;
    window.renderMobileListPaged();
};

window.tmMobileProductNextPage = function() {
    window.mobileProductListPage = (window.mobileProductListPage || 1) + 1;
    window.renderMobileListPaged();
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
    console.log('=== initCategoryOptions 被调用 ===');
    const container = document.getElementById('category-options');
    if (!container) return;
    
    container.innerHTML = `
        <button onclick="window.selectCategory(null, null)" class="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-all border-b border-slate-50">
            全部类别
        </button>
    ` + categories.map(cat => `
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
    console.log('=== initSupplierOptions 被调用 ===');
    const container = document.getElementById('supplier-options');
    if (!container) return;
    
    container.innerHTML = suppliers.map(supplier => `
        <button onclick="window.selectSupplier('${supplier}')" class="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-all border-b border-slate-50 last:border-b-0">
            ${supplier}
        </button>
    `).join('');
};

window.initStockOptions = function() {
    console.log('=== initStockOptions 被调用 ===');
    const container = document.getElementById('stock-options');
    if (!container) return;
    
    container.innerHTML = stockStatuses.map(status => `
        <button onclick="window.selectStockStatus('${status}')" class="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-all border-b border-slate-50 last:border-b-0 flex items-center gap-3">
            ${status !== '全部' ? `<span class="inline-block w-2.5 h-2.5 ${window.getStockStatusColor(status)} rounded-full"></span>` : ''}
            ${status}
        </button>
    `).join('');
};

window.initFilterOptions = function() {
    console.log('=== initFilterOptions 被调用 ===');
    window.initCategoryOptions();
    window.initSupplierOptions();
    window.initStockOptions();
};

window.initProductList = function() {
    console.log('=== initProductList 被调用，产品数量:', products.length);
    window.renderProducts(products);
};

window.initProductCenter = function() {
    console.log('=== initProductCenter 被调用 ===');
    window.initProductList();
    window.initFilterOptions();
};

const MAX_UNIT_CONVERSION_ROWS = 2;

function tmEscAttr(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function collapseAdvancedDrawer() {
    const modal = document.getElementById('product-detail-modal');
    const drawer = modal ? modal.querySelector('.tm-product-advanced-drawer') : null;
    const icon = document.getElementById('product-detail-advanced-icon');
    if (drawer) {
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
    }
    if (icon) {
        icon.classList.add('ph-caret-down');
        icon.classList.remove('ph-caret-up');
    }
}

function rebuildSupplierSelect(selectedSupplier) {
    const el = document.getElementById('detail-product-supplier');
    if (!el) return;
    const opts = suppliers.filter(s => s !== '全部');
    el.innerHTML = opts.map(s => `<option value="${tmEscAttr(s)}">${s}</option>`).join('');
    if (selectedSupplier && opts.includes(selectedSupplier)) el.value = selectedSupplier;
}

function rebuildUnitSelects(product) {
    ensureProductModel(product);
    const purchaseEl = document.getElementById('detail-product-purchase-unit');
    const salesEl = document.getElementById('detail-product-sales-unit');
    if (!purchaseEl || !salesEl) return;
    const base = product.baseUnit || '件';
    const sorted = sortedConversionsDesc(product.unitConversions);
    let html = '';
    sorted.forEach(c => {
        html += `<option value="${tmEscAttr(c.unit)}">${c.unit}（1${c.unit}=${c.perBase}${base}）</option>`;
    });
    html += `<option value="__base__">${base}（基本单位）</option>`;
    purchaseEl.innerHTML = html;
    salesEl.innerHTML = html;
    const pick = val => {
        if (val === '__base__') return '__base__';
        if (sorted.some(x => x.unit === val)) return val;
        return sorted.length ? sorted[0].unit : '__base__';
    };
    purchaseEl.value = pick(product.defaultPurchaseUnit);
    salesEl.value = pick(product.defaultSalesUnit);
}

function syncTotalStockFromWarehouseInputs() {
    const container = document.getElementById('detail-product-warehouse-stock');
    const stockEl = document.getElementById('detail-product-stock');
    if (!container || !stockEl) return;
    let sum = 0;
    container.querySelectorAll('.detail-warehouse-stock-input').forEach(inp => {
        sum += parseInt(inp.value, 10) || 0;
    });
    stockEl.value = String(sum);
}

function updateWarehouseRowPreview(rowEl, product) {
    if (!rowEl || !product) return;
    const inp = rowEl.querySelector('.detail-warehouse-stock-input');
    const preview = rowEl.querySelector('.warehouse-stock-preview');
    if (!inp || !preview) return;
    const q = parseInt(inp.value, 10) || 0;
    preview.textContent = formatCompoundStockUi(q, product.baseUnit, product.unitConversions);
}

function readWarehouseStockFromContainer() {
    const container = document.getElementById('detail-product-warehouse-stock');
    if (!container) return {};
    const out = {};
    container.querySelectorAll('.detail-warehouse-stock-input').forEach(inp => {
        const name = inp.getAttribute('data-warehouse');
        if (!name) return;
        out[name] = Math.max(0, parseInt(inp.value, 10) || 0);
    });
    return out;
}

function renderWarehouseStockSummary(product) {
    const el = document.getElementById('detail-product-warehouse-stock');
    if (!el) return;
    ensureProductModel(product);
    const whs = window.TM_MOCK_WAREHOUSES || [];
    const base = product.baseUnit || '件';
    const conv = product.unitConversions || [];

    if (!whs.length) {
        el.innerHTML =
            '<p class="text-[11px] text-slate-400 leading-relaxed">暂无仓库档案，请先在仓库管理中维护。</p>';
        return;
    }

    const rows = whs.map(w => {
        const qtyRaw = product.warehouseStock[w.name];
        const v = qtyRaw != null && qtyRaw >= 0 ? qtyRaw : 0;
        const preview = formatCompoundStockUi(v, base, conv);
        const wName = tmEscAttr(w.name);
        return `<div class="warehouse-stock-row flex flex-wrap items-center gap-2 justify-between text-xs border-b border-slate-100/80 pb-2 last:border-0 last:pb-0">
            <span class="font-bold text-slate-600 shrink-0">${wName}</span>
            <div class="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <input type="number" min="0" step="1" class="form-input font-mono text-right w-[6.5rem] py-1.5 text-xs detail-warehouse-stock-input" data-warehouse="${wName}" value="${v}" autocomplete="off" aria-label="${wName} 库存基本数量">
                <span class="text-[10px] font-mono text-slate-500 whitespace-nowrap warehouse-stock-preview">${preview}</span>
            </div>
        </div>`;
    });

    el.innerHTML = `<div class="space-y-2">${rows.join('')}</div><p class="text-[10px] text-slate-400 mt-2 leading-relaxed">数量为基本单位；右侧为按当前换算规则折算预览。修改后将自动汇总到上方「当前库存总量」。</p>`;

    el.querySelectorAll('.warehouse-stock-row').forEach(row => {
        const inp = row.querySelector('.detail-warehouse-stock-input');
        if (!inp) return;
        inp.addEventListener('input', () => {
            updateWarehouseRowPreview(row, product);
            syncTotalStockFromWarehouseInputs();
        });
    });
}

function syncUnitModalRowButtons() {
    const container = document.getElementById('unit-conversion-rows');
    const addBtn = document.getElementById('unit-modal-add-btn');
    const rmBtn = document.getElementById('unit-modal-remove-btn');
    const n = container ? container.querySelectorAll('.unit-conversion-row').length : 0;
    if (addBtn) {
        addBtn.disabled = n >= MAX_UNIT_CONVERSION_ROWS;
        addBtn.classList.toggle('opacity-40', n >= MAX_UNIT_CONVERSION_ROWS);
    }
    if (rmBtn) {
        rmBtn.disabled = n <= 1;
        rmBtn.classList.toggle('opacity-40', n <= 1);
    }
}

function paintUnitModalRows(rows, baseLabel) {
    const container = document.getElementById('unit-conversion-rows');
    if (!container) return;
    const bl = baseLabel || '件';
    container.innerHTML = rows
        .map(
            (row, idx) => `
        <div class="unit-conversion-row flex flex-wrap items-end gap-2 sm:gap-3" data-idx="${idx}">
            <div class="flex-1 min-w-[5rem]">${idx === 0 ? '<label class="text-[9px] font-black text-slate-400 uppercase block mb-1">包装单位</label>' : '<span class="block mb-1 h-[14px]"></span>'}
                <input type="text" data-field="unit" value="${tmEscAttr(row.unit || '')}" class="form-input text-center font-bold w-full" placeholder="如：箱" autocomplete="off"></div>
            <div class="pb-2 text-slate-300 hidden sm:block select-none">=</div>
            <div class="flex-1 min-w-[5rem]">${idx === 0 ? '<label class="text-[9px] font-black text-slate-400 uppercase block mb-1">折合基本数量</label>' : '<span class="block mb-1 h-[14px]"></span>'}
                <input type="number" min="1" data-field="perBase" value="${row.perBase !== '' && row.perBase != null ? tmEscAttr(row.perBase) : ''}" class="form-input text-center text-brand-600 font-black w-full" placeholder="数量" autocomplete="off"></div>
            <div class="pb-2 text-xs font-bold text-slate-400 shrink-0">${tmEscAttr(bl)}</div>
        </div>`
        )
        .join('');
    syncUnitModalRowButtons();
}

function readUnitRowsFromModal() {
    const container = document.getElementById('unit-conversion-rows');
    if (!container) return [{ unit: '', perBase: '' }];
    const out = [];
    container.querySelectorAll('.unit-conversion-row').forEach(row => {
        const u = row.querySelector('[data-field="unit"]');
        const n = row.querySelector('[data-field="perBase"]');
        out.push({ unit: u ? u.value.trim() : '', perBase: n ? n.value : '' });
    });
    return out.length ? out : [{ unit: '', perBase: '' }];
}

window.addUnitConversionRow = function() {
    const container = document.getElementById('unit-conversion-rows');
    if (!container) return;
    const rows = container.querySelectorAll('.unit-conversion-row');
    if (rows.length >= MAX_UNIT_CONVERSION_ROWS) return;
    const baseInput = document.getElementById('detail-product-base-unit');
    const bl = (baseInput && baseInput.value.trim()) || '件';
    const data = readUnitRowsFromModal();
    data.push({ unit: '', perBase: '' });
    paintUnitModalRows(data, bl);
};

window.removeUnitConversionRow = function() {
    const baseInput = document.getElementById('detail-product-base-unit');
    const bl = (baseInput && baseInput.value.trim()) || '件';
    const data = readUnitRowsFromModal();
    if (data.length <= 1) return;
    data.pop();
    paintUnitModalRows(data, bl);
};

window.saveUnitConversionRules = function() {
    const prod = currentProduct || window.currentProduct;
    const baseInput = document.getElementById('detail-product-base-unit');
    const base = (baseInput && baseInput.value.trim()) || '件';
    if (baseInput) baseInput.value = base;
    const rows = readUnitRowsFromModal();
    const list = [];
    rows.forEach(r => {
        const u = (r.unit || '').trim();
        const n = parseInt(r.perBase, 10);
        if (u && n > 0) list.push({ unit: u, perBase: n });
    });
    list.sort((a, b) => b.perBase - a.perBase);
    if (prod) {
        prod.unitConversions = list;
        prod.baseUnit = base;
        ensureProductModel(prod);
        rebuildUnitSelects(prod);
        renderWarehouseStockSummary(prod);
    }
    window.closeProductUnitModal();
};

window.openNewProductModal = function() {
    collapseAdvancedDrawer();
    const newSku = `SKU-${Date.now().toString().slice(-6)}`;
    const draft = {
        _isNew: true,
        id: null,
        name: '',
        sku: newSku,
        category1: categories[0]?.name || '户外照明',
        category2: categories[0]?.subcategories?.[0] || '默认',
        supplier: suppliers.find(s => s !== '全部') || '深圳照明科技',
        region: '',
        price: 0,
        purchasePrice: 0,
        stock: 0,
        salesVolume: 0,
        icon: 'package',
        stockStatus: '缺货',
        warning_stock: 100,
        baseUnit: '件',
        unitConversions: [],
        warehouseStock: {},
        description: '',
        defaultPurchaseUnit: '__base__',
        defaultSalesUnit: '__base__'
    };
    currentProduct = draft;
    window.currentProduct = draft;

    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;

    const titleEl = document.getElementById('detail-title');
    const skuEl = document.getElementById('detail-sku');
    const nameEl = document.getElementById('detail-product-name');
    const skuInputEl = document.getElementById('detail-product-sku-input');
    const priceEl = document.getElementById('detail-product-price');
    const stockEl = document.getElementById('detail-product-stock');
    const warningStockEl = document.getElementById('detail-product-warning-stock');
    const baseUnitEl = document.getElementById('detail-product-base-unit');
    const descEl = document.getElementById('detail-product-description');

    if (titleEl) titleEl.textContent = '新增产品';
    if (skuEl) skuEl.textContent = 'SKU: ' + newSku;
    if (nameEl) nameEl.value = '';
    if (skuInputEl) skuInputEl.value = newSku;
    if (priceEl) priceEl.value = '0';
    if (stockEl) stockEl.value = '0';
    if (warningStockEl) warningStockEl.value = '100';
    if (baseUnitEl) baseUnitEl.value = '件';
    if (descEl) descEl.value = '';

    rebuildSupplierSelect(draft.supplier);
    rebuildUnitSelects(draft);
    renderWarehouseStockSummary(draft);

    modal.classList.remove('hidden');
};

window.openProductDetail = function(productId) {
    const product = products.find(p => p.id === productId || p.name === productId);
    if (!product) return;
    ensureProductModel(product);
    currentProduct = product;
    window.currentProduct = product;
    collapseAdvancedDrawer();

    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;

    const titleEl = document.getElementById('detail-title');
    const skuEl = document.getElementById('detail-sku');
    const nameEl = document.getElementById('detail-product-name');
    const skuInputEl = document.getElementById('detail-product-sku-input');
    const priceEl = document.getElementById('detail-product-price');
    const stockEl = document.getElementById('detail-product-stock');
    const warningStockEl = document.getElementById('detail-product-warning-stock');
    const baseUnitEl = document.getElementById('detail-product-base-unit');
    const descEl = document.getElementById('detail-product-description');

    if (titleEl) titleEl.textContent = product.name;
    if (skuEl) skuEl.textContent = 'SKU: ' + product.sku;
    if (nameEl) nameEl.value = product.name || '';
    if (skuInputEl) skuInputEl.value = product.sku || '';
    if (priceEl) priceEl.value = product.price != null ? product.price : '';
    if (stockEl) stockEl.value = product.stock != null ? product.stock : '';
    if (warningStockEl) warningStockEl.value = getProductWarningStock(product);
    if (baseUnitEl) baseUnitEl.value = product.baseUnit || '件';
    if (descEl) descEl.value = product.description || '';

    rebuildSupplierSelect(product.supplier);
    rebuildUnitSelects(product);
    renderWarehouseStockSummary(product);

    modal.classList.remove('hidden');
};

window.closeProductDetail = function() {
    const modal = document.getElementById('product-detail-modal');
    if (modal) modal.classList.add('hidden');
    collapseAdvancedDrawer();
    currentProduct = null;
    window.currentProduct = null;
};

window.confirmDeleteProduct = function(productName) {
    console.log('=== confirmDeleteProduct 被调用，产品名:', productName);
    if (confirm('确定要删除产品 "' + productName + '" 吗？')) {
        products = products.filter(p => p.name !== productName);
        window.filterProducts();
    }
};

window.saveProduct = function() {
    const prod = currentProduct || window.currentProduct;
    const nameEl = document.getElementById('detail-product-name');
    const skuInputEl = document.getElementById('detail-product-sku-input');
    const priceEl = document.getElementById('detail-product-price');
    const stockEl = document.getElementById('detail-product-stock');
    const supplierEl = document.getElementById('detail-product-supplier');
    const warningStockEl = document.getElementById('detail-product-warning-stock');
    const baseUnitEl = document.getElementById('detail-product-base-unit');
    const descEl = document.getElementById('detail-product-description');
    const purchaseEl = document.getElementById('detail-product-purchase-unit');
    const salesEl = document.getElementById('detail-product-sales-unit');

    if (!nameEl || !skuInputEl || !priceEl || !stockEl || !supplierEl) {
        alert('产品信息表单未就绪，请重试。');
        return;
    }

    const name = nameEl.value.trim();
    const sku = skuInputEl.value.trim();
    const price = parseFloat(priceEl.value) || 0;
    let stock = parseInt(stockEl.value, 10) || 0;
    const whStock = readWarehouseStockFromContainer();
    const sumWh = Object.values(whStock).reduce((a, b) => a + (parseInt(b, 10) || 0), 0);
    const supplier = (supplierEl.value || '').trim();
    const warningParsed = parseInt(warningStockEl && warningStockEl.value, 10);
    const warning_stock = Number.isFinite(warningParsed) ? warningParsed : 100;
    const baseUnit = (baseUnitEl && baseUnitEl.value.trim()) || '件';
    const description = descEl ? descEl.value.trim() : '';
    const defaultPurchaseUnit = purchaseEl ? purchaseEl.value : '__base__';
    const defaultSalesUnit = salesEl ? salesEl.value : '__base__';

    if (!name || !sku) {
        alert('请填写产品名称与 SKU 编码。');
        return;
    }

    if (!prod) {
        alert('未找到当前编辑上下文。');
        return;
    }

    ensureProductModel(prod);
    prod.name = name;
    prod.sku = sku;
    prod.price = price;
    prod.supplier = supplier;
    prod.warning_stock = warning_stock;
    prod.baseUnit = baseUnit;
    prod.description = description;
    prod.defaultPurchaseUnit = defaultPurchaseUnit;
    prod.defaultSalesUnit = defaultSalesUnit;
    if (Object.keys(whStock).length) {
        prod.warehouseStock = whStock;
        if (sumWh > 0) {
            stock = sumWh;
            stockEl.value = String(stock);
        }
    }
    prod.stock = stock;
    prod.stockStatus = computeStockStatus(stock, warning_stock);

    if (prod._isNew) {
        prod.purchasePrice = Math.max(0, +(price * 0.7).toFixed(2));
        const maxId = products.reduce((m, x) => Math.max(m, x.id || 0), 0);
        prod.id = maxId + 1;
        delete prod._isNew;
        products.unshift(prod);
        alert('新产品已新增到产品库！');
    } else {
        alert('产品信息已更新！');
    }

    window.filterProducts();
    window.closeProductDetail();
};

window.toggleAdvanced = function() {
    const crmModal = document.getElementById('client-edit-modal');
    const productModal = document.getElementById('product-detail-modal');
    let drawer = null;
    let icon = null;
    if (crmModal && !crmModal.classList.contains('hidden')) {
        drawer = crmModal.querySelector('#advanced-drawer');
        icon = crmModal.querySelector('#advanced-icon');
    } else if (productModal && !productModal.classList.contains('hidden')) {
        drawer = productModal.querySelector('.tm-product-advanced-drawer');
        icon = document.getElementById('product-detail-advanced-icon');
    }
    if (!drawer || !icon) return;
    const willOpen = !drawer.classList.contains('open');
    drawer.classList.toggle('open');
    if (drawer.classList.contains('tm-product-advanced-drawer')) {
        drawer.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
    }
    icon.classList.toggle('ph-caret-down');
    icon.classList.toggle('ph-caret-up');
};

window.openProductUnitModal = function() {
    const modal = document.getElementById('product-unit-modal');
    const baseInput = document.getElementById('detail-product-base-unit');
    const base = (baseInput && baseInput.value.trim()) || '件';
    const prod = currentProduct || window.currentProduct;
    let conversions = [];
    if (prod && Array.isArray(prod.unitConversions) && prod.unitConversions.length) {
        conversions = prod.unitConversions.map(c => ({ unit: c.unit, perBase: c.perBase }));
    } else {
        conversions = [{ unit: '', perBase: '' }];
    }
    conversions = conversions.slice(0, MAX_UNIT_CONVERSION_ROWS);
    if (!conversions.length) conversions = [{ unit: '', perBase: '' }];
    paintUnitModalRows(conversions, base);
    if (modal) modal.classList.remove('hidden');
};

window.closeProductUnitModal = function() {
    const modal = document.getElementById('product-unit-modal');
    if (modal) modal.classList.add('hidden');
};

window.openAuditUnitModal = function() {
    const modal = document.getElementById('audit-unit-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeAuditUnitModal = function() {
    const modal = document.getElementById('audit-unit-modal');
    if (modal) modal.classList.add('hidden');
};

window.openDashboardUnitModal = function() {
    const modal = document.getElementById('dashboard-unit-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeDashboardUnitModal = function() {
    const modal = document.getElementById('dashboard-unit-modal');
    if (modal) modal.classList.add('hidden');
};

window.openUnitModal = window.openProductUnitModal;
window.closeUnitModal = window.closeProductUnitModal;

window.openWarehouseDrawer = function() {
    console.log('=== openWarehouseDrawer 被调用 ===');
    const drawer = document.getElementById('warehouse-drawer');
    if (drawer) {
        drawer.classList.remove('hidden');
    }
};

window.closeWarehouseDrawer = function() {
    console.log('=== closeWarehouseDrawer 被调用 ===');
    const drawer = document.getElementById('warehouse-drawer');
    if (drawer) {
        drawer.classList.add('hidden');
    }
};

window.saveWarehouse = function() {
    console.log('=== saveWarehouse 被调用 ===');
    const nameInput = document.getElementById('new-warehouse-name');
    const locationInput = document.getElementById('new-warehouse-location');
    if (nameInput && locationInput) {
        alert('仓库 "' + nameInput.value + '" 已保存！');
        nameInput.value = '';
        locationInput.value = '';
    }
};

function getProductWarningStock(p) {
    if (typeof p.warning_stock === 'number') return p.warning_stock;
    return 200;
}

function buildOutOfStockPurchaseGroups(productList) {
    const out = productList.filter(p => p.stockStatus === '缺货');
    return out.reduce((acc, p) => {
        const supplierName = p.supplier || '未知供应商';
        if (!acc[supplierName]) acc[supplierName] = [];
        const warning = getProductWarningStock(p);
        const unitCost = typeof p.purchasePrice === 'number' ? p.purchasePrice : 0;
        const suggest = Math.max(0, Math.round(warning * 2 - p.stock));
        acc[supplierName].push({
            id: p.id,
            name: p.name,
            sku: p.sku,
            current: p.stock,
            warning,
            suggest,
            unitCost
        });
        return acc;
    }, {});
}

window.getProductCenterProductList = function() {
    return products;
};

window.getVisibleOutOfStockPurchaseGroups = function() {
    const hidden = window.purchaseSuggestionHiddenSuppliers || [];
    const raw = buildOutOfStockPurchaseGroups(products);
    const out = {};
    Object.keys(raw).forEach(k => {
        if (!hidden.includes(k)) out[k] = raw[k];
    });
    return out;
};

window.refreshPurchaseSuggestionModalContent = function() {
    const content = document.getElementById('purchase-suggestion-content');
    const modal = document.getElementById('purchase-suggestion-modal');
    if (!content || !modal || modal.classList.contains('hidden')) return;
    const mockDocNo = window.__poSuggestionMockNo || ('PO-MOCK-' + Date.now().toString(36).toUpperCase().slice(-6));
    window.__poSuggestionMockNo = mockDocNo;
    renderPurchaseSuggestionContent(content, window.getVisibleOutOfStockPurchaseGroups(), mockDocNo);
};

function renderPurchaseGenLoading(mockDocNo) {
    return `
        <div class="max-w-lg mx-auto py-10 px-4 space-y-8">
            <div class="text-center space-y-2">
                <p class="text-[10px] font-mono text-slate-400 tracking-widest">模拟单据号 · ${mockDocNo}</p>
                <h3 class="text-lg font-black text-slate-800 tracking-tight">正在生成进货单据</h3>
                <p class="text-xs text-slate-500" data-purchase-status>正在扫描产品库缺货 SKU…</p>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-brand-500 to-teal-400 rounded-full transition-all duration-500 ease-out w-0" data-purchase-progress style="width: 0%"></div>
            </div>
            <ul class="space-y-3 text-xs text-slate-600">
                <li class="flex items-center gap-3 transition-opacity duration-300" data-purchase-step="0"><span class="purchase-step-icon w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><i class="ph ph-magnifying-glass text-slate-400"></i></span><span>匹配库存状态为「缺货」的产品</span></li>
                <li class="flex items-center gap-3 opacity-40 transition-opacity duration-300" data-purchase-step="1"><span class="purchase-step-icon w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><i class="ph ph-truck text-slate-400"></i></span><span>按主供应商拆分为多张进货清单</span></li>
                <li class="flex items-center gap-3 opacity-40 transition-opacity duration-300" data-purchase-step="2"><span class="purchase-step-icon w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><i class="ph ph-receipt text-slate-400"></i></span><span>汇总建议采购量与预估成本</span></li>
            </ul>
        </div>
    `;
}

function renderPurchaseSuggestionContent(container, groupedBySupplier, mockDocNo) {
    const entries = Object.entries(groupedBySupplier);
    if (!entries.length) {
        const rawCount = Object.keys(buildOutOfStockPurchaseGroups(products)).length;
        const hidden = (window.purchaseSuggestionHiddenSuppliers || []).length;
        const msg = rawCount > 0 && hidden > 0
            ? '<p class="text-xs text-slate-400 mt-2">缺货建议已全部处理或已移除；可在供应商管理中查看已生成的进货单据。</p>'
            : '<p class="text-xs text-slate-400 mt-2">无需生成进货单据；库存健康时可关闭本窗口。</p>';
        container.innerHTML = `
            <div class="text-center py-16 px-6">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-500">
                    <i class="ph ph-check-circle text-3xl"></i>
                </div>
                <p class="text-sm font-bold text-slate-700">当前无可展示的进货建议</p>
                ${msg}
            </div>
        `;
        return;
    }

    let html = `
        <div class="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">模拟预览</p>
                <p class="text-sm font-black text-slate-800">按供应商汇总的缺货补货单</p>
                <p class="text-[10px] font-mono text-slate-400 mt-1">单据号 ${mockDocNo} · 共 ${entries.length} 家供应商</p>
            </div>
            <div class="flex items-center gap-2 text-[10px] font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl w-fit">
                <i class="ph ph-info"></i> 演示数据 · 未调用后端
            </div>
        </div>
    `;

    entries.forEach(([supplier, rows]) => {
        let supplierTotal = 0;
        html += `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex flex-wrap items-center justify-between gap-3">
                <div class="min-w-0">
                    <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <i class="ph ph-storefront text-brand-500"></i> ${supplier}
                    </h3>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${rows.length} 个缺货 SKU</span>
                </div>
                <div class="flex flex-wrap gap-2 shrink-0">
                    <button type="button" onclick='window.openPurchaseOrderFormFromSuggestion(${JSON.stringify(supplier)})' class="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black shadow-md hover:bg-slate-800 transition active:scale-95 flex items-center gap-1.5">
                        <i class="ph ph-file-plus"></i> 生成进货单
                    </button>
                    <button type="button" onclick='window.removeSupplierPurchaseSuggestion(${JSON.stringify(supplier)})' class="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-[10px] font-bold hover:bg-red-50 hover:text-risk-high hover:border-red-100 transition">
                        删除本组
                    </button>
                </div>
            </div>
            <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-50/50 text-[10px] text-slate-400 font-black uppercase tracking-tighter border-b border-slate-100">
                        <tr>
                            <th class="px-6 py-4">产品名 (SKU)</th>
                            <th class="px-6 py-4 text-right">库存 / 预警</th>
                            <th class="px-6 py-4 text-right">建议采购</th>
                            <th class="px-6 py-4 text-right">预估小计 (进价)</th>
                        </tr>
                    </thead>
                    <tbody class="text-xs divide-y divide-slate-50">
        `;
        rows.forEach(product => {
            const subtotal = product.suggest * product.unitCost;
            supplierTotal += subtotal;
            html += `
                        <tr>
                            <td class="px-6 py-4">
                                <div>
                                    <p class="font-bold text-slate-800">${product.name}</p>
                                    <p class="text-[10px] text-slate-400 font-mono">SKU: ${product.sku}</p>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <span class="font-mono font-bold text-risk-high">${product.current}</span>
                                <span class="text-slate-300"> / </span>
                                <span class="font-mono text-slate-500">${product.warning}</span>
                                <span class="ml-2 inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-50 text-risk-high">缺货</span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <input type="number" value="${product.suggest}" min="0" class="w-20 px-2 py-1 border border-slate-200 rounded text-xs text-right">
                            </td>
                            <td class="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                ¥${subtotal.toFixed(2)}
                            </td>
                        </tr>
            `;
        });
        html += `
                    </tbody>
                </table>
            </div>
            <div class="md:hidden space-y-4 p-4">
        `;
        rows.forEach(product => {
            const subtotal = product.suggest * product.unitCost;
            html += `
                <div class="border border-slate-100 rounded-xl p-4">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <i class="ph ph-package text-xl"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-bold text-slate-800 truncate">${product.name}</p>
                            <p class="text-[10px] text-slate-400 font-mono">SKU: ${product.sku}</p>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-slate-500">库存 / 预警</span>
                            <span class="font-mono font-bold text-risk-high">${product.current}<span class="text-slate-300 font-normal"> / </span><span class="text-slate-500">${product.warning}</span></span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-slate-500">建议采购</span>
                            <span class="font-mono font-bold text-slate-800">${product.suggest}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-slate-500">预估小计</span>
                            <span class="font-mono font-bold text-slate-900">¥${subtotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `
            </div>
            <div class="px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
                <span class="text-sm font-bold text-slate-800">本供应商小计</span>
                <span class="font-mono font-bold text-slate-900">¥${supplierTotal.toFixed(2)}</span>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}

window.openPurchaseSuggestionModal = function() {
    const modal = document.getElementById('purchase-suggestion-modal');
    const content = document.getElementById('purchase-suggestion-content');
    if (!modal || !content) return;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const mockDocNo = 'PO-MOCK-' + Date.now().toString(36).toUpperCase().slice(-6);

    content.innerHTML = renderPurchaseGenLoading(mockDocNo);

    const setProgress = pct => {
        const bar = content.querySelector('[data-purchase-progress]');
        if (bar) bar.style.width = pct + '%';
    };
    const setStatus = text => {
        const el = content.querySelector('[data-purchase-status]');
        if (el) el.textContent = text;
    };
    const stepIcons = ['ph-magnifying-glass', 'ph-truck', 'ph-receipt'];
    const highlightStep = idx => {
        content.querySelectorAll('[data-purchase-step]').forEach((li, i) => {
            li.classList.toggle('opacity-40', i > idx);
            const iconWrap = li.querySelector('.purchase-step-icon');
            if (!iconWrap) return;
            iconWrap.className = 'purchase-step-icon w-6 h-6 rounded-full flex items-center justify-center shrink-0';
            if (i < idx) {
                iconWrap.classList.add('bg-teal-500', 'text-white');
                iconWrap.innerHTML = '<i class="ph-bold ph-check"></i>';
            } else if (i === idx) {
                iconWrap.classList.add('bg-brand-500', 'text-white');
                iconWrap.innerHTML = `<i class="ph ${stepIcons[i]}"></i>`;
            } else {
                iconWrap.classList.add('bg-slate-100');
                iconWrap.innerHTML = `<i class="ph ${stepIcons[i]} text-slate-400"></i>`;
            }
        });
    };

    requestAnimationFrame(() => {
        setProgress(18);
        highlightStep(0);
    });

    setTimeout(() => {
        setStatus('正在按主供应商聚合缺货行…');
        setProgress(48);
        highlightStep(1);
    }, 420);

    setTimeout(() => {
        setStatus('正在生成模拟进货单据与成本汇总…');
        setProgress(88);
        highlightStep(2);
    }, 820);

    setTimeout(() => {
        setProgress(100);
        window.__poSuggestionMockNo = mockDocNo;
        const grouped = window.getVisibleOutOfStockPurchaseGroups();
        renderPurchaseSuggestionContent(content, grouped, mockDocNo);
    }, 1180);
};

window.closePurchaseSuggestionModal = function() {
    const modal = document.getElementById('purchase-suggestion-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    document.body.style.overflow = '';
};

window.savePurchaseOrder = function() {
    window.closePurchaseSuggestionModal();
    if (typeof showToast === 'function') {
        showToast('已关闭建议窗口');
    }
};

window.closeCostAnalysis = function() {
    console.log('=== closeCostAnalysis 被调用 ===');
    const modal = document.getElementById('cost-analysis-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

window.closeWorkshopModal = function() {
    console.log('=== closeWorkshopModal 被调用 ===');
    const modal = document.getElementById('workshop-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

window.closeClearanceModal = function() {
    console.log('=== closeClearanceModal 被调用 ===');
    const modal = document.getElementById('clearance-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

window.openCategoryModal = function() {
    console.log('=== openCategoryModal 被调用 ===');
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
};

window.closeCategoryModal = function() {
    console.log('=== closeCategoryModal 被调用 ===');
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// 点击外部关闭下拉菜单
document.addEventListener('click', function(e) {
    if (!e.target.closest('#category-filter') && 
        !e.target.closest('#supplier-filter') && 
        !e.target.closest('#stock-filter')) {
        document.querySelectorAll('[id$="-dropdown"]').forEach(d => {
            d.classList.add('hidden');
            // 重置箭头图标
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

console.log('=== product-center.js 所有函数已暴露到window ===');
