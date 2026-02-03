// 全局变量
const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// 页面加载完成初始化
document.addEventListener('DOMContentLoaded', function() {
    initNewCharacterForm();
    initCharacterPage();
    initCharacterDashboard();
});

// ========== 新角色表单 ==========
function initNewCharacterForm() {
    const form = document.getElementById('newCharacterForm');
    if (!form) return;

    // 初始化技能列表
    initSkillsList();
    
    // 初始化属性计算
    initAbilityScoreCalculation();
    
    // 表单提交
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleCreateCharacter(form);
    });
}

async function initSkillsList() {
    try {
        const form = document.getElementById('newCharacterForm');
        const container = form?.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-4');
        if (!container) return;

        const skills = await db.getSkills();
        if (!skills || skills.length === 0) return;

        skills.forEach(skill => {
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-2';

            const label = document.createElement('label');
            label.className = 'flex-1 text-sm font-medium text-gray-700';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `skill-${skill.id}`;
            checkbox.name = `skills[${skill.id}]`;
            checkbox.className = 'h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded';

            const modifier = document.createElement('span');
            modifier.className = 'text-sm text-gray-500';
            modifier.textContent = `(${skill.ability_score.substring(0, 3).toUpperCase()})`;

            label.prepend(checkbox);
            label.appendChild(modifier);
            div.appendChild(label);
            container.appendChild(div);
        });
    } catch (err) {
        console.error("加载技能失败:", err);
        showNotification('加载技能列表失败', 'error');
    }
}

function initAbilityScoreCalculation() {
    const scores = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    
    scores.forEach(score => {
        const input = document.getElementById(score);
        const modifier = document.getElementById(`${score}Modifier`);
        if (input && modifier) {
            updateModifier(input, modifier);
            input.addEventListener('input', () => updateModifier(input, modifier));
        }
    });
}

function updateModifier(input, modifierEl) {
    const value = parseInt(input.value) || 10;
    const mod = Math.floor((value - 10) / 2);
    modifierEl.textContent = mod >= 0 ? `+${mod}` : mod;
}

async function handleCreateCharacter(form) {
    if (!currentUser) {
        showNotification('请先登录', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner-sm mr-2"></span> 创建中...';

    try {
        const formData = new FormData(form);
        const data = {
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
            skills: getSelectedSkills(form),
            features: formData.get('features'),
            equipment: formData.get('equipment'),
            backgroundStory: formData.get('backgroundStory')
        };

        const characterId = await db.createCharacter(data);
        showNotification('角色创建成功！', 'success');
        setTimeout(() => {
            window.location.href = `character.html?id=${characterId}`;
        }, 1000);
    } catch (err) {
        showNotification('创建角色失败', 'error');
        console.error(err);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function getSelectedSkills(form) {
    const checkboxes = form.querySelectorAll('input[type="checkbox"][name^="skills["]:checked');
    return Array.from(checkboxes).map(checkbox => {
        return parseInt(checkbox.name.match(/\[(\d+)\]/)[1]);
    });
}

// ========== 角色详情页 ==========
function initCharacterPage() {
    if (!window.location.pathname.endsWith('character.html')) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id || !currentUser) {
        showNotification('无效的角色ID', 'error');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
        return;
    }

    loadCharacter(id);
    initCharacterActions();
}

async function loadCharacter(id) {
    const mainContent = document.querySelector('section.pt-24.pb-16');
    const originalContent = mainContent?.innerHTML;
    
    if (mainContent) {
        mainContent.innerHTML = '<div class="text-center py-12"><div class="loading-spinner mx-auto"></div><p class="mt-4 text-gray-600">正在加载...</p></div>';
    }

    try {
        const character = await db.getCharacterById(id);
        
        if (!character || character.user_id !== currentUser.id) {
            throw new Error("角色不存在或无权限");
        }

        updateCharacterDisplay(character);
    } catch (err) {
        showNotification('加载角色失败', 'error');
        console.error(err);
        if (mainContent) {
            mainContent.innerHTML = '<div class="text-center py-12"><p class="text-red-600">加载失败</p><a href="dashboard.html" class="mt-4 bg-primary text-white px-4 py-2 rounded">返回</a></div>';
        }
    }
}

function updateCharacterDisplay(character) {
    // 基本信息
    setText('characterName', character.name);
    setText('characterRaceClass', `${character.race} / ${character.class}`);
    setText('characterLevel', `等级 ${character.level}`);
    setText('characterAlignment', character.alignment || '无阵营');

    // 属性
    updateAbility('strength', character.strength);
    updateAbility('dexterity', character.dexterity);
    updateAbility('constitution', character.constitution);
    updateAbility('intelligence', character.intelligence);
    updateAbility('wisdom', character.wisdom);
    updateAbility('charisma', character.charisma);

    // 战斗信息
    setText('hitPointsValue', character.hit_points);
    setText('hitDiceValue', character.hit_dice);
    setText('armorClassValue', character.armor_class);
    setText('speedValue', character.speed);
    setText('experienceValue', character.experience);

    // 其他信息
    setText('backgroundStoryContent', character.background_story || '暂无');
    setText('featuresContent', character.features || '暂无');
    setText('equipmentContent', character.equipment || '暂无');

    // 技能列表
    loadCharacterSkills(character.skills);
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function updateAbility(ability, value) {
    setText(`${ability}Value`, value);
    setText(`${ability}Modifier`, formatModifier(value));
}

function formatModifier(score) {
    const mod = Math.floor((parseInt(score) - 10) / 2);
    return mod >= 0 ? `+${mod}` : mod;
}

async function loadCharacterSkills(skillsJson) {
    try {
        const list = document.getElementById('skillsList');
        if (!list) return;

        const skillIds = JSON.parse(skillsJson) || [];
        const skills = await db.getSkills();
        
        list.innerHTML = '';
        skills.forEach(skill => {
            if (skillIds.includes(skill.id)) {
                const div = document.createElement('div');
                div.className = 'flex justify-between items-center py-1';
                
                const name = document.createElement('span');
                name.textContent = skill.name;
                
                const mod = document.createElement('span');
                mod.className = 'bg-gray-100 px-2 py-1 rounded text-sm';
                mod.textContent = formatModifier(document.getElementById(`${skill.ability_score}Value`)?.textContent || 10);
                
                div.appendChild(name);
                div.appendChild(mod);
                list.appendChild(div);
            }
        });
    } catch (err) {
        console.error("加载技能失败:", err);
    }
}

function initCharacterActions() {
    const editBtn = document.getElementById('editCharacterButton');
    const deleteBtn = document.getElementById('deleteCharacterButton');

    if (editBtn) {
        editBtn.addEventListener('click', () => showNotification('编辑功能待实现', 'info'));
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const id = new URLSearchParams(window.location.search).get('id');
            if (id) confirmDeleteCharacter(id);
        });
    }
}

// ========== 角色仪表盘 ==========
function initCharacterDashboard() {
    if (!window.location.pathname.endsWith('dashboard.html') || !currentUser) return;
    loadUserCharacters();
}

async function loadUserCharacters() {
    const container = document.getElementById('charactersContainer');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-12"><div class="loading-spinner mx-auto"></div><p class="mt-4">加载角色中...</p></div>';

    try {
        const characters = await db.getUserCharacters(currentUser.id);
        
        if (!characters || characters.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-500">暂无角色</p>
                    <a href="new-character.html" class="mt-4 bg-primary text-white px-4 py-2 rounded">创建第一个角色</a>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        characters.forEach(char => {
            const card = createCharacterCard(char);
            container.appendChild(card);
        });
    } catch (err) {
        console.error("加载角色列表失败:", err);
        container.innerHTML = `
            <div class="text-center py-12">
                <p class="text-red-600">加载失败</p>
                <button onclick="loadUserCharacters()" class="mt-4 bg-primary text-white px-4 py-2 rounded">重试</button>
            </div>
        `;
        showNotification('加载角色列表失败', 'error');
    }
}

function createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow';
    
    card.innerHTML = `
        <h3 class="text-xl font-bold mb-2">${character.name}</h3>
        <p class="text-gray-600 mb-4">${character.race} / ${character.class} (等级 ${character.level})</p>
        <div class="flex space-x-4">
            <a href="character.html?id=${character.id}" class="text-primary hover:underline">查看</a>
            <button class="text-red-600 hover:text-red-800 delete-btn" data-id="${character.id}">删除</button>
        </div>
    `;

    card.querySelector('.delete-btn').addEventListener('click', () => {
        confirmDeleteCharacter(character.id);
    });

    return card;
}

// ========== 工具函数 ==========
function confirmDeleteCharacter(id) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg p-6 max-w-md w-full mx-4';
    
    modalContent.innerHTML = `
        <h3 class="text-lg font-bold mb-4">确认删除</h3>
        <p class="mb-6">删除后无法恢复，确定吗？</p>
        <div class="flex justify-end space-x-3">
            <button class="cancel-btn px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">取消</button>
            <button class="delete-btn px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">删除</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 取消按钮
    modalContent.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // 删除按钮
    modalContent.querySelector('.delete-btn').addEventListener('click', async () => {
        try {
            const result = await db.deleteCharacter(id);
            if (result.success) {
                showNotification('删除成功', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            showNotification('删除失败', 'error');
            console.error(err);
        }
        document.body.removeChild(modal);
    });
}

function showNotification(message, type = 'info') {
    // 移除旧通知
    const oldNotify = document.querySelector('.notification');
    if (oldNotify) oldNotify.remove();

    // 创建新通知
    const notify = document.createElement('div');
    notify.className = `fixed top-4 right-4 px-6 py-3 rounded shadow-lg z-50 transition-all duration-300`;
    
    // 设置样式
    if (type === 'success') notify.classList.add('bg-green-500', 'text-white');
    if (type === 'error') notify.classList.add('bg-red-500', 'text-white');
    if (type === 'info') notify.classList.add('bg-blue-500', 'text-white');

    notify.textContent = message;
    document.body.appendChild(notify);

    // 自动消失
    setTimeout(() => {
        notify.classList.add('opacity-0');
        setTimeout(() => notify.remove(), 300);
    }, 3000);
}