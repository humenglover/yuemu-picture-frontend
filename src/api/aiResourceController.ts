// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** addAiResource POST /api/ai_resource/add */
export async function addAiResourceUsingPost(
  body: API.AiResource,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>('/api/ai_resource/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** deleteAiResource POST /api/ai_resource/delete */
export async function deleteAiResourceUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/ai_resource/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** listMyAiResourceByPage GET /api/ai_resource/my/page */
export async function listMyAiResourceByPageUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listMyAiResourceByPageUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageAiResource_>('/api/ai_resource/my/page', {
    method: 'GET',
    params: {
      // current has a default value: 1
      current: '1',
      // pageSize has a default value: 10
      pageSize: '10',
      ...params,
    },
    ...(options || {}),
  })
}

/** updateAiResource POST /api/ai_resource/update */
export async function updateAiResourceUsingPost(
  body: API.AiResource,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/ai_resource/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
