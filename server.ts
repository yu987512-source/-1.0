import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Helper Functions ---

/**
 * Calculates semantic-ish similarity based on character overlap.
 * Used for the 30% redundancy threshold.
 */
function getSimilarity(s1: string, s2: string) {
  if (!s1 || !s2) return 0;
  const set1 = new Set(s1.split(""));
  const set2 = new Set(s2.split(""));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  return intersection.size / Math.max(set1.size, set2.size);
}

/**
 * Enforces the Anti-Recursion Lock protocol.
 * - Truncates if similarity > 30%
 * - Removes self-talk phrases
 * - Blocks duplicative conclusions (总结, 综上)
 */
function scrubOutput(text: string): string {
  if (!text) return text;

  // 1. Tag Isolation: If meta-tags are present, they should be the ONLY content or strictly isolated.
  // We prioritize [Modal:] and [Action:] as blockers.
  const modalMatch = text.match(/\[Modal:[^\]]+\]/);
  const actionMatch = text.match(/\[Action:[^\]]+\]/);
  
  if (modalMatch || actionMatch) {
     // If a modal or action is triggered, we discard the text content to ensure "Tag Isolation" 
     // and "Single Output Lock" for meta-directives.
     return (modalMatch?.[0] || "") + (actionMatch?.[0] || "");
  }

  // 2. Block Self-Talk & Instruction Echoes
  const forbiddenPhrases = ["回复我这条消息", "请说...", "请回复", "我该怎么做", "指令已接收"];
  for (const phrase of forbiddenPhrases) {
    if (text.includes(phrase)) {
      text = text.split(phrase)[0].trim();
    }
  }

  // 3. Vision & Summary Redundancy Truncation
  const summaryMarkers = ["总结：", "总之", "简言之", "概括来说", "综上所述"];
  for (const marker of summaryMarkers) {
    if (text.includes(marker)) {
      const parts = text.split(marker);
      if (parts[0].trim().length > 50) {
        return (parts[0].trim() + " [STOP_GENERATION]").trim();
      }
    }
  }

  // 4. Semantic Similarity Check (30% threshold)
  const sentences = text.split(/([。！？\n])/).filter(Boolean);
  const seenSentences: string[] = [];
  let result = "";

  for (let i = 0; i < sentences.length; i += 2) {
    const s = sentences[i];
    const p = sentences[i + 1] || "";
    const current = (s + p).trim();
    if (!current) continue;

    let isDuplicate = false;
    for (const seen of seenSentences) {
      if (getSimilarity(current, seen) > 0.30) { // Enforcing strict 30%
        isDuplicate = true;
        break;
      }
    }

    if (isDuplicate) {
      return (result.trim() + " [STOP_GENERATION]").trim();
    }

    result += s + p;
    seenSentences.push(current);
  }

  return result.trim();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // --- API Routes ---

  // Catch-all for API errors (prevents falling through to Vite/Statics which return HTML)
  app.all("/api/*", (req, res, next) => {
    // Check if any route matched so far
    if (res.headersSent) return;
    next();
  });

  app.post("/api/chat", async (req, res) => {
    const { history, userInput, config, persistentContext, systemInstruction } = req.body;
    
    if (!userInput && !history) {
      return res.status(400).json({ error: "Missing required fields: userInput or history" });
    }

    try {
      console.log(`[API_ROUTE] Request received: ${userInput?.slice(0, 50)}...`);

      const isCustomIntent = (config?.baseUrl && config.baseUrl.trim() !== "");
      const modelId = config?.model || "gemini-1.5-flash";
      
      const formatMessage = (m: any, isREST = false) => {
        const text = (m.content || "").trim();
        const parts: any[] = [];
        if (text) {
          parts.push({ text });
        }
        
        if (m.image) {
          const match = m.image.match(/^data:(image\/\w+);base64,(.*)$/);
          if (match) {
            if (isREST) {
              parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
            } else {
              parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
            }
          }
        }
        
        // Ensure at least ONE part exists to avoid 400 "parts must not be empty"
        if (parts.length === 0) {
          parts.push({ text: " " });
        }
        
        return { role: m.role === "assistant" ? "model" : "user", parts };
      };

      const formatOpenAIMessage = (m: any) => {
        const text = (m.content || "").trim();
        if (!m.image) {
          return { role: m.role === "assistant" ? "assistant" : "user", content: text || " " };
        }
        const content: any[] = [];
        if (text) {
           content.push({ type: "text", text });
        }
        content.push({ type: "image_url", image_url: { url: m.image } });
        return { role: m.role === "assistant" ? "assistant" : "user", content };
      };

      // Sanitize history for Gemini: No consecutive roles, must alternate user/model
      const sanitizeHistory = (rawHistory: any[]) => {
        if (!rawHistory || rawHistory.length === 0) return [];
        const sanitized: any[] = [];
        for (const msg of rawHistory) {
          const last = sanitized[sanitized.length - 1];
          if (last && last.role === msg.role) {
            // Merge consecutive messages with same role
            if (typeof last.content === 'string' && typeof msg.content === 'string') {
              last.content += "\n" + msg.content;
            } else if (Array.isArray(last.content) && Array.isArray(msg.content)) {
               last.content = [...last.content, ...msg.content];
            }
          } else {
            sanitized.push({ ...msg });
          }
        }
        
        // Gemini strictly requires the first message to be "user"
        while (sanitized.length > 0 && sanitized[0].role === "assistant") {
          sanitized.shift();
        }
        
        return sanitized;
      };

      if (isCustomIntent) {
        // --- Custom BaseUrl Logic ---
        try {
          const baseUrl = config.baseUrl.trim().replace(/\/$/, "");
          const apiKey = (config.apiKey || "").trim();
          
          if (!apiKey) {
            return res.json({ text: "[Modal: API 密钥已失效或权限受限，请在设置中重新配置]" });
          }

          const isNativeGemini = 
            baseUrl.includes("googleapis.com") || 
            baseUrl.includes("generativelanguage") ||
            ((baseUrl.includes("/v1") || baseUrl.includes("/v1beta")) && baseUrl.includes("/models"));

          let fullUrl: string;
          let headers: Record<string, string> = { "Content-Type": "application/json" };
          if (!isNativeGemini) {
            headers["Authorization"] = `Bearer ${apiKey}`;
          }

          let body: any;

          const sanitizedHistory = sanitizeHistory(history || []);
          if (sanitizedHistory.length === 0 && userInput) {
            sanitizedHistory.push({ role: "user", content: userInput });
          }

          if (isNativeGemini) {
            if (baseUrl.includes("/models/")) {
              fullUrl = baseUrl.includes(":generateContent") 
                ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?" }key=${apiKey}`
                : `${baseUrl}:generateContent?key=${apiKey}`;
            } else {
              fullUrl = `${baseUrl}/models/${modelId}:generateContent?key=${apiKey}`;
            }
            body = {
              contents: sanitizedHistory.slice(-15).map(m => formatMessage(m, true)),
              generationConfig: { 
                temperature: config?.temperature ?? 0.7, 
                maxOutputTokens: 2048 
              }
            };

            if (systemInstruction) {
              body.system_instruction = { parts: [{ text: systemInstruction }] };
            }
          } else {
            fullUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
            console.log(`[API_ROUTE] Proxying to: ${fullUrl} with model: ${modelId}`);
            body = {
              model: modelId,
              messages: [{ role: "system", content: systemInstruction }, ...sanitizedHistory.slice(-15).map(formatOpenAIMessage)],
              temperature: config?.temperature ?? 0.7,
            };
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          try {
            const response = await fetch(fullUrl, { 
              method: "POST", 
              headers, 
              body: JSON.stringify(body),
              signal: controller.signal 
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
              if (response.status === 402) {
                return res.json({ text: "[Modal: 当前 API 余额不足，请及时充值或更换密钥]" });
              }
              if (response.status === 401 || response.status === 403) {
                return res.json({ text: "[Modal: API 密钥已失效或权限受限，请在设置中重新配置]" });
              }
              
              const errBody = await response.text();
              const errLower = errBody.toLowerCase();
              if (errLower.includes("vision") && (errLower.includes("limit") || errLower.includes("quota"))) {
                return res.json({ text: "[Toast: 图片识别额度已用完，请升级 API 套餐]" });
              }

              throw new Error(`API Error: ${response.status}`);
            }

            const data: any = await response.json();
            const rawText = isNativeGemini 
              ? data.candidates?.[0]?.content?.parts?.[0]?.text 
              : data.choices?.[0]?.message?.content;

            return res.json({ text: scrubOutput(rawText) });
          } catch (e: any) {
            clearTimeout(timeoutId);
            if (e.name === 'AbortError') {
              return res.json({ text: "[Toast: 节点连接超时，请检查 API 地址是否正确]" });
            }
            throw e;
          }
        } catch (e: any) {
          console.error("[CUSTOM_INTENT] Error:", e);
          if (e.message?.includes("AbortError") || e.name === "AbortError") {
             return res.json({ text: "[Toast: 节点连接超时，请检查 API 地址是否正确]" });
          }
          return res.json({ text: "[Toast: 当前 API 节点不可用，正在尝试重连...]" });
        }
      }

      // --- SDK Mode (Default Gemini) ---
      // This part runs if no baseUrl is provided.
      const apiKey = (config.apiKey || process.env.GEMINI_API_KEY || "").trim();
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        console.warn("[API_ROUTE] No valid API Key found.");
        return res.json({ text: "[Modal: API 密钥未配置。请在“设置-模型设置”中输入您的 Gemini API Key 或 Base URL。]" });
      }

      console.log(`[API_ROUTE] Calling Google SDK with model: ${modelId}`);
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const model = genAI.getGenerativeModel({ 
        model: modelId,
        systemInstruction: systemInstruction,
      });

      const sanitizedHistory = sanitizeHistory(history || []);

      const generationPromise = model.generateContent({
        contents: sanitizedHistory.slice(-15).map(m => formatMessage(m)) as any,
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: 2048,
        }
      });

      // SDK Timeout handling
      const result = await Promise.race([
        generationPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT_ERROR")), 15000))
      ]) as any;

      if (!result || !result.response) {
        throw new Error("Invalid response from AI SDK");
      }

      const responseText = result.response.text();
      return res.json({ text: scrubOutput(responseText) });
    } catch (error: any) {
      console.error("[API_ROUTE] General Error:", error);
      if (error.message === "TIMEOUT_ERROR") {
        return res.json({ text: "[Toast: 节点连接超时，请检查 API 地址是否正确]" });
      }
      if (error.message.includes("402") || error.message.includes("payment")) {
        return res.json({ text: "[Modal: 当前 API 余额不足，请及时充值或更换密钥]" });
      }
      if (error.message.includes("401") || error.message.includes("403") || error.message.includes("key")) {
        return res.json({ text: "[Modal: API 密钥已失效或权限受限，请在设置中重新配置]" });
      }
      
      const errLower = (error.message || "").toLowerCase();
      if (errLower.includes("vision") && (errLower.includes("limit") || errLower.includes("quota"))) {
        return res.json({ text: "[Toast: 图片识别额度已用完，请升级 API 套餐]" });
      }

      return res.json({ text: "[Toast: 当前 API 节点不可用，正在尝试重连...]" });
    }
  });

  app.post("/api/test-model", async (req, res) => {
    const { config } = req.body;
    if (!config.apiKey) return res.status(400).json({ error: "请先输入 API Key" });

    try {
      const isCustomIntent = (config.baseUrl && config.baseUrl.trim() !== "");
      const userInput = "你好，请回复 '连接成功'";
      const modelId = config.model || "gemini-1.5-flash";

      if (isCustomIntent) {
        const baseUrl = config.baseUrl.trim().replace(/\/$/, "");
        const apiKey = config.apiKey.trim();
        
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: "user", content: userInput }],
            temperature: config.temperature ?? 0.7,
            max_tokens: 50
          })
        });

        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          let msg = `API 请求失败 (${response.status})`;
          
          if (contentType && contentType.includes("application/json")) {
            const err = await response.json().catch(() => ({}));
            msg = err.error?.message || msg;
          }
          
          const status = response.status;
          if (status === 401) msg = "API Key 错误或已失效";
          else if (status === 404) msg = "接口地址 (Base URL) 错误，请检查是否包含 /v1 或路径是否正确";
          else if (status === 429) msg = "额度不足或触发频率限制 (请检查余额或 API 配额)";
          
          throw new Error(msg);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("接口未返回 JSON 格式数据，请检查 Base URL 是否正确 (可能指向了网页)");
        }

        const data = await response.json();
        return res.json({ text: data.choices?.[0]?.message?.content || "无回复" });
      } else {
        const genAI = new GoogleGenerativeAI(config.apiKey.trim());
        const model = genAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContent(userInput);
        const text = result.response.text();
        return res.json({ text: text || "空回复" });
      }
    } catch (e: any) {
      console.error("[TEST_MODEL_ERROR]", e);
      let errMsg = e.message || "测试失败";
      if (errMsg.includes("API_KEY_INVALID")) errMsg = "API Key 无效";
      if (errMsg.includes("User location is not supported")) errMsg = "当前服务器 IP 地区不支持该模型";
      if (errMsg.includes("quota")) errMsg = "API 配额已耗尽或余额不足";
      
      res.status(500).json({ error: errMsg });
    }
  });

  app.post("/api/models", async (req, res) => {
    let { apiKey, baseUrl } = req.body;
    if (!apiKey) return res.status(400).json({ error: { message: "请先输入 API Key" } });

    try {
      // If no baseUrl is provided, default to Google Generative AI models list
      if (!baseUrl || baseUrl.trim() === "") {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
        const response = await fetch(url);
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          return res.status(response.status).json({
            status: response.status,
            error: err.error || { message: "无法获取 Gemini 模型列表" }
          });
        }
        const data = await response.json();
        // Normalize Google format to OpenAI-ish format for the frontend
        return res.json({
          data: data.models?.map((m: any) => ({ id: m.name.replace("models/", "") })) || []
        });
      }

      // OpenAI-compatible flow
      const response = await fetch(`${baseUrl.trim().replace(/\/$/, "")}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey.trim()}` }
      });
      
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let msg = `接口请求失败 (${response.status})`;
        if (contentType && contentType.includes("application/json")) {
          const err = await response.json().catch(() => ({}));
          msg = err.error?.message || msg;
        } else if (response.status === 404) {
          msg = "接口路径错误 (404)，请检查 Base URL (通常需包含 /v1)";
        }
        return res.status(response.status).json({ error: { message: msg } });
      }

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        res.json(data);
      } else {
        res.status(500).json({ error: { message: "接口未返回 JSON 格式数据，请检查 Base URL 是否正确" } });
      }
    } catch (e: any) {
      console.error("[MODELS_FETCH_ERROR]", e);
      res.status(500).json({ error: { message: e.message || "网络请求失败，请检查配置" } });
    }
  });

  app.get("/api/weibo-hot", async (req, res) => {
    try {
      const response = await fetch("https://weibo.com/ajax/side/hotSearch", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://weibo.com/"
        }
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      console.error("Weibo Proxy Error:", e.message);
      res.status(500).json({ error: "Failed to fetch Weibo hot search" });
    }
  });

  app.get("/api/weibo-detail", async (req, res) => {
    const topic = req.query.topic as string;
    try {
      const headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
        "Referer": `https://m.weibo.cn/search?containerid=100103type%3D1%26q%3D${encodeURIComponent(topic)}`,
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json, text/plain, */*",
        "MPre-Fetch": "1"
      };

      const response = await fetch(`https://m.weibo.cn/api/container/getIndex?containerid=100103type%3D1%26q%3D${encodeURIComponent(topic)}`, {
        headers
      });
      
      const text = await response.text();
      
      // If blocked or redirected to HTML, use Gemini to generate realistic simulation
      if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
        console.warn(`Weibo blocked or redirected for topic: ${topic}. Using Gemini fallback.`);
        
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          
          const prompt = `你是一个微博内容生成器。请针对热搜话题 "${topic}" 生成 5 条极其真实的微博动态。
          要求：
          1. 包含用户名、发布时间(如"15分钟前")、互动量（转发、评论、点赞，数字要真实，如"1.2万"）。
          2. 每条微博有正文（包含话题词，语气要像微博用户）。
          3. 随机返回一些图片URL（可以使用 https://picsum.photos/seed/[随机词]/800/600）。
          请返回 JSON 数组格式，对象结构如下：
          [
            {
              "user": { "screen_name": "用户名", "profile_image_url": "头像URL" },
              "created_at": "发布时间",
              "text": "正文内容",
              "reposts_count": "转发数",
              "comments_count": "评论数",
              "attitudes_count": "点赞数",
              "pics": [{ "url": "图片URL" }]
            }
          ]
          只返回 JSON，不要 Markdown 代码块。`;

          const result = await model.generateContent(prompt);
          const responseText = result.response.text().trim().replace(/```json/g, "").replace(/```/g, "");
          const mockData = JSON.parse(responseText);
          
          return res.json({
            data: {
              cards: mockData.map((m: any) => ({
                mblog: {
                  ...m,
                  text: m.text.replace(/\n/g, "<br>")
                }
              }))
            }
          });
        } catch (geminiErr) {
          console.error("Gemini Fallback Error:", geminiErr);
          throw new Error("Weibo content unavailable and simulation failed.");
        }
      }

      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (jsonErr) {
        throw new Error(`Invalid JSON response: ${text.slice(0, 100)}...`);
      }
    } catch (e: any) {
      console.error("Weibo Detail Error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Final API catch-all to ensure we return JSON instead of fallback HTML
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  // --- Vite & Statics ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
