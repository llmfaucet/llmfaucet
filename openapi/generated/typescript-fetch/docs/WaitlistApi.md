# WaitlistApi

All URIs are relative to *https://api.llmfaucet.dev*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**applyToWaitlist**](WaitlistApi.md#applytowaitlist) | **POST** /api/waitlist |  |
| [**createWaitlistKey**](WaitlistApi.md#createwaitlistkey) | **POST** /api/waitlist/me/key |  |
| [**getMyWaitlistApplication**](WaitlistApi.md#getmywaitlistapplication) | **GET** /api/waitlist/me |  |
| [**updateMyWaitlistApplication**](WaitlistApi.md#updatemywaitlistapplication) | **PATCH** /api/waitlist/me |  |



## applyToWaitlist

> { [key: string]: any; } applyToWaitlist(waitlistApplication)



### Example

```ts
import {
  Configuration,
  WaitlistApi,
} from '@llmfaucet/openapi-client';
import type { ApplyToWaitlistRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new WaitlistApi(config);

  const body = {
    // WaitlistApplication
    waitlistApplication: ...,
  } satisfies ApplyToWaitlistRequest;

  try {
    const data = await api.applyToWaitlist(body);
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
| **waitlistApplication** | [WaitlistApplication](WaitlistApplication.md) |  | |

### Return type

**{ [key: string]: any; }**

### Authorization

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Waitlist application |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createWaitlistKey

> ApiKey createWaitlistKey()



### Example

```ts
import {
  Configuration,
  WaitlistApi,
} from '@llmfaucet/openapi-client';
import type { CreateWaitlistKeyRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new WaitlistApi(config);

  try {
    const data = await api.createWaitlistKey();
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

[**ApiKey**](ApiKey.md)

### Authorization

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Waitlist API key |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getMyWaitlistApplication

> { [key: string]: any; } getMyWaitlistApplication()



### Example

```ts
import {
  Configuration,
  WaitlistApi,
} from '@llmfaucet/openapi-client';
import type { GetMyWaitlistApplicationRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new WaitlistApi(config);

  try {
    const data = await api.getMyWaitlistApplication();
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

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Current application |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## updateMyWaitlistApplication

> { [key: string]: any; } updateMyWaitlistApplication(waitlistApplication)



### Example

```ts
import {
  Configuration,
  WaitlistApi,
} from '@llmfaucet/openapi-client';
import type { UpdateMyWaitlistApplicationRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new WaitlistApi(config);

  const body = {
    // WaitlistApplication
    waitlistApplication: ...,
  } satisfies UpdateMyWaitlistApplicationRequest;

  try {
    const data = await api.updateMyWaitlistApplication(body);
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
| **waitlistApplication** | [WaitlistApplication](WaitlistApplication.md) |  | |

### Return type

**{ [key: string]: any; }**

### Authorization

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Updated application |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

