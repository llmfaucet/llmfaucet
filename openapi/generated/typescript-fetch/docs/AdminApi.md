# AdminApi

All URIs are relative to *https://api.llmfaucet.dev*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**approveWaitlist**](AdminApi.md#approvewaitlist) | **POST** /api/admin/waitlist/{id}/approve |  |
| [**getWaitlistRecord**](AdminApi.md#getwaitlistrecord) | **GET** /api/admin/waitlist/{id} |  |
| [**listWaitlist**](AdminApi.md#listwaitlist) | **GET** /api/admin/waitlist |  |
| [**revokeWaitlist**](AdminApi.md#revokewaitlist) | **POST** /api/admin/waitlist/{id}/revoke |  |



## approveWaitlist

> { [key: string]: any; } approveWaitlist(id)



### Example

```ts
import {
  Configuration,
  AdminApi,
} from '@llmfaucet/openapi-client';
import type { ApproveWaitlistRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AdminApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies ApproveWaitlistRequest;

  try {
    const data = await api.approveWaitlist(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

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
| **200** | Approved record |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getWaitlistRecord

> { [key: string]: any; } getWaitlistRecord(id)



### Example

```ts
import {
  Configuration,
  AdminApi,
} from '@llmfaucet/openapi-client';
import type { GetWaitlistRecordRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AdminApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies GetWaitlistRecordRequest;

  try {
    const data = await api.getWaitlistRecord(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

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
| **200** | Waitlist record |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listWaitlist

> ListWaitlist200Response listWaitlist()



### Example

```ts
import {
  Configuration,
  AdminApi,
} from '@llmfaucet/openapi-client';
import type { ListWaitlistRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AdminApi(config);

  try {
    const data = await api.listWaitlist();
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

[**ListWaitlist200Response**](ListWaitlist200Response.md)

### Authorization

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Waitlist records |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## revokeWaitlist

> { [key: string]: any; } revokeWaitlist(id)



### Example

```ts
import {
  Configuration,
  AdminApi,
} from '@llmfaucet/openapi-client';
import type { RevokeWaitlistRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AdminApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies RevokeWaitlistRequest;

  try {
    const data = await api.revokeWaitlist(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

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
| **200** | Revoked record |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

