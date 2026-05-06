/**
 * 登录 / 注册页交互：密码显隐、验证码演示、商户类型写入 sessionStorage
 */
(function () {
    'use strict';

    function $(id) {
        return document.getElementById(id);
    }

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
            sessionStorage.setItem('tm_register_merchant_type', merchant.value);
        }
        sessionStorage.setItem('tm_auth_username', $('reg-username').value.trim());
        alert('注册成功（演示），将跳转登录页');
        window.location.href = './login.html';
    };
})();
