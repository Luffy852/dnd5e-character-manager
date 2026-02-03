// db.js - 前端API调用封装
const API_BASE_URL = "https://dnd5e-character-api.yourname.workers.dev"; // 替换为你的Worker URL

// 用户相关
async function registerUser(username, email, password) {
  const response = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });
  return response.json();
}

async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return response.json();
}

// 角色相关
async function createCharacter(characterData) {
  const response = await fetch(`${API_BASE_URL}/api/characters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(characterData)
  });
  return response.json();
}

async function getCharacterById(id) {
  const response = await fetch(`${API_BASE_URL}/api/characters/${id}`);
  return response.json();
}

async function getUserCharacters(userId) {
  const response = await fetch(`${API_BASE_URL}/api/characters/user?userId=${userId}`);
  return response.json();
}

async function deleteCharacter(id) {
  const response = await fetch(`${API_BASE_URL}/api/characters/${id}`, {
    method: "DELETE"
  });
  return response.json();
}

// 技能相关
async function getSkills() {
  const response = await fetch(`${API_BASE_URL}/api/skills`);
  return response.json();
}

// 导出供其他文件使用
const db = {
  registerUser,
  loginUser,
  createCharacter,
  getCharacterById,
  getUserCharacters,
  deleteCharacter,
  getSkills
};