export default {
  async fetch(request, env, ctx) {
    // 设置CORS头部
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // 处理OPTIONS预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // 路由：用户相关
      if (path === "/api/users/register" && request.method === "POST") {
        return handleUserRegister(request, env.DB);
      }
      if (path === "/api/users/login" && request.method === "POST") {
        return handleUserLogin(request, env.DB);
      }

      // 路由：角色相关
      if (path === "/api/characters" && request.method === "POST") {
        return handleCreateCharacter(request, env.DB);
      }
      if (path.startsWith("/api/characters/") && request.method === "GET") {
        const id = path.split("/").pop();
        return handleGetCharacter(request, env.DB, id);
      }
      if (path === "/api/characters/user" && request.method === "GET") {
        const userId = url.searchParams.get("userId");
        return handleGetUserCharacters(request, env.DB, userId);
      }
      if (path.startsWith("/api/characters/") && request.method === "DELETE") {
        const id = path.split("/").pop();
        return handleDeleteCharacter(request, env.DB, id);
      }

      // 路由：技能相关
      if (path === "/api/skills" && request.method === "GET") {
        return handleGetSkills(request, env.DB);
      }

      // 404
      return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};

// 用户注册
async function handleUserRegister(request, db) {
  const { email, password, username } = await request.json();
  
  // 简单验证
  if (!email || !password || !username) {
    return new Response(JSON.stringify({ error: "缺少必要参数" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 检查邮箱是否已存在
  const existingUser = await db.prepare(
    "SELECT * FROM users WHERE email = ?"
  ).bind(email).first();

  if (existingUser) {
    return new Response(JSON.stringify({ error: "邮箱已被注册" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 创建用户（实际项目中要加密密码，这里简化）
  const result = await db.prepare(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
  ).bind(username, email, password).run();

  return new Response(JSON.stringify({ 
    success: true, 
    userId: result.lastInsertRowid 
  }), {
    headers: { "Content-Type": "application/json" },
  });
}

// 用户登录
async function handleUserLogin(request, db) {
  const { email, password } = await request.json();
  
  const user = await db.prepare(
    "SELECT id, username, email FROM users WHERE email = ? AND password = ?"
  ).bind(email, password).first();

  if (!user) {
    return new Response(JSON.stringify({ error: "邮箱或密码错误" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ 
    success: true, 
    user: { id: user.id, username: user.username, email: user.email }
  }), {
    headers: { "Content-Type": "application/json" },
  });
}

// 创建角色
async function handleCreateCharacter(request, db) {
  const data = await request.json();
  
  const result = await db.prepare(`
    INSERT INTO characters (
      user_id, name, race, class, level, background, alignment, experience,
      strength, dexterity, constitution, intelligence, wisdom, charisma,
      hit_points, hit_dice, armor_class, speed, skills, features, equipment, background_story
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.userId, data.name, data.race, data.class, data.level, data.background,
    data.alignment, data.experience, data.strength, data.dexterity, data.constitution,
    data.intelligence, data.wisdom, data.charisma, data.hitPoints, data.hitDice,
    data.armorClass, data.speed, JSON.stringify(data.skills), data.features,
    data.equipment, data.backgroundStory
  ).run();

  return new Response(JSON.stringify({ 
    success: true, 
    characterId: result.lastInsertRowid 
  }), {
    headers: { "Content-Type": "application/json" },
  });
}

// 获取单个角色
async function handleGetCharacter(request, db, id) {
  const character = await db.prepare(
    "SELECT * FROM characters WHERE id = ?"
  ).bind(id).first();

  if (!character) {
    return new Response(JSON.stringify({ error: "角色不存在" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(character), {
    headers: { "Content-Type": "application/json" },
  });
}

// 获取用户所有角色
async function handleGetUserCharacters(request, db, userId) {
  if (!userId) {
    return new Response(JSON.stringify({ error: "缺少用户ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const characters = await db.prepare(
    "SELECT * FROM characters WHERE user_id = ?"
  ).bind(userId).all();

  return new Response(JSON.stringify(characters.results), {
    headers: { "Content-Type": "application/json" },
  });
}

// 删除角色
async function handleDeleteCharacter(request, db, id) {
  await db.prepare(
    "DELETE FROM characters WHERE id = ?"
  ).bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

// 获取所有技能
async function handleGetSkills(request, db) {
  const skills = await db.prepare(
    "SELECT * FROM skills ORDER BY name"
  ).all();

  return new Response(JSON.stringify(skills.results), {
    headers: { "Content-Type": "application/json" },
  });
}