// 全局变量
let currentUser = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化导航栏滚动效果
    initNavbarScroll();
    
    // 初始化用户菜单
    initUserMenu();
    
    // 检查用户是否已登录
    checkUserLogin();
    
    // 初始化密码切换功能
    initPasswordToggle();
});

// 导航栏滚动效果
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 10) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });
    }
}

// 初始化用户菜单
function initUserMenu() {
    const userMenuButton = document.getElementById('userMenuButton');
    const userMenu = document.getElementById('userMenu');
    
    if (userMenuButton && userMenu) {
        userMenuButton.addEventListener('click', function() {
            userMenu.classList.toggle('hidden');
        });
        
        // 点击菜单外部关闭菜单
        document.addEventListener('click', function(event) {
            if (!userMenuButton.contains(event.target) && !userMenu.contains(event.target)) {
                userMenu.classList.add('hidden');
            }
        });
    }
    
    // 初始化退出登录按钮
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault();
            logout();
        });
    }
}

// 检查用户是否已登录
function checkUserLogin() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        updateUsernameDisplay();
    } else {
        // 如果用户未登录，重定向到登录页面（除了登录和注册页面）
        const currentPage = window.location.pathname;
        if (currentPage !== '/login.html' && currentPage !== '/register.html') {
            window.location.href = 'login.html';
        }
    }
}

// 更新用户名显示
function updateUsernameDisplay() {
    const usernameElements = document.querySelectorAll('#usernameDisplay, #welcomeUsername');
    usernameElements.forEach(element => {
        if (element) {
            element.textContent = currentUser.username;
        }
    });
}

// 退出登录
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    window.location.href = 'login.html';
}

// 初始化密码切换功能
function initPasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // 切换图标
            const icon = togglePassword.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 3秒后移除通知
    setTimeout(function() {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(function() {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 计算属性修正值
function calculateModifier(score) {
    return Math.floor((score - 10) / 2);
}

// 格式化修正值显示
function formatModifier(modifier) {
    if (modifier >= 0) {
        return `+${modifier}`;
    } else {
        return `${modifier}`;
    }
}

// 生成模态框
function createModal(title, content, buttons = []) {
    // 创建模态框元素
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'modal-title';
    modalTitle.textContent = title;
    
    const modalClose = document.createElement('button');
    modalClose.className = 'modal-close';
    modalClose.innerHTML = '<i class="fas fa-times"></i>';
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(modalClose);
    
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = content;
    
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    // 添加按钮
    buttons.forEach(button => {
        const buttonElement = document.createElement('button');
        buttonElement.className = `px-4 py-2 rounded-lg font-medium ${button.class}`;
        buttonElement.textContent = button.text;
        buttonElement.addEventListener('click', button.action);
        modalFooter.appendChild(buttonElement);
    });
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modal.appendChild(modalContent);
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 关闭模态框的功能
    function closeModal() {
        modal.classList.remove('active');
        setTimeout(function() {
            document.body.removeChild(modal);
        }, 300);
    }
    
    modalClose.addEventListener('click', closeModal);
    
    // 点击模态框背景关闭
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // 按ESC键关闭
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
    
    // 显示模态框
    setTimeout(function() {
        modal.classList.add('active');
    }, 10);
    
    return modal;
}

// 加载动画
function showLoading(element) {
    element.innerHTML = '<div class="loading-spinner mx-auto"></div>';
}

// 停止加载动画
function hideLoading(element, content) {
    element.innerHTML = content;
}