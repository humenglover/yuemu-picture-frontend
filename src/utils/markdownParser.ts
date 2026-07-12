import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (__) {}
    }
    return '' // 使用默认的转义
  }
})

// 配置 markdown-it 选项
md.set({
  breaks: true, // 转换换行符为 <br>
})

export function parseMarkdown(text: string): string {
  if (!text) return '';

  // 1. 强力解压缩并过滤原生 HTML 标签（<p>, </p>）以及转义实体（&lt;p&gt;, &lt;/p&gt;），防止其屏蔽内部 Markdown 语法的二次解析
  let processedText = text
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/&lt;p&gt;/gi, '')
    .replace(/&lt;\/p&gt;/gi, '\n');

  // 修复 Markdown 标题前面缺失换行符的情况
  // 比如 "好的！ ## 标题" 修正为 "好的！\n\n## 标题"
  processedText = processedText.replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2');

  // 自动在标题标识符（#、## 等）与标题文字之间补全缺失的空格
  // 比如 "##六、" 修正为 "## 六、"，从而让标准的 markdown 渲染器能够正常识别并渲染
  processedText = processedText.replace(/^(#{1,6})([^\s#])([^\n]*)$/gm, '$1 $2$3');

  // 2. 双星号定界符外侧空气安全隔离（解决紧贴 Emoji 如 ✂️、全角标点、特殊字符导致解析器边界算法错乱不渲染的 Bug）
  processedText = processedText.replace(/([^\s\*\n])\*\*/g, '$1 **');
  processedText = processedText.replace(/\*\*([^\s\*\n])/g, '** $1');

  // 3. 成对双星号内侧空气完美净化舱（神级精准，只净化星号内侧，绝不伤及外侧用于同 Emoji、全角标点、特殊字符隔离的空气边界）
  processedText = processedText.replace(/\*\*([^\*]+?)\*\*/g, (match, p1) => {
    return `**${p1.trim()}**`;
  });

  // 4. 自动修复 AI 截断时生成的未闭合的 markdown 链接（放置于末尾）
  processedText = processedText.replace(/\*\[([^\]]*)\]\(([^\)]*)$/g, '*[$1]($2)*');
  processedText = processedText.replace(/\[([^\]]*)\]\(([^\)]*)$/g, '[$1]($2)');

  // Convert [附图: url] to standard markdown image ![图片](url) before rendering
  processedText = processedText.replace(/\[附图:\s*(https?:\/\/[^\]】\)]+?)\s*[\]】\)]/g, '![送出的图片]($1)');
  return md.render(processedText)
}

// 移除HTML标签的函数，用于预览
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}
