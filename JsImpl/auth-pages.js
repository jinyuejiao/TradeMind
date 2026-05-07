/**
 * 登录 / 注册页交互：密码显隐、验证码演示、租户商户类型持久化与登录页展示
 * 存储键 tm_tenant_merchant_type（localStorage）：注册租户所选类型，登录页与主站共用
 */
(function () {
    'use strict';

    var STORAGE_TENANT_MERCHANT = 'tm_tenant_merchant_type';
    var STORAGE_LEGACY_REGISTER = 'tm_register_merchant_type';

    var MERCHANT_LABELS = {
        WHOLESALE: '批发商户',
        FOREIGN: '外贸商户',
        ECOM: '电商商户',
        FACTORY: '工贸一体商户'
    };

    /** 登录页按类型的提示（展示与简单「限制/合规」说明，可对接后端策略） */
    var MERCHANT_LOGIN_HINTS = {
        WHOLESALE: '登录后将进入批发版工作台与菜单。',
        FOREIGN: '外贸通道：请使用企业认证租户账号登录；部分功能仅对外贸租户开放。',
        ECOM: '电商通道：请以店铺/运营主账号登录；界面侧重 SKU 与订单。',
        FACTORY: '工贸通道：请以生产或供销关联账号登录；界面侧重 BOM/工单相关入口。'
    };

    function $(id) {
        return document.getElementById(id);
    }

    function tmGetStoredTenantMerchantType() {
        try {
            var v = localStorage.getItem(STORAGE_TENANT_MERCHANT) || sessionStorage.getItem(STORAGE_LEGACY_REGISTER);
            return v ? String(v).toUpperCase() : null;
        } catch (e) {
            return null;
        }
    }

    /** 登录/注册页应用主题令牌（与主站 theme.css 一致） */
    window.tmApplyAuthMerchantSkin = function (code) {
        if (!code) {
            document.documentElement.setAttribute('data-merchant-type', 'WHOLESALE');
            return;
        }
        document.documentElement.setAttribute('data-merchant-type', String(code).toUpperCase());
    };

    function persistTenantMerchantType(code) {
        if (!code) return;
        try {
            localStorage.setItem(STORAGE_TENANT_MERCHANT, String(code).toUpperCase());
            sessionStorage.setItem(STORAGE_LEGACY_REGISTER, String(code).toUpperCase());
        } catch (e) { /* ignore */ }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var body = document.body;
        if (body.classList.contains('auth-page-login')) {
            var code = tmGetStoredTenantMerchantType();
            if (code) {
                window.tmApplyAuthMerchantSkin(code);
                var banner = $('login-merchant-banner');
                if (banner) {
                    banner.hidden = false;
                    var label = MERCHANT_LABELS[code] || code;
                    banner.innerHTML = '<strong>租户通道</strong>：' + label + ' · 登录过程已按该类型切换视觉与说明';
                }
                var hint = $('login-merchant-hint');
                if (hint) {
                    var line = MERCHANT_LOGIN_HINTS[code];
                    if (line) {
                        hint.hidden = false;
                        hint.textContent = line;
                    }
                }
                var sub = $('login-subtitle');
                if (sub) {
                    sub.textContent = '商贸智脑 · ' + (MERCHANT_LABELS[code] || code) + ' 登录';
                }
            } else {
                window.tmApplyAuthMerchantSkin('WHOLESALE');
            }
        }
        if (body.classList.contains('auth-page-register')) {
            var sel = $('reg-merchant-type');
            if (sel) {
                var stored = tmGetStoredTenantMerchantType();
                var allowed = { WHOLESALE: 1, FOREIGN: 1, ECOM: 1, FACTORY: 1 };
                if (stored && allowed[stored]) {
                    sel.value = stored;
                }
                sel.addEventListener('change', function () {
                    window.tmApplyAuthMerchantSkin(sel.value || 'WHOLESALE');
                });
                window.tmApplyAuthMerchantSkin(sel.value || 'WHOLESALE');
            }
        }
    });

    window.tmTogglePassword = function (inputId, btn) {
        var input = $(inputId);
        if (!input || !btn) return;
        var ic = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            btn.setAttribute('aria-label', '隐藏密码');
            if (ic) {
                ic.classList.remove('ph-eye');
                ic.classList.add('ph-eye-slash');
            }
        } else {
            input.type = 'password';
            btn.setAttribute('aria-label', '显示密码');
            if (ic) {
                ic.classList.remove('ph-eye-slash');
                ic.classList.add('ph-eye');
            }
        }
    };

    var smsTimer = null;
    window.tmSendSmsCode = function (btn) {
        if (!btn || btn.disabled) return;
        var phone = $('reg-phone');
        if (phone && phone.value.trim().length < 11) {
            alert('请先填写有效手机号');
            phone.focus();
            return;
        }
        var sec = 60;
        btn.disabled = true;
        btn.textContent = sec + 's';
        smsTimer = setInterval(function () {
            sec--;
            if (sec <= 0) {
                clearInterval(smsTimer);
                smsTimer = null;
                btn.disabled = false;
                btn.textContent = '发送验证码';
                return;
            }
            btn.textContent = sec + 's';
        }, 1000);
        alert('演示环境：验证码已发送（模拟），未开通短信时可填写任意数字继续）');
    };

    window.tmLoginSubmit = function (ev) {
        var form = ev.target;
        if (form && typeof form.reportValidity === 'function' && !form.reportValidity()) {
            return;
        }
        ev.preventDefault();
        var u = $('login-username');
        var p = $('login-password');
        sessionStorage.setItem('tm_auth_username', u.value.trim());
        /* 演示：登录成功不带回服务端商户类型时，沿用本机已登记的租户类型 */
        var persisted = tmGetStoredTenantMerchantType();
        if (persisted) {
            persistTenantMerchantType(persisted);
        }
        window.location.href = './index.html';
    };

    window.tmRegisterSubmit = function (ev) {
        var form = ev.target;
        if (form && typeof form.reportValidity === 'function' && !form.reportValidity()) {
            return;
        }
        ev.preventDefault();
        var pwd = $('reg-password');
        var pwd2 = $('reg-password2');
        if (pwd.value !== pwd2.value) {
            alert('两次输入的密码不一致');
            pwd2.focus();
            return;
        }
        var merchant = $('reg-merchant-type');
        if (merchant && merchant.value) {
            persistTenantMerchantType(merchant.value);
        }
        sessionStorage.setItem('tm_auth_username', $('reg-username').value.trim());
        alert('注册成功（演示），将跳转登录页');
        window.location.href = './login.html';
    };
})();
