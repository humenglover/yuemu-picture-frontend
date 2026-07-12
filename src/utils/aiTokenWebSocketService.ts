import { ref } from 'vue'

const wsUrl = import.meta.env.VITE_WS_URL || (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host

// 消息类型定义
interface EventHandler {
  (data?: unknown): void
}

interface EventHandlers {
  [key: string]: EventHandler[]
}

interface AiTokenWebSocketMessage {
  type: 'HEARTBEAT' | 'ERROR' | 'ai_token_usage_response'
  data?: any
  message?: string
  time?: string
}

export class AiTokenWebSocketService {
  private ws: WebSocket | null = null
  private eventHandlers: EventHandlers = {}
  private connecting: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectTimeout: number = 3000
  private heartbeatInterval: number | null = null
  private userId: string | null = null
  public isConnected = ref(false)
  private lastHeartbeatResponseTime: number = Date.now()

  // 单例模式
  private static instance: AiTokenWebSocketService | null = null

  private constructor() {}

  public static getInstance(): AiTokenWebSocketService {
    if (!AiTokenWebSocketService.instance) {
      AiTokenWebSocketService.instance = new AiTokenWebSocketService()
    }
    return AiTokenWebSocketService.instance
  }

  public async connect(userId: string | number): Promise<void> {
    if (!userId) {
      console.log('[AiTokenWebSocket] 用户未登录，无法建立连接')
      return
    }

    if (this.connecting || this.isConnected.value) {
      console.log('[AiTokenWebSocket] 已经连接或正在连接中')
      if (this.ws && this.isConnected.value) {
        this.disconnect()
      }
      return
    }

    this.userId = String(userId)
    this.connecting = true

    try {
      console.log('[AiTokenWebSocket] 开始连接...')
      const wsEndpoint = `${wsUrl}/api/ws/ai-token?userId=${this.userId}`
      this.ws = new WebSocket(wsEndpoint)

      this.ws.onopen = () => {
        console.log('[AiTokenWebSocket] 连接成功')
        this.isConnected.value = true
        this.connecting = false
        this.reconnectAttempts = 0
        this.lastHeartbeatResponseTime = Date.now()
        this.startHeartbeat()
        this.emit('connect')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'HEARTBEAT' || data === 'pong') {
            // console.log('[AiTokenWebSocket] 收到心跳响应')
            this.lastHeartbeatResponseTime = Date.now();
            return;
          }
          this.handleMessage(event)
        } catch (e) {
          if (event.data === 'pong') {
            this.lastHeartbeatResponseTime = Date.now();
            return;
          }
        }
      }

      this.ws.onclose = () => {
        console.log('[AiTokenWebSocket] 连接关闭')
        this.isConnected.value = false
        this.connecting = false
        this.stopHeartbeat()
        this.emit('disconnect')
        this.reconnect()
      }

      this.ws.onerror = (error) => {
        console.error('[AiTokenWebSocket] 连接错误:', error)
        this.isConnected.value = false
        this.connecting = false
        this.emit('error', error)
      }
    } catch (error) {
      console.error('[AiTokenWebSocket] 连接失败:', error)
      this.connecting = false
      this.reconnect()
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[AiTokenWebSocket] 重连次数超过限制，停止重连')
      this.reconnectAttempts = 0
      return
    }

    if (!this.userId) {
      return
    }

    this.reconnectAttempts++
    console.log(`[AiTokenWebSocket] 尝试第 ${this.reconnectAttempts} 次重连...`)

    const actualTimeout = this.reconnectTimeout * this.reconnectAttempts
    setTimeout(() => {
      this.connect(this.userId!)
    }, actualTimeout)
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatInterval = window.setInterval(() => {
      if (this.isConnected.value && this.ws) {
        try {
          // 发送心跳消息
          this.ws.send('ping')

          setTimeout(() => {
            if (Date.now() - this.lastHeartbeatResponseTime > 60000) {
              console.warn('[AiTokenWebSocket] 心跳响应超时，尝试重连')
              this.ws?.close()
            }
          }, 15000)
        } catch (error) {
          console.error('[AiTokenWebSocket] 发送心跳失败:', error)
        }
      }
    }, 30000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  public sendMessage(message: any): void {
    if (!this.isConnected.value || !this.ws) {
      console.warn('[AiTokenWebSocket] 未连接，无法发送消息')
      if (!this.connecting && this.userId) {
        this.connect(this.userId)
      }
      return
    }

    try {
      this.ws.send(JSON.stringify(message))
    } catch (error) {
      console.error('[AiTokenWebSocket] 发送消息失败:', error)
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data: AiTokenWebSocketMessage = JSON.parse(event.data)
      
      if (data.type === 'ai_token_usage_response') {
        // 触发全局事件，通知更新用量
        window.dispatchEvent(new CustomEvent('aiTokenUsageUpdated', {
          detail: data.data
        }))
      }

      this.emit('message', data)
    } catch (error) {
      console.error('[AiTokenWebSocket] 处理消息失败:', error)
      this.emit('error', error)
    }
  }

  public on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = []
    }
    this.eventHandlers[event].push(handler)
  }

  public off(event: string, handler: EventHandler): void {
    if (!this.eventHandlers[event]) return
    this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler)
  }

  private emit(event: string, data?: unknown): void {
    if (!this.eventHandlers[event]) return
    this.eventHandlers[event].forEach(handler => handler(data))
  }

  public disconnect(): void {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected.value = false
    this.userId = null
    this.reconnectAttempts = 0
  }
}

export const aiTokenWebSocketService = AiTokenWebSocketService.getInstance()
