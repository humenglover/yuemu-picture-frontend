// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** UserLike POST /api/picturelike/like */
export async function userLikeUsingPost(
  body: API.PictureLikeRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/picturelike/like', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** UserShare POST /api/picturelike/share/${param0} */
export async function userShareUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.UserShareUsingPOSTParams,
  options?: { [key: string]: any }
) {
  const { pictureId: param0, ...queryParams } = params
  return request<API.BaseResponseBoolean_>(`/api/picturelike/share/${param0}`, {
    method: 'POST',
    params: { ...queryParams },
    ...(options || {}),
  })
}
