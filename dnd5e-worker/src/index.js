export default {
  async fetch(request, env, ctx) {
    // 全局CORS配置（解决跨域）
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };

    // 处理OPTIONS预检请求
    if (request.method === "OPTIONS") {
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // ========== 路由配置 ==========
      // 根路径（解决404）
      if (path === "/") {
        return new Response(JSON.stringify({ 
          message: "DND5E角色卡API服务正常运行",
          endpoints: [
            "/api/users/register (POST)",
            "/api/users/login (POST)",
            "/api/characters (POST)",
            "/api/characters/{id} (GET)",
            "/api/characters/user?userId={id} (GET)",
            "/api/characters/{id} (DELETE)",
            "/api/skills (GET)"
          ]
        }), { headers: corsHeaders });
      }

      // 用户注册
      if (path === "/api/users/register" && request.method === "POST") {
        const { email, password, username } = await request.json();
        if (!email || !password || !username) {
          return new Response(JSON.stringify({ error: "缺少必要参数" }), { 
            status: 400, headers: corsHeaders 
          });
        }

        // 检查邮箱是否存在
        const existingUser = await env.DB.prepare(
          "SELECT id FROM users WHERE email = ?"
        ).bind(email).first();

        if (existingUser) {
          return new Response(JSON.stringify({ error: "邮箱已注册" }), { 
            status: 409, headers: corsHeaders 
          });
        }

        // 创建用户（注意：实际项目要加密密码，这里简化）
        const result = await env.DB.prepare(
          "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
        ).bind(username, email, password).run();

        return new Response(JSON.stringify({ 
          success: true, 
          userId: result.lastInsertRowid 
        }), { headers: corsHeaders });
      }

      // 用户登录
      if (path === "/api/users/login" && request.method === "POST") {
        const { email, password } = await request.json();
        const user = await env.DB.prepare(
          "SELECT id, username, email FROM users WHERE email = ? AND password = ?"
        ).bind(email, password).first();

        if (!user) {
          return new Response(JSON.stringify({ error: "邮箱/密码错误" }), { 
            status: 401, headers: corsHeaders 
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          user: user 
        }), { headers: corsHeaders });
      }

      // 创建角色
      if (path === "/api/characters" && request.method === "POST") {
        const data = await request.json();
        const result = await env.DB.prepare(`
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
        }), { headers: corsHeaders });
      }

      // 获取单个角色
      if (path.match(/^\/api\/characters\/\d+$/) && request.method === "GET") {
        const id = path.split("/").pop();
        const character = await env.DB.prepare(
          "SELECT * FROM characters WHERE id = ?"
        ).bind(id).first();

        if (!character) {
          return new Response(JSON.stringify({ error: "角色不存在" }), { 
            status: 404, headers: corsHeaders 
          });
        }

        return new Response(JSON.stringify(character), { headers: corsHeaders });
      }

      // 获取用户所有角色
      if (path === "/api/characters/user" && request.method === "GET") {
        const userId = url.searchParams.get("userId");
        if (!userId) {
          return new Response(JSON.stringify({ error: "缺少userId参数" }), { 
            status: 400, headers: corsHeaders 
          });
        }

        const characters = await env.DB.prepare(
          "SELECT * FROM characters WHERE user_id = ?"
        ).bind(userId).all();

        return new Response(JSON.stringify(characters.results), { headers: corsHeaders });
      }

      // 删除角色
      if (path.match(/^\/api\/characters\/\d+$/) && request.method === "DELETE") {
        const id = path.split("/").pop();
        await env.DB.prepare(
          "DELETE FROM characters WHERE id = ?"
        ).bind(id).run();

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // 获取所有技能
      if (path === "/api/skills" && request.method === "GET") {
        const skills = await env.DB.prepare(
          "SELECT * FROM skills ORDER BY name"
        ).all();

        return new Response(JSON.stringify(skills.results), { headers: corsHeaders });
      }

      // 未匹配的路由
      return new Response(JSON.stringify({ error: "接口不存在" }), { 
        status: 404, headers: corsHeaders 
      });
    } catch (error) {
      console.error("Worker错误:", error);
      return new Response(JSON.stringify({ 
        error: "服务器内部错误", 
        details: error.message 
      }), { status: 500, headers: corsHeaders });
    }
  },
};