/**
 * 文本处理工具类
 */

/**
 * 将文本中的 URL 提取并替换为可点击的精简超链接
 * 同时处理换行符 \n -> <br/>
 * @param text 原始文本
 * @returns 格式化后的 HTML 字符串
 */
export const formatTextWithLinks = (text?: string): string => {
  if (!text) return ''

  // 1. 转义原始 HTML，防止 XSS
  let safeText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 2. 匹配 URL (http, https)
  // 匹配规则：以 http:// 或 https:// 开头，直到遇到空白字符
  const urlRegex = /(https?:\/\/[^\s]+)/g

  safeText = safeText.replace(urlRegex, (url) => {
    // 提取域名用于展示
    let displayDomain = '网页链接'
    try {
      const urlObj = new URL(url)
      displayDomain = urlObj.hostname.replace('www.', '')
      // 如果域名太长则截断
      if (displayDomain.length > 20) {
        displayDomain = displayDomain.substring(0, 20) + '...'
      }
    } catch (e) {
      // 忽略解析错误
    }

    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="yuemu-text-link" onclick="event.stopPropagation()" style="color: #1677ff; text-decoration: none; display: inline-flex; align-items: center; gap: 2px; margin: 0 2px;"><i class="fas fa-link" style="font-size: 12px;"></i> ${displayDomain}</a>`
  })

  // 3. 将换行符转为 <br/>
  return safeText.replace(/\n/g, '<br/>')
}
