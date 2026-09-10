# WebhooksApi

All URIs are relative to *https://api.llmfaucet.dev*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**receiveGithubSponsorsWebhook**](WebhooksApi.md#receivegithubsponsorswebhook) | **POST** /webhooks/github-sponsors |  |



## receiveGithubSponsorsWebhook

> receiveGithubSponsorsWebhook(requestBody, xHubSignature256, xGitHubEvent)



### Example

```ts
import {
  Configuration,
  WebhooksApi,
} from '@llmfaucet/openapi-client';
import type { ReceiveGithubSponsorsWebhookRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new WebhooksApi();

  const body = {
    // { [key: string]: any; }
    requestBody: Object,
    // string (optional)
    xHubSignature256: xHubSignature256_example,
    // string (optional)
    xGitHubEvent: xGitHubEvent_example,
  } satisfies ReceiveGithubSponsorsWebhookRequest;

  try {
    const data = await api.receiveGithubSponsorsWebhook(body);
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
| **requestBody** | `{ [key: string]: any; }` |  | |
| **xHubSignature256** | `string` |  | [Optional] [Defaults to `undefined`] |
| **xGitHubEvent** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Webhook accepted |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

