// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** addComment POST /api/comments/add */
export async function addCommentUsingPost(
  body: API.CommentsAddRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/comments/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** deleteComment POST /api/comments/delete */
export async function deleteCommentUsingPost(
  body: API.CommentsDeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/comments/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** likeComment POST /api/comments/like */
export async function likeCommentUsingPost(
  body: API.CommentsLikeRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/comments/like', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** queryComment POST /api/comments/query */
export async function queryCommentUsingPost(
  body: API.CommentsQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageCommentsVO_>('/api/comments/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
