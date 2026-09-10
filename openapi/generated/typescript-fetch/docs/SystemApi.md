# SystemApi

All URIs are relative to *https://api.llmfaucet.dev*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**getHealth**](SystemApi.md#gethealth) | **GET** /health |  |
| [**getStatus**](SystemApi.md#getstatus) | **GET** /status |  |



## getHealth

> Health getHealth()



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '@llmfaucet/openapi-client';
import type { GetHealthRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new SystemApi();

  try {
    const data = await api.getHealth();
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

[**Health**](Health.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Health status |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getStatus

> Status getStatus()



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '@llmfaucet/openapi-client';
import type { GetStatusRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new SystemApi();

  try {
    const data = await api.getStatus();
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

[**Status**](Status.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Service status |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

