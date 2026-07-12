// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** getInteractionList GET /api/item/analytics/interactions */
export async function getInteractionListUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getInteractionListUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageInteractionUserVO_>('/api/item/analytics/interactions', {
    method: 'GET',
    params: {
      // current has a default value: 1
      current: '1',
      // size has a default value: 10
      size: '10',

      ...params,
    },
    ...(options || {}),
  })
}

/** getPictureAnalytics GET /api/item/analytics/picture/${param0} */
export async function getPictureAnalyticsUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPictureAnalyticsUsingGETParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponseItemAnalyticsVO_>(`/api/item/analytics/picture/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  })
}

/** getPostAnalytics GET /api/item/analytics/post/${param0} */
export async function getPostAnalyticsUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPostAnalyticsUsingGETParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponseItemAnalyticsVO_>(`/api/item/analytics/post/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  })
}
