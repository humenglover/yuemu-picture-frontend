/**
 * 高级感文字封面生成工具 (Apple Premium Style)
 * 极致简约、低对比度渐变、SF排版、无多余装饰
 */

// 苹果风低饱和度、高级质感色系
const colorSchemes = [
  { // Titanium Silver (钛金属银)
    gradStart: '#FFFFFF',
    gradEnd: '#F2F2F4',
    text: '#1D1D1F',
    shadow: 'rgba(0,0,0,0.02)'
  },
  { // Starlight (星光色)
    gradStart: '#FCFBF9',
    gradEnd: '#F0EBE1',
    text: '#1D1D1F',
    shadow: 'rgba(0,0,0,0.02)'
  },
  { // Sierra Blue (远峰蓝)
    gradStart: '#F4F8FA',
    gradEnd: '#E4ECF3',
    text: '#1D1D1F',
    shadow: 'rgba(0,0,0,0.02)'
  },
  { // Frosted Mint (磨砂薄荷)
    gradStart: '#F5FAF7',
    gradEnd: '#E6F0EA',
    text: '#1D1D1F',
    shadow: 'rgba(0,0,0,0.02)'
  },
  { // Midnight Black (午夜暗色 - 适合反差)
    gradStart: '#2C2C2E',
    gradEnd: '#151516',
    text: '#F5F5F7',
    shadow: 'rgba(0,0,0,0.2)'
  },
  { // Rose Gold (玫瑰金)
    gradStart: '#FFF9F9',
    gradEnd: '#F5E6E6',
    text: '#1D1D1F',
    shadow: 'rgba(0,0,0,0.02)'
  }
]

/**
 * 计算字符串的简单哈希值
 */
function simpleHash(str: string): number {
  let hash = 0
  if (!str) return hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * 绘制苹果风极简平滑渐变背景
 */
function drawAppleBackground(ctx: CanvasRenderingContext2D, width: number, height: number, scheme: any) {
  // 对角线平滑渐变
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, scheme.gradStart)
  gradient.addColorStop(1, scheme.gradEnd)
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function smartTextSplit(text: string, maxLength: number = 8): string[] {
  if (!text) return ['']
  const lines: string[] = []
  let buf = ''
  for (let i = 0; i < text.length; i++) {
    buf += text[i]
    if (buf.length >= maxLength) {
      let splitIdx = buf.length - 1
      for (let j = buf.length - 1; j >= Math.max(0, buf.length - 4); j--) {
        if (/\s|[，。！？；：、,.!?:;]/.test(buf[j])) { splitIdx = j; break }
      }
      lines.push(buf.substring(0, splitIdx + 1).trim())
      buf = buf.substring(splitIdx + 1)
    }
  }
  if (buf) lines.push(buf.trim())
  return lines
}

function calculateFontSize(text: string, width: number, height: number): number {
  const lines = smartTextSplit(text, 8)
  const maxLen = Math.max(...lines.map(l => l.length))
  // 苹果风喜欢留白，字体可以适中，不要撑满
  const base = Math.min(width / (maxLen * 1.3), height / (lines.length * 3))
  return Math.max(18, Math.min(52, base))
}

function wrapTextByWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontFamily: string, fontSize: number): { lines: string[], fontSize: number, lineHeight: number } {
  let size = fontSize
  const minSize = 16
  const maxHeightRatio = 0.6 // 大量留白
  let lines: string[] = []
  let lineHeight = 0
  const buildLines = () => {
    ctx.font = `600 ${size}px ${fontFamily}`
    const out: string[] = []
    let buf = ''
    let lastBreak = -1
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      buf += ch
      if (/\s|[，。！？；：、,.!?:;]/.test(ch)) lastBreak = buf.length - 1
      if (ctx.measureText(buf).width > maxWidth) {
        let cut = lastBreak >= 0 ? lastBreak : buf.length - 1
        out.push(buf.substring(0, cut + 1).trim())
        buf = buf.substring(cut + 1)
        lastBreak = -1
      }
    }
    if (buf) out.push(buf.trim())
    return out
  }
  while (true) {
    lines = buildLines()
    lineHeight = size * 1.5 // 苹果风经典的 1.5 倍行距
    const totalHeight = lines.length * lineHeight
    if (totalHeight <= ctx.canvas.height * maxHeightRatio) break
    if (size <= minSize) {
      while (lines.length * lineHeight > ctx.canvas.height * maxHeightRatio && lines.length > 0) {
        const last = lines[lines.length - 1]
        let ell = last
        while (ctx.measureText(ell + '…').width > maxWidth && ell.length > 1) {
          ell = ell.slice(0, -1)
        }
        lines[lines.length - 1] = ell + '…'
        lines = lines.slice(0, Math.max(1, Math.floor((ctx.canvas.height * maxHeightRatio) / lineHeight)))
      }
      break
    }
    size = Math.max(minSize, Math.floor(size * 0.9))
  }
  return { lines, fontSize: size, lineHeight }
}

/**
 * 生成文字封面主函数
 */
export function generateTextCover(
  title: string,
  width: number = 300,
  height: number = 400
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    // 适配高清屏幕
    const scale = window.devicePixelRatio || 2
    canvas.width = width * scale
    canvas.height = height * scale
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.scale(scale, scale)

    const hash = simpleHash(title)
    const colorScheme = colorSchemes[hash % colorSchemes.length]

    // 1. 极简平滑背景
    drawAppleBackground(ctx, width, height, colorScheme)

    // 2. 苹果风排版 (SF Pro 风格)
    const fontFamily = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Helvetica Neue", sans-serif`
    const initialSize = calculateFontSize(title, width, height)

    // 增加左右 Margin，强制大量留白，呼吸感
    const paddingX = Math.floor(width * 0.12)
    const maxTextWidth = width - paddingX * 2

    const wrapped = wrapTextByWidth(ctx, title, maxTextWidth, fontFamily, initialSize)

    ctx.font = `700 ${wrapped.fontSize}px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const totalHeight = wrapped.lines.length * wrapped.lineHeight
    const startY = (height - totalHeight) / 2 + wrapped.lineHeight / 2

    // 3. 绘制文字主体
    wrapped.lines.forEach((line, index) => {
      const y = startY + index * wrapped.lineHeight

      // 极其细微的阴影，增加文字与背景的层次感，但不显脏
      ctx.shadowColor = colorScheme.shadow
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 4

      ctx.fillStyle = colorScheme.text
      ctx.fillText(line, width / 2, y)

      // 清除阴影
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
    })

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    resolve(dataUrl)
  })
}

/**
 * 缓存控制
 */
const coverCache = new Map<string, string>()

export async function getTextCover(
  title: string,
  width: number = 300,
  height: number = 400
): Promise<string> {
  const cacheKey = `${title}_${width}_${height}`

  if (coverCache.has(cacheKey)) {
    return coverCache.get(cacheKey)!
  }

  const cover = await generateTextCover(title, width, height)
  coverCache.set(cacheKey, cover)

  if (coverCache.size > 100) {
    const firstKey = coverCache.keys().next().value
    coverCache.delete(firstKey)
  }

  return cover
}

export function clearTextCoverCache(): void {
  coverCache.clear()
}
