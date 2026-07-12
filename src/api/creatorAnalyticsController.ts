// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** getMyAnalytics GET /api/creator/analytics/my */
export async function getMyAnalyticsUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseCreatorAnalyticsVO_>('/api/creator/analytics/my', {
    method: 'GET',
    ...(options || {}),
  })
}

/** getUserAnalytics GET /api/creator/analytics/user */
export async function getUserAnalyticsUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserAnalyticsUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseCreatorAnalyticsVO_>('/api/creator/analytics/user', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}
