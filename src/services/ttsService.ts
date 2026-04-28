import { ApiConfig } from "../types";

export interface TtsOptions {
  voiceId?: string;
  speed?: number;
  vol?: number;
  pitch?: number;
}

export async function synthesizeSpeech(
  text: string,
  config: ApiConfig,
  options: TtsOptions = {}
): Promise<ArrayBuffer> {
  const apiKey = config.minimaxApiKey;
  const groupId = config.minimaxGroupId;
  const baseUrl = config.minimaxUrl || "https://api.minimax.chat/v1/t2a_v2?GroupId=" + groupId;

  if (!apiKey || !groupId) {
    throw new Error("请先配置 MiniMax API Key 和 Group ID");
  }

  // MiniMax T2A V2 Payload
  const payload = {
    model: "speech-01-turbo",
    text: text,
    stream: false,
    voice_setting: {
      voice_id: options.voiceId || "male-qn-qingse", // Default voice
      speed: options.speed || 1.0,
      vol: options.vol || 1.0,
      pitch: options.pitch || 0,
    },
    audio_setting: {
      sample_rate: 32000,
      bitrate: 128000,
      format: "mp3",
    }
  };

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail = "";
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.base_resp?.status_msg || errorJson.message || errorText;
      } catch (e) {
        errorDetail = errorText;
      }

      if (response.status === 401) throw new Error("MiniMax API Key 无效或过细");
      if (response.status === 402) throw new Error("MiniMax 账户余额不足");
      if (response.status === 429) throw new Error("MiniMax 请求频率过快");
      
      throw new Error(`MiniMax 错误 (${response.status}): ${errorDetail}`);
    }

    return await response.arrayBuffer();
  } catch (error: any) {
    console.error("[TTS_SERVICE] Error:", error);
    throw error;
  }
}
