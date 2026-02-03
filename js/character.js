// 全局变量：当前登录用户（从localStorage获取）
const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// 角色管理功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化新角色表单
    initNewCharacterForm();
    
    // 初始化角色页面
    initCharacterPage();
    
    // 初始化角色仪表盘
    initCharacterDashboard();
});

// 初始化新角色表单
function initNewCharacterForm() {
    const newCharacterForm = document.getElementById('newCharacterForm');
    if (newCharacterForm) {
        // 初始化技能列表
        initSkillsList();
        
        // 初始化属性修正值计算
        initAbilityScoreCalculation();
        
        // 表单提交处理
        newCharacterForm.addEventListener('submit', function(event) {
            event.preventDefault();
            handleCreateCharacter();
        });
    }
}

// 初始化技能列表
async function initSkillsList() {
    try {
        const skills = await db.getSkills();
        // 修复：先判断newCharacterForm是否存在，避免报错
        const newCharacterForm = document.getElementById('newCharacterForm');
        if (!newCharacterForm) return;
        
        const skillsContainer = newCharacterForm.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-4');
        
        if (skills && skills.length > 0 && skillsContainer) {
            skills.forEach(skill => {
                const skillDiv = document.createElement('div');
                skillDiv.className = 'flex items-center space-x-2';
                
                const skillLabel = document.createElement('label');
                skillLabel.className = 'flex-1 text-sm font-medium text-gray-700';
                skillLabel.textContent = skill.name;
                
                const skillCheckbox = document.createElement('input');
                skillCheckbox.type = 'checkbox';
                skillCheckbox.id = `skill-${skill.id}`;
                skillCheckbox.name = `skills[${skill.id}]`;
                skillCheckbox.className = 'h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded';
                
                const skillModifier = document.createElement('span');
                skillModifier.className = 'text-sm text-gray-500';
                skillModifier.textContent = `(${skill.ability_score.substring(0, 3).toUpperCase()})`;
                
                skillLabel.prepend(skillCheckbox); // 把checkbox放在文字前面
                skillLabel.appendChild(skillModifier);
                skillDiv.appendChild(skillLabel);
                
                skillsContainer.appendChild(skillDiv);
            });
        }
    } catch (error) {
        console.error('加载技能列表错误:', error);
        showNotification('加载技能列表失败', 'error');
    }
}

// 初始化属性修正值计算
function initAbilityScoreCalculation() {
    const abilityScores = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    
    abilityScores.forEach(score => {
        const input = document.getElementById(score);
        const modifierElement = document.getElementById(`${score}Modifier`);
        
        if (input && modifierElement) {
            // 初始计算
            updateModifier(input, modifierElement);
            
            // 监听输入变化
            input.addEventListener('input', function() {
                updateModifier(input, modifierElement);
            });
        }
    });
}

// 更新属性修正值显示
function updateModifier(input, modifierElement) {
    const value = parseInt(input.value) || 10;
    const modifier = calculateModifier(value);
    modifierElement.textContent = formatModifier(modifier);
}

// 处理创建角色
async function handleCreateCharacter() {
    if (!currentUser) {
        showNotification('请先登录', 'error');
        return;
    }
    
    // 获取表单数据
    const newCharacterForm = document.getElementById('newCharacterForm');
    if (!newCharacterForm) return;
    
    const formData = new FormData(newCharacterForm);
    const characterData = {
        userId: currentUser.id,
        name: formData.get('name'),
        race: formData.get('race'),
        class: formData.get('class'),
        level: parseInt(formData.get('level')) || 1,
        background: formData.get('background'),
        alignment: formData.get('alignment'),
        experience: parseInt(formData.get('experience')) || 0,
        strength: parseInt(formData.get('strength')) || 10,
        dexterity: parseInt(formData.get('dexterity')) || 10,
        constitution: parseInt(formData.get('constitution')) || 10,
        intelligence: parseInt(formData.get('intelligence')) || 10,
        wisdom: parseInt(formData.get('wisdom')) || 10,
        charisma: parseInt(formData.get('charisma')) || 10,
        hitPoints: parseInt(formData.get('hitPoints')) || 10,
        hitDice: formData.get('hitDice') || '1d8',
        armorClass: parseInt(formData.get('armorClass')) || 10,
        speed: parseInt(formData.get('speed')) || 30,
        skills: getSelectedSkills(),
        features: formData.get('features'),
        equipment: formData.get('equipment'),
        backgroundStory: formData.get('backgroundStory')
    };
    
    try {
        // 显示加载状态
        const submitButton = newCharacterForm.querySelector('button[type="submit"]');
        if (!submitButton) return;
        
        const originalText = submitButton.textContent;
        showLoading(submitButton);
        
        // 创建角色
        const result = await db.createCharacter(characterData);
        if (result.success && result.characterId) {
            showNotification('角色创建成功！', 'success');
            setTimeout(function() {
                window.location.href = `character.html?id=${result.characterId}`;
            }, 1000);
        } else {
            throw new Error(result.error || '创建角色失败');
        }
    } catch (error) {
        showNotification('创建角色失败', 'error');
        console.error('创建角色错误:', error);
    } finally {
        // 恢复按钮状态
        const submitButton = newCharacterForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = submitButton.dataset.originalText || '创建角色';
        }
    }
}

// 获取选中的技能
function getSelectedSkills() {
    const newCharacterForm = document.getElementById('newCharacterForm');
    if (!newCharacterForm) return [];
    
    const checkboxes = newCharacterForm.querySelectorAll('input[type="checkbox"][name^="skills["]');
    const selectedSkills = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const match = checkbox.name.match(/\[(\d+)\]/);
            if (match && match[1]) {
                const skillId = parseInt(match[1]);
                selectedSkills.push(skillId);
            }
        }
    });
    
    return selectedSkills;
}

// 初始化角色页面
function initCharacterPage() {
    if (window.location.pathname.endsWith('character.html')) {
        // 获取角色ID
        const urlParams = new URLSearchParams(window.location.search);
        const characterId = urlParams.get('id');
        
        if (characterId) {
            loadCharacter(characterId);
        } else {
            showNotification('无效的角色ID', 'error');
            setTimeout(function() {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
        
        // 初始化编辑和删除按钮
        initCharacterActions();
    }
}

// 加载角色信息
async function loadCharacter(characterId) {
    try {
        // 显示加载状态
        const mainContent = document.querySelector('section.pt-24.pb-16');
        if (!mainContent) return;
        
        const originalContent = mainContent.innerHTML;
        mainContent.innerHTML = '<div class="text-center py-12"><div class="loading-spinner mx-auto"></div><p class="mt-4 text-gray-600">正在加载角色信息...</p></div>';
        
        const result = await db.getCharacterById(characterId);
        if (!result) {
            throw new Error('角色不存在');
        }
        
        const character = result;
        
        // 检查角色是否属于当前用户
        if (character.user_id !== currentUser.id) {
            showNotification('你没有权限查看这个角色', 'error');
            setTimeout(function() {
                window.location.href = 'dashboard.html';
            }, 1000);
            mainContent.innerHTML = originalContent;
            return;
        }
        
        // 更新角色信息显示
        updateCharacterDisplay(character);
    } catch (error) {
        showNotification('加载角色信息失败', 'error');
        console.error('加载角色错误:', error);
        
        const mainContent = document.querySelector('section.pt-24.pb-16');
        if (mainContent) {
            mainContent.innerHTML = '<div class="text-center py-12"><p class="text-red-600">加载角色失败，请返回重试</p><a href="dashboard.html" class="mt-4 inline-block bg-primary text-white px-4 py-2 rounded">返回仪表盘</a></div>';
        }
        
        setTimeout(function() {
            window.location.href = 'dashboard.html';
        }, 3000);
    }
}

// 更新角色信息显示
function updateCharacterDisplay(character) {
    // 基本信息
    if (document.getElementById('characterName')) {
        document.getElementById('characterName').textContent = character.name;
    }
    if (document.getElementById('characterRaceClass')) {
        document.getElementById('characterRaceClass').textContent = `${character.race} / ${character.class}`;
    }
    if (document.getElementById('characterLevel')) {
        document.getElementById('characterLevel').textContent = `等级 ${character.level}`;
    }
    if (document.getElementById('characterAlignment')) {
        document.getElementById('characterAlignment').textContent = character.alignment || '无阵营';
    }
    
    // 属性值
    updateAbilityDisplay('strength', character.strength);
    updateAbilityDisplay('dexterity', character.dexterity);
    updateAbilityDisplay('constitution', character.constitution);
    updateAbilityDisplay('intelligence', character.intelligence);
    updateAbilityDisplay('wisdom', character.wisdom);
    updateAbilityDisplay('charisma', character.charisma);
    
    // 战斗信息
    if (document.getElementById('hitPointsValue')) {
        document.getElementById('hitPointsValue').textContent = character.hit_points;
    }
    if (document.getElementById('hitDiceValue')) {
        document.getElementById('hitDiceValue').textContent = character.hit_dice;
    }
    if (document.getElementById('armorClassValue')) {
        document.getElementById('armorClassValue').textContent = character.armor_class;
    }
    if (document.getElementById('speedValue')) {
        document.getElementById('speedValue').textContent = character.speed;
    }
    if (document.getElementById('experienceValue')) {
        document.getElementById('experienceValue').textContent = character.experience;
    }
    
    // 背景故事和其他信息
    if (document.getElementById('backgroundStoryContent')) {
        document.getElementById('backgroundStoryContent').textContent = character.background_story || '暂无背景故事';
    }
    if (document.getElementById('featuresContent')) {
        document.getElementById('featuresContent').textContent = character.features || '暂无特性与专长';
    }
    if (document.getElementById('equipmentContent')) {
        document.getElementById('equipmentContent').textContent = character.equipment || '暂无装备';
    }
    
    // 技能列表
    loadCharacterSkills(character.skills);
}

// 辅助函数：更新属性显示
function updateAbilityDisplay(ability, value) {
    const valueElement = document.getElementById(`${ability}Value`);
    const modifierElement = document.getElementById(`${ability}Modifier`);
    
    if (valueElement) {
        valueElement.textContent = value;
    }
    if (modifierElement) {
        modifierElement.textContent = formatModifier(calculateModifier(value));
    }
}

// 加载角色技能
async function loadCharacterSkills(skillsJson) {
    try {
        const skillIds = typeof skillsJson === 'string' ? JSON.parse(skillsJson) : skillsJson || [];
        const skills = await db.getSkills();
        const skillsList = document.getElementById('skillsList');
        
        if (!skillsList) return;
        skillsList.innerHTML = '';
        
        if (skills && skills.length > 0) {
            skills.forEach(skill => {
                if (skillIds.includes(skill.id)) {
                    const skillDiv = document.createElement('div');
                    skillDiv.className = 'flex justify-between items-center py-1';
                    
                    const skillName = document.createElement('span');
                    skillName.textContent = skill.name;
                    
                    // 修复：从页面获取属性值，而非输入框
                    const abilityValue = document.getElementById(`${skill.ability_score}Value`)?.textContent || 10;
                    const modifier = calculateModifier(parseInt(abilityValue));
                    
                    const skillModifier = document.createElement('span');
                    skillModifier.className = 'bg-gray-100 px-2 py-1 rounded text-sm';
                    skillModifier.textContent = formatModifier(modifier);
                    
                    skillDiv.appendChild(skillName);
                    skillDiv.appendChild(skillModifier);
                    skillsList.appendChild(skillDiv);
                }
            });
        }
    } catch (error) {
        console.error('加载技能列表错误:', error);
    }
}

// 初始化角色操作按钮
function initCharacterActions() {
    const editButton = document.getElementById('editCharacterButton');
    const deleteButton = document.getElementById('deleteCharacterButton');
    
    if (editButton) {
        editButton.addEventListener('click', function() {
            // 这里可以添加编辑角色的功能
            showNotification('编辑功能将在后续版本中实现', 'info');
        });
    }
    
    if (deleteButton) {
        deleteButton.addEventListener('click', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const characterId = urlParams.get('id');
            
            if (characterId) {
                confirmDeleteCharacter(characterId);
            }
        });
    }
}

// 确认删除角色（补全所有缺失的闭合代码）
function confirmDeleteCharacter(characterId) {
    createModal(
        '确认删除角色',
        '你确定要删除这个角色吗？这个操作无法撤销。',
        [
            {
                text: '取消',
                class: 'bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors',
                action: function() {
                    this.closest('.modal').classList.remove('active');
                }
            },
            {
                text: '删除',
                class: 'bg-red-600 text-white hover:bg-red-700 transition-colors',
                action: async function() {
                    try {
                        const result = await db.deleteCharacter(characterId);
                        if (result.success) {
                            showNotification('角色删除成功', 'success');
                            setTimeout(function() {
                                window.location.href = 'dashboard.html';
                            }, 1000);
                        } else {
                            throw new Error(result.error || '删除失败');
                        }
                    } catch (error) {
                        showNotification('删除角色失败', 'error');
                        console.error('删除角色错误:', error);
                    }
                    this.closest('.modal').classList.remove('active');
                }
            }
        ]
    );
}

// 初始化角色仪表盘
function initCharacterDashboard() {
    if (window.location.pathname.endsWith('dashboard.html') && currentUser) {
        loadUserCharacters();
    }
}

// 加载用户角色列表
async function loadUserCharacters() {
    try {
        const charactersContainer = document.getElementById('charactersContainer');
        if (!charactersContainer) return;
        
        // 显示加载状态
        charactersContainer.innerHTML = '<div class="text-center py-12"><div class="loading-spinner mx-auto"></div><p class="mt-4 text-gray-600">正在加载你的角色...</p></div>';
        
        const characters = await db.getUserCharacters(currentUser.id);
        
        if (characters && characters.length > 0) {
            charactersContainer.innerHTML = '';
            characters.forEach(character => {
                const characterCard = createCharacterCard(character);
                charactersContainer.appendChild(characterCard);
            });
        } else {
            charactersContainer.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-500">你还没有创建任何角色</p>
                    <a href="new-character.html" class="mt-4 inline-block bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors">
                        创建第一个角色
                    </a>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载角色列表错误:', error);
        const charactersContainer = document.getElementById('charactersContainer');
        if (charactersContainer) {
            charactersContainer.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-red-600">加载角色失败，请重试</p>
                    <button onclick="loadUserCharacters()" class="mt-4 inline-block bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors">
                        重新加载
                    </button>
                </div>
            `;
        }
        showNotification('加载角色列表失败', 'error');
    }
}

// 创建角色卡片
function createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow';
    
    card.innerHTML = `
        <h3 class="text-xl font-bold mb-2">${character.name}</h3>
        <p class="text-gray-600 mb-4">${character.race} / ${character.class} (等级 ${character.level})</p>
        <div class="flex space-x-4">
            <a href="character.html?id=${character.id}" class="text-primary hover:underline">查看详情</a>
            <button class="text-red-600 hover:text-red-800 delete-character-btn" data-id="${character.id}">删除</button>
        </div>
    `;
    
    // 添加删除按钮事件
    const deleteBtn = card.querySelector('.delete-character-btn');
    deleteBtn.addEventListener('click', () => {
        confirmDeleteCharacter(character.id);
    });
    
    return card;
}

// 工具函数：计算属性修正值
function calculateModifier(score) {
    return Math.floor((score - 10) / 2);
}

// 工具函数：格式化修正值显示
function formatModifier(modifier) {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

// 工具函数：显示加载状态
function showLoading(button) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = '<span class="loading-spinner-sm mr-2"></span> 处理中...';
}

// 工具函数：显示通知
function showNotification(message, type = 'info') {
    // 移除已存在的通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
    
    // 设置通知样式
    if (type === 'success') {
        notification.classList.add('bg-green-500', 'text-white');
    } else if (type === 'error') {
        notification.classList.add('bg-red-500', 'text-white');
    } else if (type === 'info') {
        notification.classList.add('bg-blue-500', 'text-white');
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // 3秒后隐藏通知
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// 工具函数：创建模态框
function createModal(title, content, buttons = []) {
    // 移除已存在的模态框
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 创建模态框容器
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal fixed inset-0 bg-black/50 flex items-center justify-center z-50 opacity-0 pointer-events-none transition-opacity duration-300';
    
    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform scale-95 transition-transform duration-300';
    
    // 模态框头部
    const modalHeader = document.createElement('div');
    modalHeader.className = 'px-6 py-4 border-b border-gray-200';
    modalHeader.innerHTML = `<h3 class="text-lg font-bold">${title}</h3>`;
    
    // 模态框内容
    const modalBody = document.createElement('div');
    modalBody.className = 'px-6 py-4';
    modalBody.textContent = content;
    
    // 模态框底部（按钮）
    const modalFooter = document.createElement('div');
    modalFooter.className = 'px-6 py-4 border-t border-gray-200 flex justify-end space-x-3';
    
    // 添加按钮
    buttons.forEach(btnConfig => {
        const button = document.createElement('button');
        button.className = `px-4 py-2 rounded ${btnConfig.class}`;
        button.textContent = btnConfig.text;
        
        if (btnConfig.action) {
            button.addEventListener('click', btnConfig.action);
        }
        
        modalFooter.appendChild(button);
    });
    
    // 组装模态框
    modal.appendChild(modalHeader);
    modal.appendChild(modalBody);
    modal.appendChild(modalFooter);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    // 显示模态框
    setTimeout(() => {
        modalOverlay.classList.add('active', 'opacity-100');
        modal.classList.add('scale-100');
    }, 10);
    
    // 点击遮罩关闭模态框
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active', 'opacity-100');
            modal.classList.remove('scale-100');
            setTimeout(() => {
                modalOverlay.remove();
            }, 300);
        }
    });
    
    return modalOverlay;
}