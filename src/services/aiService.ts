import { ApiConfig, Message, UserProfile } from "../types";
import { getPersonaMemories } from "../lib/memoryUtils";

export async function getAiResponse(
  history: Message[],
  userInput: string,
  config: ApiConfig,
  userProfile?: UserProfile,
  persistentContext?: string,
  signal?: AbortSignal
): Promise<string> {
  const character = config.characterGroups
    .flatMap((g) => g.personas)
    .find((p) => p.id === config.selectedCharacterId);

  const currentUserPersona = userProfile?.personaGroups
    .flatMap(g => g.personas)
    .find(p => p.id === userProfile.selectedPersonaId);

  const genderMap = {
    male: '男',
    female: '女',
    other: '其他'
  };

  const detailedInfo = character ? `
【你的角色核心档案 (AI角色)】
- 姓名：${character.name}
- 性别：${character.gender ? genderMap[character.gender] : '未设置'}
- 生日：${character.birthday || '未设置'}
- 虚拟联系方式：${character.phoneNumber || '未设置'}
- 人设核心：${character.description || '无'}
- 详细背景/口吻设定：${character.personaDescription || '遵循核心人设'}
` : "";

  const userInfo = currentUserPersona ? `
【对方（当前用户）个人档案】
- 姓名：${currentUserPersona.name}
- 性别：${currentUserPersona.gender ? genderMap[currentUserPersona.gender] : '未设置'}
- 生日：${currentUserPersona.birthday || '未设置'}
- 微信ID：${userProfile?.wechatId || '未设置'}
- 个性签名：${userProfile?.signature || '无'}
- TA的人设描述：${currentUserPersona.personaDescription || '无特意设定'}
` : "【对方（当前用户）个人档案】\n- 信息：用户未提供详细人设资料，请通过对话逐步了解。";

  const memories = getPersonaMemories(config.selectedCharacterId);
  const baseInstruction = (detailedInfo || 
    "你是一个人工智能助手，请根据用户的需求提供专业的帮助。") + userInfo + memories;

  const minReplies = config.minAiReplies || 1;
  const replyCountInstruction = minReplies > 1 
    ? `\n\n【多消息回复协议 (Multi-Message Protocol)】\n1. **强制拆分**：你必须将你的回复拆分成正好 ${minReplies} 条独立的消息。\n2. **格式标记**：每条消息必须以 [消息N] 开头（例如 [消息1] 你好！ [消息2] 很高兴见到你）。\n3. **内容分配**：不要回复大段文本，要自然地将对话拆分成多条简短消息。` 
    : "";

  const citationInstruction = (userInput.includes("引用") || (history.length > 0 && history[history.length - 1].content.includes("引用")))
    ? `\n\n【系统指令：上下文对话处理规则】
1. **读取上下文**：每次收到用户新消息时，先读取并理解本次对话的所有历史消息，包括用户之前发送的内容和你之前的回复。
2. **引用格式规范**：当用户明确要求“引用消息”时，必须按以下格式引用用户的指定消息：
    > "用户消息原文"
    —— 发送者昵称，发送日期（格式：YYYY-MM-DD）
3. **回应逻辑**：
    - 先输出正确格式的引用内容；
    - 再根据引用的消息内容，给出对应的回应；
    - 必须保证引用的内容和用户发送的原文完全一致，不能篡改、遗漏。
4. **边界处理**：
    - 如果用户没有指定引用哪条消息，默认引用用户最新发送的一条消息；
    - 如果用户指定了“引用我这条消息”，则直接引用用户当前发送的这条消息。`
    : "";

  const systemInstruction = `你的核心人设：\n${baseInstruction}${replyCountInstruction}${citationInstruction}\n\n【身份即时同步协议 (Identity Sync)】\n1. **认知同步**：你必须立即采用上述“你的角色核心档案”中的所有信息。
2. **用户认知**：你必须充分尊重并利用“对方（当前用户）个人档案”中的信息。在对话中要表现出你真的认识TA，根据TA的人设、性别、描述来调整你的称呼和说话态度。
3. **拒绝陈旧认知**：如果用户的言论与档案不符，请以档案为准。

【单一输出锁 (Anti-Duplication Protocol)】\n1. **逻辑精炼**：严禁输出重复内容。
2. **零开场白 (Speed Boost)**：严禁输出废话。首句直接切入核心。

【输出规范 (Output Restriction)】\n1. **纯文字输出**：你必须只输出纯文字。严禁输出任何音频、语音或描述语音/音频生成状态的元数据。
2. **严禁自带语音**：即使在通话接口调用中，你也只需回复文字，不要尝试触发任何音频输出。

【标签隔离与元数据隐藏 (Tag Isolation)】\n1. **禁止明文暴露标签**：严禁包含 [Action]、[Toast] 等标签。

【通话功能交互协议 (Dual-Call Mode)】\n1. **触发入口**：当用户请求语音/视频通话时，你必须输出指令：[Modal: 请选择通话模式 | 选项: 语音通话, 视频通话]。
2. **执行指令**：用户选择后，你输出 [Action: Start_Audio_Call] 或 [Action: Start_Video_Call]。

【响应压缩与确认 (Efficiency)】\n1. **异步确认**：将状态确认改为压缩标识（如 [Toast: 背景已设置]）。`;

  // Enrich history with metadata for citations
  const enrichedHistory = history.map(m => {
    const name = m.role === 'assistant' ? (character?.name || '机器人') : (currentUserPersona?.name || '用户');
    const date = new Date(m.timestamp).toISOString().split('T')[0];
    return {
      ...m,
      content: `[Sender: ${name}, Date: ${date}]\n${m.content}`
    };
  });

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal,
      body: JSON.stringify({
        history: enrichedHistory,
        userInput,
        config,
        persistentContext,
        systemInstruction
      }),
    });

    if (!response.ok) {
      let errorMessage = `请求失败: ${response.status}`;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const textError = await response.text();
          console.warn("[AI_SERVICE] Received non-JSON error:", textError.slice(0, 100));
          if (response.status === 413) errorMessage = "图片文件过大，请尝试压缩后重新发送。";
          else if (response.status === 504) errorMessage = "请求超时，请稍后重试。";
        }
      } catch (e) {
        console.error("[AI_SERVICE] Error parsing error response:", e);
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("[AI_SERVICE] Expected JSON but received:", text.slice(0, 100));
      throw new Error("服务器返回了非 JSON 格式的响应，请重试或检查设置。");
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    console.error("AI Proxy Error:", error);
    if (error.message.includes("Failed to fetch") || error.message.includes("fetch failed")) {
      return "无法连接到服务器。请检查您的网络连接或稍后再试。";
    }
    return error.message || "连接 AI 失败了，请检查设置。";
  }
}
