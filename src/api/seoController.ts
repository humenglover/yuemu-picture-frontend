// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** getDailyNewContentIds GET /api/seo/daily-new */
export async function getDailyNewContentIdsUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseSeoDailyNewResponse_>('/api/seo/daily-new', {
    method: 'GET',
    ...(options || {}),
  })
}
