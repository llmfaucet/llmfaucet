# PublicApi

All URIs are relative to *https://api.llmfaucet.dev*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**getPublicGithub**](PublicApi.md#getpublicgithub) | **GET** /api/public/github |  |
| [**getPublicMetrics**](PublicApi.md#getpublicmetrics) | **GET** /api/public/metrics |  |
| [**getPublicSponsors**](PublicApi.md#getpublicsponsors) | **GET** /api/public/sponsors |  |



## getPublicGithub

> { [key: string]: any | null; } getPublicGithub()



### Example

```ts
import {
  Configuration,
  PublicApi,
} from '@llmfaucet/openapi-client';
import type { GetPublicGithubRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new PublicApi();

  try {
    const data = await api.getPublicGithub();
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

**{ [key: string]: any | null; }**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Public GitHub data |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getPublicMetrics

> { [key: string]: any; } getPublicMetrics()



### Example

```ts
import {
  Configuration,
  PublicApi,
} from '@llmfaucet/openapi-client';
import type { GetPublicMetricsRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new PublicApi();

  try {
    const data = await api.getPublicMetrics();
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

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Public metrics |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getPublicSponsors

> SponsorDirectory getPublicSponsors()



### Example

```ts
import {
  Configuration,
  PublicApi,
} from '@llmfaucet/openapi-client';
import type { GetPublicSponsorsRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new PublicApi();

  try {
    const data = await api.getPublicSponsors();
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

[**SponsorDirectory**](SponsorDirectory.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Sponsor directory |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

