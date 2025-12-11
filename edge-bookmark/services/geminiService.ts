import { GoogleGenAI, Type } from "@google/genai"
import { Bookmark, AiCategorizationResponse } from "../types"

// 模型配置
const GEMINI_MODEL = "gemini-2.5-flash"
const OPENAI_MODEL = "gpt-4o-mini" // 默认 OpenAI 模型，可通过环境变量覆盖

/**
 * AI 整理逻辑 - 支持 Gemini 和 OpenAI 兼容接口
 *
 * 环境变量说明：
 * - API_KEY: API 密钥（必填）
 * - API_BASE_URL: OpenAI 兼容接口的 Base URL（选填，留空则使用 Gemini）
 * - MODEL_NAME: 自定义模型名称（选填）
 *
 * 优化说明：
 * - 使用简短数字索引（0,1,2...）代替 UUID，大幅减少 token 占用
 * - AI 返回的索引在本地映射回原始 UUID
 */
export const categorizeBookmarks = async (bookmarks: Bookmark[]): Promise<Map<string, string>> => {
  const apiKey = process.env.API_KEY
  const apiBaseUrl = process.env.API_BASE_URL
  const customModel = process.env.MODEL_NAME

  if (!apiKey) {
    throw new Error("API Key is missing. 请配置 API_KEY 环境变量。")
  }

  // 创建索引到原始ID的映射表
  const indexToIdMap = new Map<string, string>()

  // 准备精简的书签数据，使用简短数字索引代替 UUID
  const bookmarkList = bookmarks.map((b, index) => {
    const shortId = String(index) // 使用数字索引: "0", "1", "2"...
    indexToIdMap.set(shortId, b.id)
    return {
      i: shortId,
      t: sanitizeText(b.title.substring(0, 40)), // 过滤并缩短标题
      u: sanitizeDomain(extractDomain(b.url)) // 过滤域名
    }
  })

  const systemPrompt = `你是书签分类专家。将书签按内容分类。

规则：
1. 包含所有ID（数字），严禁遗漏
2. 分类名用简短中文（如"技术"、"娱乐"、"购物"）
3-1. 6个≤分类数≤20个
3-2. 每个分类至多50个书签
4. 直接输出JSON，无需解释

格式：{"categories":[{"categoryName":"分类","bookmarkIds":["0","1"]}]}`

  const userContent = `分类${bookmarkList.length}个书签:\n${JSON.stringify(bookmarkList)}`

  // 根据是否配置了 API_BASE_URL 选择调用方式
  let resultMap: Map<string, string>
  if (apiBaseUrl) {
    resultMap = await callOpenAICompatible(apiKey, apiBaseUrl, customModel || OPENAI_MODEL, systemPrompt, userContent)
  } else {
    resultMap = await callGemini(apiKey, customModel || GEMINI_MODEL, systemPrompt, userContent)
  }

  // 将短索引映射回原始 UUID
  const finalMap = new Map<string, string>()
  resultMap.forEach((category, shortId) => {
    const originalId = indexToIdMap.get(shortId)
    if (originalId) {
      finalMap.set(originalId, category)
    }
  })

  console.log(`AI 分类完成: ${finalMap.size}/${bookmarks.length} 个书签已分类`)
  return finalMap
}

/**
 * 提取 URL 的域名部分，减少 token 占用
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url.substring(0, 30)
  }
}

/**
 * 敏感域名列表 - 这些域名会被替换为中性标记
 * 避免触发 API 服务商的敏感词检测
 */
const SENSITIVE_DOMAIN_PATTERNS = [
  // 政治类
  /gov\./i, /government/i, /congress/i, /parliament/i,
  /whitehouse/i, /kremlin/i, /cpc/i, /xinhua/i,
  // 新闻媒体类（某些可能敏感）
  /bbc\.com/i, /cnn\.com/i, /nytimes/i, /reuters/i,
  /rfa\.org/i, /voa/i, /epoch/i, /ntd/i,
  // 社交/敏感平台
  /twitter/i, /x\.com/i, /facebook/i, /telegram/i,
  // 其他可能敏感的
  /wiki.*leak/i, /tor/i, /vpn/i, /proxy/i
]

/**
 * 敏感关键词列表 - 标题中的这些词会被移除
 */
const SENSITIVE_KEYWORDS = [
  // 用正则匹配，不区分大小写
  /政治|党|国|共|民主|自由|人权|抗议|革命|独立/gi,
  /president|congress|election|vote|protest|freedom/gi,
  /trump|biden|obama|putin|xi|习/gi
]

/**
 * 清理文本内容，移除可能触发敏感词检测的内容
 */
function sanitizeText(text: string): string {
  if (!text) return ''
  let result = text

  // 移除敏感关键词
  SENSITIVE_KEYWORDS.forEach(pattern => {
    result = result.replace(pattern, '')
  })

  // 只保留中英文、数字、常用标点
  result = result
    .replace(/[^\w\u4e00-\u9fff\s\-_.，。！？、：；]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return result.substring(0, 35) || 'bookmark'
}

/**
 * 清理域名，保留实际域名但过滤敏感内容
 */
function sanitizeDomain(domain: string): string {
  if (!domain) return 'misc'

  const d = domain.toLowerCase().replace(/^www\./, '')

  // 只过滤明确敏感的域名
  for (const pattern of SENSITIVE_DOMAIN_PATTERNS) {
    if (pattern.test(d)) {
      return 'misc' // 敏感域名用 misc 替代
    }
  }

  // 保留实际域名的主体部分
  const parts = d.split('.')
  if (parts.length >= 2) {
    // 返回 "example.com" 格式
    return parts.slice(-2).join('.')
  }
  return d
}



/**
 * 调用 Gemini API
 */
async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContent: string
): Promise<Map<string, string>> {
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      categories: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            categoryName: { type: Type.STRING },
            bookmarkIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["categoryName", "bookmarkIds"]
        }
      }
    },
    required: ["categories"]
  }

  const ai = new GoogleGenAI({ apiKey })

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userContent,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
        maxOutputTokens: 16384,
        thinkingConfig: { thinkingBudget: 2048 }
      }
    })

    let resultText = response.text || ""
    resultText = resultText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()

    if (!resultText) throw new Error("AI 返回内容为空")

    const parsedData = JSON.parse(resultText) as AiCategorizationResponse
    return processAiResult(parsedData)
  } catch (error) {
    console.error("Gemini AI categorization failed:", error)
    throw error
  }
}

/**
 * 调用 OpenAI 兼容接口（支持各种第三方服务如 DeepSeek、Moonshot、智谱等）
 */
async function callOpenAICompatible(
  apiKey: string,
  baseUrl: string,
  model: string,
  systemPrompt: string,
  userContent: string
): Promise<Map<string, string>> {
  // 确保 baseUrl 格式正确
  const url = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`

  const requestBody = {
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ],
    temperature: 0.1,
    max_tokens: 16384,
    response_format: { type: "json_object" }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    let resultText = data.choices?.[0]?.message?.content || ""

    // 清理可能的 markdown 包装
    resultText = resultText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()

    if (!resultText) throw new Error("AI 返回内容为空")

    const parsedData = JSON.parse(resultText) as AiCategorizationResponse
    return processAiResult(parsedData)
  } catch (error) {
    console.error("OpenAI Compatible API categorization failed:", error)
    throw error
  }
}

/**
 * 处理 AI 返回结果
 */
function processAiResult(parsedData: AiCategorizationResponse): Map<string, string> {
  const idToCategoryMap = new Map<string, string>()
  if (!parsedData.categories || !Array.isArray(parsedData.categories)) return idToCategoryMap

  parsedData.categories.forEach(cat => {
    if (cat.bookmarkIds && Array.isArray(cat.bookmarkIds)) {
      cat.bookmarkIds.forEach(id => {
        // 确保 ID 是字符串格式
        idToCategoryMap.set(String(id), cat.categoryName)
      })
    }
  })
  return idToCategoryMap
}