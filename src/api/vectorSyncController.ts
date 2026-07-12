// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** getSyncProgressStream GET /api/api/vector/sync/progress/stream */
export async function getSyncProgressStreamUsingGet(options?: { [key: string]: any }) {
  return request<API.SseEmitter>('/api/api/vector/sync/progress/stream', {
    method: 'GET',
    ...(options || {}),
  })
}

/** startSync POST /api/api/vector/sync/start */
export async function startSyncUsingPost(options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean_>('/api/api/vector/sync/start', {
    method: 'POST',
    ...(options || {}),
  })
}
