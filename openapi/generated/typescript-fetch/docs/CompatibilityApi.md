# CompatibilityApi

All URIs are relative to *https://api.llmfaucet.dev*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**countAnthropicTokens**](CompatibilityApi.md#countanthropictokens) | **POST** /v1/messages/count_tokens |  |
| [**createAnthropicMessage**](CompatibilityApi.md#createanthropicmessage) | **POST** /v1/messages |  |
| [**createChatCompletion**](CompatibilityApi.md#createchatcompletion) | **POST** /v1/chat/completions |  |
| [**createCompletion**](CompatibilityApi.md#createcompletion) | **POST** /v1/completions |  |
| [**createEmbedding**](CompatibilityApi.md#createembedding) | **POST** /v1/embeddings |  |
| [**createResponse**](CompatibilityApi.md#createresponse) | **POST** /v1/responses |  |
| [**listModels**](CompatibilityApi.md#listmodels) | **GET** /v1/models |  |



## countAnthropicTokens

> CountAnthropicTokens200Response countAnthropicTokens(requestBody)



### Example

```ts
import {
  Configuration,
  CompatibilityApi,
} from '@llmfaucet/openapi-client';
import type { CountAnthropicTokensRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new CompatibilityApi();

  const body = {
    // { [key: string]: any | null; }
    requestBody: Object,
  } satisfies CountAnthropicTokensRequest;

  try {
    const data = await api.countAnthropicTokens(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **requestBody** | `{ [key: string]: any | null; }` |  | |

### Return type

[**CountAnthropicTokens200Response**](CountAnthropicTokens200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Token count |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createAnthropicMessage

> { [key: string]: any; } createAnthropicMessage(anthropicMessageRequest)



### Example

```ts
import {
  Configuration,
  CompatibilityApi,
} from '@llmfaucet/openapi-client';
import type { CreateAnthropicMessageRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new CompatibilityApi();

  const body = {
    // AnthropicMessageRequest
    anthropicMessageRequest: ...,
  } satisfies CreateAnthropicMessageRequest;

  try {
    const data = await api.createAnthropicMessage(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **anthropicMessageRequest** | [AnthropicMessageRequest](AnthropicMessageRequest.md) |  | |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Anthropic-compatible response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createChatCompletion

> ChatCompletionResponse createChatCompletion(chatCompletionRequest)



### Example

```ts
import {
  Configuration,
  CompatibilityApi,
} from '@llmfaucet/openapi-client';
import type { CreateChatCompletionRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new CompatibilityApi();

  const body = {
    // ChatCompletionRequest
    chatCompletionRequest: ...,
  } satisfies CreateChatCompletionRequest;

  try {
    const data = await api.createChatCompletion(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **chatCompletionRequest** | [ChatCompletionRequest](ChatCompletionRequest.md) |  | |

### Return type

[**ChatCompletionResponse**](ChatCompletionResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`, `text/event-stream`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Chat completion or SSE stream |  -  |
| **400** | Invalid request |  -  |
| **429** | Rate limit exceeded |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createCompletion

> { [key: string]: any; } createCompletion(completionRequest)



### Example

```ts
import {
  Configuration,
  CompatibilityApi,
} from '@llmfaucet/openapi-client';
import type { CreateCompletionRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new CompatibilityApi();

  const body = {
    // CompletionRequest
    completionRequest: ...,
  } satisfies CreateCompletionRequest;

  try {
    const data = await api.createCompletion(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **completionRequest** | [CompletionRequest](CompletionRequest.md) |  | |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Completion response |  -  |
| **400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createEmbedding

> { [key: string]: any; } createEmbedding(embeddingRequest)



### Example

```ts
import {
  Configuration,
  CompatibilityApi,
} from '@llmfaucet/openapi-client';
import type { CreateEmbeddingRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new CompatibilityApi();

  const body = {
    // EmbeddingRequest
    embeddingRequest: ...,
  } satisfies CreateEmbeddingRequest;

  try {
    const data = await api.createEmbedding(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **embeddingRequest** | [EmbeddingRequest](EmbeddingRequest.md) |  | |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Embeddings |  -  |
| **400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createResponse

> { [key: string]: any; } createResponse(responsesRequest)



### Example

```ts
import {
  Configuration,
  CompatibilityApi,
} from '@llmfaucet/openapi-client';
import type { CreateResponseRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new CompatibilityApi();

  const body = {
    // ResponsesRequest
    responsesRequest: ...,
  } satisfies CreateResponseRequest;

  try {
    const data = await api.createResponse(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **responsesRequest** | [ResponsesRequest](ResponsesRequest.md) |  | |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Responses API result |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listModels

> ModelList listModels()



### Example

```ts
import {
  Configuration,
  CompatibilityApi,
} from '@llmfaucet/openapi-client';
import type { ListModelsRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new CompatibilityApi();

  try {
    const data = await api.listModels();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**ModelList**](ModelList.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Model catalog |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

