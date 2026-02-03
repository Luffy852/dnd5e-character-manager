// 替换为你的Worker实际地址
const API_BASE_URL = "https://dnd5e-character-api.ylf-bob.workers.dev";

// ========== 用户相关 ==========
async function registerUser(username, email, password) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });
    return await res.json();
  } catch (err) {
    console.error("注册失败:", err);
    return { success: false, error: "网络错误" };
  }
}

async function loginUser(email, password) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  } catch (err) {
    console.error("登录失败:", err);
    return { success: false, error: "网络错误" };
  }
}

// ========== 角色相关 ==========
async function createCharacter(data) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    return result.characterId;
  } catch (err) {
    console.error("创建角色失败:", err);
    throw new Error("创建角色失败");
  }
}

async function getCharacterById(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/characters/${id}`);
    return await res.json();
  } catch (err) {
    console.error("获取角色失败:", err);
    throw new Error("获取角色失败");
  }
}

async function getUserCharacters(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/characters/user?userId=${userId}`);
    return await res.json();
  } catch (err) {
    console.error("获取角色列表失败:", err);
    throw new Error("获取角色列表失败");
  }
}

async function deleteCharacter(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/characters/${id}`, {
      method: "DELETE"
    });
    return await res.json();
  } catch (err) {
    console.error("删除角色失败:", err);
    return { success: false, error: "网络错误" };
  }
}

// ========== 技能相关 ==========
async function getSkills() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/skills`);
    return await res.json();
  } catch (err) {
    console.error("获取技能失败:", err);
    throw new Error("获取技能失败");
  }
}

// 导出供全局使用
const db = {
  registerUser,
  loginUser,
  createCharacter,
  getCharacterById,
  getUserCharacters,
  deleteCharacter,
  getSkills
};