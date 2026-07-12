/**
 * API 代码生成脚本
 * 从后端 Swagger 接口文档自动生成前端 service 代码
 *
 * 使用: node scripts/generate-api.mjs
 *
 * 解决的问题:
 * - 修复 Springfox Swagger2 中 Java 泛型(List, Map) $ref 引用无法解析的问题
 */

import { generateService } from '@umijs/openapi'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXED_SCHEMA_FILE = path.join(__dirname, '..', 'swagger-fixed.json')
const BACKEND_URL = process.env.API_BASE || 'http://localhost:8123'
const SWAGGER_PATH = '/api/v2/api-docs'

/**
 * 存储已处理的引用节点，防止循环引用导致死循环
 */
const processedNodes = new WeakSet()

/**
 * 递归修复 Swagger JSON 中无法解析的 $ref 引用
 * 将 Springfox 生成的无效引用(如 #/definitions/List, #/definitions/Map«...»)
 * 替换为通用的 schema 定义
 */
function fixUnresolvableRefs(obj, definitions) {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj
  if (processedNodes.has(obj)) return obj
  processedNodes.add(obj)

  if (Array.isArray(obj)) {
    return obj.map(item => fixUnresolvableRefs(item, definitions))
  }

  const result = {}

  for (const [key, value] of Object.entries(obj)) {
    // 如果是有 $ref 属性的对象
    if (key === '$ref' && typeof value === 'string') {
      const refName = value.split('/').pop()
      // 解码 URL 编码的字符(如 « → %C2%AB)
      const decodedRefName = decodeURIComponent(refName)

      if (!definitions || !definitions[decodedRefName]) {
        // 该引用在 definitions 中不存在，替换为通用 schema
        if (decodedRefName === 'List' || decodedRefName.startsWith('List«')) {
          console.warn(`  [FIX] 替换无法解析的引用: ${value} → type: array`)
          return { type: 'array', items: { type: 'object' } }
        } else if (decodedRefName === 'Map' || decodedRefName.startsWith('Map«')) {
          console.warn(`  [FIX] 替换无法解析的引用: ${value} → type: object`)
          return { type: 'object', additionalProperties: true }
        } else if (decodedRefName.startsWith('Set«') || decodedRefName === 'Set') {
          console.warn(`  [FIX] 替换无法解析的引用: ${value} → type: array (unique)`)
          return { type: 'array', uniqueItems: true, items: { type: 'object' } }
        } else {
          console.warn(`  [FIX] 替换无法解析的引用: ${value} → type: object`)
          return { type: 'object' }
        }
      }
      return { $ref: value }
    }

    // 递归修复子属性
    result[key] = fixUnresolvableRefs(value, definitions)
  }

  return result
}

/**
 * 从后端获取 Swagger JSON
 */
function fetchSwagger(url) {
  return new Promise((resolve, reject) => {
    console.log(`📡 正在从 ${url} 获取 Swagger 文档...`)
    http.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
        return
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString())
          console.log(`✅ Swagger 文档获取成功 (${(Buffer.concat(chunks).length / 1024).toFixed(1)} KB)`)
          resolve(json)
        } catch (e) {
          reject(new Error(`JSON 解析失败: ${e.message}`))
        }
      })
    }).on('error', reject)
  })
}

/**
 * 主流程
 */
async function main() {
  const swaggerUrl = `${BACKEND_URL}${SWAGGER_PATH}`
  console.log(`🔧 后端地址: ${BACKEND_URL}`)

  try {
    // 1. 获取 Swagger JSON
    const swagger = await fetchSwagger(swaggerUrl)

    // 2. 修复无法解析的引用
    console.log('🔧 正在修复无法解析的 $ref 引用...')
    const definitions = swagger.definitions || {}
    const fixed = fixUnresolvableRefs(swagger, definitions)

    // 3. 保存修复后的文件
    fs.writeFileSync(FIXED_SCHEMA_FILE, JSON.stringify(fixed, null, 2), 'utf8')
    console.log(`💾 修复后的 Swagger 已保存到: ${FIXED_SCHEMA_FILE}`)

    // 4. 使用 @umijs/openapi 生成 service 代码
    console.log('🚀 正在生成 API service 代码...')
    await generateService({
      requestLibPath: "import request from '@/request'",
      schemaPath: FIXED_SCHEMA_FILE,
      serversPath: './src',
    })
    console.log('✅ API service 代码生成完成!')

    // 5. 清理临时文件
    fs.unlinkSync(FIXED_SCHEMA_FILE)
    console.log('🧹 临时文件已清理')
  } catch (e) {
    console.error('❌ 生成失败:', e.message)
    process.exit(1)
  }
}

main()
