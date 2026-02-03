// 数据库操作类
class Database {
    constructor(config) {
        this.accountId = config.accountId;
        this.databaseId = config.databaseId;
        this.apiToken = config.apiToken;
        this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}`;
    }
    
    // 执行SQL查询
    async query(sql, params = []) {
        try {
            const response = await fetch(`${this.baseUrl}/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sql,
                    params
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.result;
        } catch (error) {
            console.error('数据库查询错误:', error);
            throw error;
        }
    }
    
    // 获取用户的所有角色
    async getCharactersByUserId(userId) {
        const sql = 'SELECT * FROM characters WHERE user_id = ?';
        const result = await this.query(sql, [userId]);
        return result.results;
    }
    
    // 根据ID获取角色
    async getCharacterById(characterId) {
        const sql = 'SELECT * FROM characters WHERE id = ?';
        const result = await this.query(sql, [characterId]);
        return result.results.length > 0 ? result.results[0] : null;
    }
    
    // 创建新角色
    async createCharacter(characterData) {
        const {
            userId, name, race, class: characterClass, level, background,
            alignment, experience, strength, dexterity, constitution,
            intelligence, wisdom, charisma, hitPoints, hitDice, armorClass,
            speed, skills, features, equipment, backgroundStory
        } = characterData;
        
        const sql = `
            INSERT INTO characters 
            (user_id, name, race, class, level, background, alignment, experience, 
             strength, dexterity, constitution, intelligence, wisdom, charisma, 
             hit_points, hit_dice, armor_class, speed, skills, features, equipment, background_story)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            userId, name, race, characterClass, level, background, alignment, experience,
            strength, dexterity, constitution, intelligence, wisdom, charisma,
            hitPoints, hitDice, armorClass, speed, JSON.stringify(skills), features, equipment, backgroundStory
        ];
        
        const result = await this.query(sql, params);
        return result.lastInsertRowid;
    }
    
    // 更新角色
    async updateCharacter(characterId, characterData) {
        const {
            name, race, class: characterClass, level, background,
            alignment, experience, strength, dexterity, constitution,
            intelligence, wisdom, charisma, hitPoints, hitDice, armorClass,
            speed, skills, features, equipment, backgroundStory
        } = characterData;
        
        const sql = `
            UPDATE characters 
            SET name = ?, race = ?, class = ?, level = ?, background = ?, alignment = ?, 
                experience = ?, strength = ?, dexterity = ?, constitution = ?, intelligence = ?, 
                wisdom = ?, charisma = ?, hit_points = ?, hit_dice = ?, armor_class = ?, 
                speed = ?, skills = ?, features = ?, equipment = ?, background_story = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        const params = [
            name, race, characterClass, level, background, alignment, experience,
            strength, dexterity, constitution, intelligence, wisdom, charisma,
            hitPoints, hitDice, armorClass, speed, JSON.stringify(skills), features, equipment, backgroundStory,
            characterId
        ];
        
        await this.query(sql, params);
    }
    
    // 删除角色
    async deleteCharacter(characterId) {
        const sql = 'DELETE FROM characters WHERE id = ?';
        await this.query(sql, [characterId]);
    }
    
    // 获取所有技能
    async getSkills() {
        const sql = 'SELECT * FROM skills';
        const result = await this.query(sql);
        return result.results;
    }
}

// 初始化数据库实例
const db = new Database(DATABASE_CONFIG);