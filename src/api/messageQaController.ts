// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** getAiTokenUsage GET /api/rag/qa/message/ai_token/usage */
export async function getAiTokenUsageUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseAiTokenUsageVO_>('/api/rag/qa/message/ai_token/usage', {
    method: 'GET',
    ...(options || {}),
  })
}

/** getQaAnswer POST /api/rag/qa/message/answer */
export async function getQaAnswerUsingPost(
  body: API.QaMessageQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseRagMessageVO_>('/api/rag/qa/message/answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** clearSessionContext POST /api/rag/qa/message/clearContext */
export async function clearSessionContextUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.clearSessionContextUsingPOSTParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseRagMessageVO_>('/api/rag/qa/message/clearContext', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** deleteMessageById POST /api/rag/qa/message/delete/admin */
export async function deleteMessageByIdUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/rag/qa/message/delete/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** getMessageById GET /api/rag/qa/message/get */
export async function getMessageByIdUsingGet1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getMessageByIdUsingGET1Params,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseRagMessageVO_>('/api/rag/qa/message/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** deductImageGenQuota POST /api/rag/qa/message/image_gen/quota/deduct */
export async function deductImageGenQuotaUsingPost(options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean_>('/api/rag/qa/message/image_gen/quota/deduct', {
    method: 'POST',
    ...(options || {}),
  })
}

/** listQaMessages GET /api/rag/qa/message/list */
export async function listQaMessagesUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listQaMessagesUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseIPageRagMessageVO_>('/api/rag/qa/message/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** listAllMessagesByPage POST /api/rag/qa/message/list/page */
export async function listAllMessagesByPageUsingPost(
  body: API.QaMessageQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseIPageRagMessageVO_>('/api/rag/qa/message/list/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** sendQaMessage POST /api/rag/qa/message/send */
export async function sendQaMessageUsingPost(
  body: API.QaMessageAddRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseRagMessageVO_>('/api/rag/qa/message/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** sendQaStreamMessage GET /api/rag/qa/message/send/stream */
export async function sendQaStreamMessageUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.sendQaStreamMessageUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.SseEmitter>('/api/rag/qa/message/send/stream', {
    method: 'GET',
    params: {
      // model has a default value: Qwen3.5-Flash
      model: 'Qwen3.5-Flash',
      ...params,
    },
    ...(options || {}),
  })
}

/** getTtsAudio GET /api/rag/qa/message/tts */
export async function getTtsAudioUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTtsAudioUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<string>('/api/rag/qa/message/tts', {
    method: 'GET',
    params: {
      // voiceType has a default value: female_gentle
      voiceType: 'female_gentle',
      ...params,
    },
    ...(options || {}),
  })
}
