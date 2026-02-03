// Cloudflare D1数据库配置
const DATABASE_CONFIG = {
    // 请替换为你的Cloudflare D1数据库信息
    accountId: 'YOUR_CLOUDFLARE_ACCOUNT_ID',
    databaseId: 'YOUR_DATABASE_ID',
    apiToken: 'YOUR_API_TOKEN'
};

// 注册表单处理
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            handleRegister();
        });
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            handleLogin();
        });
    }
});

// 处理用户注册
async function handleRegister() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // 表单验证
    if (!username || !email || !password || !confirmPassword) {
        showNotification('请填写所有必填字段', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('两次输入的密码不一致', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('密码长度至少为6位', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showNotification('请同意服务条款和隐私政策', 'error');
        return;
    }
    
    try {
        // 显示加载状态
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        showLoading(submitButton);
        
        // 发送注册请求到Cloudflare Worker
        const response = await fetch('https://YOUR_WORKER_URL/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('注册成功！请登录', 'success');
            setTimeout(function() {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showNotification(data.error || '注册失败', 'error');
        }
    } catch (error) {
        showNotification('网络错误，请稍后重试', 'error');
        console.error('注册错误:', error);
    } finally {
        // 恢复按钮状态
        submitButton.textContent = originalText;
    }
}

// 处理用户登录
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // 表单验证
    if (!email || !password) {
        showNotification('请填写邮箱和密码', 'error');
        return;
    }
    
    try {
        // 显示加载状态
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        showLoading(submitButton);
        
        // 发送登录请求到Cloudflare Worker
        const response = await fetch('https://YOUR_WORKER_URL/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // 保存用户信息和token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showNotification('登录成功！', 'success');
            setTimeout(function() {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showNotification(data.error || '登录失败', 'error');
        }
    } catch (error) {
        showNotification('网络错误，请稍后重试', 'error');
        console.error('登录错误:', error);
    } finally {
        // 恢复按钮状态
        submitButton.textContent = originalText;
    }
}

// 验证用户token
async function verifyToken(token) {
    try {
        const response = await fetch('https://YOUR_WORKER_URL/verify-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('Token验证错误:', error);
        return false;
    }
}