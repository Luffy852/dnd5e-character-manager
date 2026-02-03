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
        const skillsContainer = newCharacterForm.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-4');
        
        if (skills && skills.length > 0) {
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
                
                skillLabel.appendChild(skillCheckbox);
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
        const originalText = submitButton.textContent;
        showLoading(submitButton);
        
        // 创建角色
        const characterId = await db.createCharacter(characterData);
        
        showNotification('角色创建成功！', 'success');
        setTimeout(function() {
            window.location.href = `character.html?id=${characterId}`;
        }, 1000);
    } catch (error) {
        showNotification('创建角色失败', 'error');
        console.error('创建角色错误:', error);
    } finally {
        // 恢复按钮状态
        submitButton.textContent = originalText;
    }
}

// 获取选中的技能
function getSelectedSkills() {
    const checkboxes = newCharacterForm.querySelectorAll('input[type="checkbox"][name^="skills["]');
    const selectedSkills = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const skillId = parseInt(checkbox.name.match(/\[(\d+)\]/)[1]);
            selectedSkills.push(skillId);
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
        const originalContent = mainContent.innerHTML;
        mainContent.innerHTML = '<div class="text-center py-12"><div class="loading-spinner mx-auto"></div><p class="mt-4 text-gray-600">正在加载角色信息...</p></div>';
        
        const character = await db.getCharacterById(characterId);
        
        if (character) {
            // 检查角色是否属于当前用户
            if (character.user_id !== currentUser.id) {
                showNotification('你没有权限查看这个角色', 'error');
                setTimeout(function() {
                    window.location.href = 'dashboard.html';
                }, 1000);
                return;
            }
            
            // 更新角色信息显示
            updateCharacterDisplay(character);
        } else {
            showNotification('角色不存在', 'error');
            setTimeout(function() {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } catch (error) {
        showNotification('加载角色信息失败', 'error');
        console.error('加载角色错误:', error);
        setTimeout(function() {
            window.location.href = 'dashboard.html';
        }, 1000);
    }
}

// 更新角色信息显示
function updateCharacterDisplay(character) {
    // 基本信息
    document.getElementById('characterName').textContent = character.name;
    document.getElementById('characterRaceClass').textContent = `${character.race} / ${character.class}`;
    document.getElementById('characterLevel').textContent = `等级 ${character.level}`;
    document.getElementById('characterAlignment').textContent = character.alignment || '无阵营';
    
    // 属性值
    document.getElementById('strengthValue').textContent = character.strength;
    document.getElementById('strengthModifier').textContent = formatModifier(calculateModifier(character.strength));
    
    document.getElementById('dexterityValue').textContent = character.dexterity;
    document.getElementById('dexterityModifier').textContent = formatModifier(calculateModifier(character.dexterity));
    
    document.getElementById('constitutionValue').textContent = character.constitution;
    document.getElementById('constitutionModifier').textContent = formatModifier(calculateModifier(character.constitution));
    
    document.getElementById('intelligenceValue').textContent = character.intelligence;
    document.getElementById('intelligenceModifier').textContent = formatModifier(calculateModifier(character.intelligence));
    
    document.getElementById('wisdomValue').textContent = character.wisdom;
    document.getElementById('wisdomModifier').textContent = formatModifier(calculateModifier(character.wisdom));
    
    document.getElementById('charismaValue').textContent = character.charisma;
    document.getElementById('charismaModifier').textContent = formatModifier(calculateModifier(character.charisma));
    
    // 战斗信息
    document.getElementById('hitPointsValue').textContent = character.hit_points;
    document.getElementById('hitDiceValue').textContent = character.hit_dice;
    document.getElementById('armorClassValue').textContent = character.armor_class;
    document.getElementById('speedValue').textContent = character.speed;
    document.getElementById('experienceValue').textContent = character.experience;
    
    // 背景故事和其他信息
    document.getElementById('backgroundStoryContent').textContent = character.background_story || '暂无背景故事';
    document.getElementById('featuresContent').textContent = character.features || '暂无特性与专长';
    document.getElementById('equipmentContent').textContent = character.equipment || '暂无装备';
    
    // 技能列表
    loadCharacterSkills(character.skills);
}

// 加载角色技能
async function loadCharacterSkills(skillsJson) {
    try {
        const skillIds = JSON.parse(skillsJson) || [];
        const skills = await db.getSkills();
        const skillsList = document.getElementById('skillsList');
        
        skillsList.innerHTML = '';
        
        if (skills && skills.length > 0) {
            skills.forEach(skill => {
                if (skillIds.includes(skill.id)) {
                    const skillDiv = document.createElement('div');
                    skillDiv.className = 'flex justify-between items-center';
                    
                    const skillName = document.createElement('span');
                    skillName.textContent = skill.name;
                    
                    const abilityScore = document.getElementById(skill.ability_score);
                    const modifier = calculateModifier(parseInt(abilityScore.value) || 10);
                    
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

// 确认删除角色
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
                            action: function() {
                                // 删除角色逻辑
                                deleteCharacter(characterId);
                                this.closest('.modal').classList.remove('active');
                            }
                        }
                    ]
                );
            }