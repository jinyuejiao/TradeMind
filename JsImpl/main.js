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
    fetch('./modules/SmartOps/SmartOps.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('view-biz').innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading SmartOps:', error);
        });
}

function loadCRM() {
    fetch('./modules/crm/crm.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('view-crm').innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading CRM:', error);
        });
}

function loadProductCenter() {
    fetch('./modules/product-center/product-center.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('view-supply').innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading product center:', error);
        });
}

function loadSupplier() {
    fetch('./modules/supply-chain/supply-chain.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('view-supplier').innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading supplier:', error);
        });
}

// 页面加载时加载默认模块
window.onload = function() {
    loadDashboard();
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

// --- <用户订阅>语音逻辑 (修复版) ---
// 会员弹窗控制
function openMemberModal() { document.getElementById('member-modal').classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeMemberModal() { document.getElementById('member-modal').classList.add('hidden'); document.body.style.overflow = ''; }

// 品牌海报控制
function showPoster() { document.getElementById('poster-modal').classList.remove('hidden'); }
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
        link.download = `TradeMind-Invite-${USER_REF_CODE}.png`;
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

//  进行中单据：详情查看逻辑
function openOrderDetail(orderId) {
    document.getElementById('detail-order-id').innerText = orderId;
    const modal = document.getElementById('order-detail-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeOrderDetail() {
    const modal = document.getElementById('order-detail-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// 弹窗开关
function openAuditModal(name) { document.getElementById('audit-modal').classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeAuditModal() { document.getElementById('audit-modal').classList.add('hidden'); document.body.style.overflow = ''; }

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

function switchCustomerDetail(name, info) {
    const detailName = document.getElementById('crm-detail-name');
    if (detailName) {
        detailName.innerText = name;
    }
    showCrmDetail(name);
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

// 详情弹窗逻辑
function openProductDetail(mode) {
    document.getElementById('product-detail-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (mode === 'edit') {
        document.getElementById('detail-title').innerText = "产品详情编辑";
        document.getElementById('detail-sku').innerText = "SKU: DB-ICE-001";
    } else {
        document.getElementById('detail-title').innerText = "新增产品入库";
        document.getElementById('detail-sku').innerText = "AUTO-GENERATE";
    }
}
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
    const mapView = document.getElementById('sup-map-view');
    const listView = document.getElementById('sup-list-view');
    const btnMap = document.getElementById('btn-sup-map');
    const btnList = document.getElementById('btn-sup-list');

    if (mode === 'map') {
        // 显示/隐藏内容
        mapView.classList.remove('hidden');
        listView.classList.add('hidden');

        // 处理按钮状态
        btnMap.classList.add('active');
        btnList.classList.remove('active');

        // 修正颜色类名冲突 (清除 Tailwind 默认的灰色)
        btnMap.classList.remove('text-slate-400');
        btnList.classList.add('text-slate-400');
    } else {
        mapView.classList.add('hidden');
        listView.classList.remove('hidden');

        btnList.classList.add('active');
        btnMap.classList.remove('active');

        btnList.classList.remove('text-slate-400');
        btnMap.classList.add('text-slate-400');
    }
}

// --- 进货单详情弹窗 ---
function openPurchaseDetail(id) {
    document.getElementById('detail-purchase-id').innerText = id;
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