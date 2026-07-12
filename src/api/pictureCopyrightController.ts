// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** getCopyrightByPictureId GET /api/picture/copyright/get */
export async function getCopyrightByPictureIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getCopyrightByPictureIdUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseCopyrightInfoVO_>('/api/picture/copyright/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** registerCopyright POST /api/picture/copyright/register */
export async function registerCopyrightUsingPost(
  body: API.CopyrightRegisterRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>('/api/picture/copyright/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** traceCopyright POST /api/picture/copyright/trace */
export async function traceCopyrightUsingPost(
  body: API.CopyrightTraceRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseCopyrightInfoVO_>('/api/picture/copyright/trace', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** updateCopyright POST /api/picture/copyright/update */
export async function updateCopyrightUsingPost(
  body: API.CopyrightRegisterRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/picture/copyright/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
