const ENV_KEYS = {
  url: "AI_API_URL",
  key: "AI_API_KEY",
  model: "AI_MODEL_NAME"
};

function jsonResponse(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function buildPrompt(payload) {
  const cards = (payload.cards || [])
    .map((card, index) => {
      const position = card.position || `第 ${index + 1} 张`;
      const orientation = card.reversed ? "逆位" : "正位";
      return `${position}：${card.name}（${orientation}）`;
    })
    .join("\n");

  const followups = (payload.followups || [])
    .map((item, index) => `追问 ${index + 1}：${item.question}\n抽牌：${item.card?.name || "未抽牌"}（${item.card?.reversed ? "逆位" : "正位"}）`)
    .join("\n\n");

  return [
    `用户主问题：${payload.question || "未提供"}`,
    cards ? `主牌阵：\n${cards}` : "",
    payload.followupQuestion ? `当前追问：${payload.followupQuestion}` : "",
    followups ? `历史追问：\n${followups}` : "",
    payload.mode === "angel" ? "本次请求是天使祝福，请输出一句温暖收束建议。" : "",
    "请用温柔、启发式、不绝对化的语气回答。",
    "不要恐吓，不要承诺确定未来，不替代医疗、法律、投资建议。",
    "输出结构：整体结论、牌面关系、行动建议、橘子的提醒。"
  ]
    .filter(Boolean)
    .join("\n\n");
}

function fallbackReading(payload) {
  const firstCard = payload.cards?.[0]?.name || "第一张牌";
  const secondCard = payload.cards?.[1]?.name || "第二张牌";
  const thirdCard = payload.cards?.[2]?.name || "第三张牌";

  if (payload.mode === "angel") {
    return "天使的祝福：愿你在还没有完全确定答案的时候，也能先稳稳照顾自己。真正适合你的方向，会让你越来越清楚地成为自己。";
  }

  if (payload.followupQuestion) {
    const card = payload.followupCard?.name || payload.cards?.[0]?.name || "这张牌";
    return `整体结论：这个追问更像是在提醒你先看清自己的真实期待。\n\n牌面关系：${card} 指向一个需要放慢、确认、再行动的节点。它不是在否定你的主动，而是在提醒你把主动变成更清晰、更轻的表达。\n\n行动建议：可以联系，但不必一次说完所有情绪。先用一句具体、没有压力的话打开空间。\n\n橘子的提醒：温柔不是退让，是让对方更容易接住你，也让你更容易听见自己。`;
  }

  return `整体结论：这组牌显示，这个问题还有继续发展的空间，但节奏不适合被催促。\n\n牌面关系：${firstCard} 像是在说明问题的根源，${secondCard} 显示当前状态中的摇摆与等待，${thirdCard} 则把建议落在耐心、调和与重新找回平衡。\n\n行动建议：先整理你真正想表达的内容，再选择一种不带压迫感的方式靠近答案。\n\n橘子的提醒：不要急着证明什么。把想说的话收成更温柔、更具体的一句，关系会更容易接住你。`;
}

function extractTextFromAi(data) {
  if (typeof data?.choices?.[0]?.message?.content === "string") {
    return data.choices[0].message.content;
  }
  if (typeof data?.output_text === "string") {
    return data.output_text;
  }
  if (Array.isArray(data?.content)) {
    return data.content.map((part) => part.text || "").join("").trim();
  }
  return "";
}

export async function createReading(payload) {
  const url = process.env[ENV_KEYS.url];
  const key = process.env[ENV_KEYS.key];
  const model = process.env[ENV_KEYS.model];

  if (!url || !key || !model || key === "replace-with-your-api-key") {
    return {
      configured: false,
      reading: fallbackReading(payload),
      usage: null
    };
  }

  const prompt = buildPrompt(payload);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.78,
      messages: [
        {
          role: "system",
          content: "你是橘子塔罗的橘猫塔罗助手。你提供温柔、启发式、边界清晰的塔罗解读。"
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      configured: true,
      reading: fallbackReading(payload),
      error: data?.error?.message || `AI API 请求失败：${response.status}`,
      usage: null
    };
  }

  const reading = extractTextFromAi(data);
  return {
    configured: true,
    reading: reading || fallbackReading(payload),
    usage: data.usage || null
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    jsonResponse(res, 405, { error: "Method Not Allowed" });
    return;
  }

  try {
    const payload = req.body || {};
    const result = await createReading(payload);
    jsonResponse(res, 200, result);
  } catch (error) {
    jsonResponse(res, 500, {
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
