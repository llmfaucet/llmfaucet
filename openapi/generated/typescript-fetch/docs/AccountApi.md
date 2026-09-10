# AccountApi

All URIs are relative to *https://api.llmfaucet.dev*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**completeOnboarding**](AccountApi.md#completeonboarding) | **POST** /account/onboarding/complete |  |
| [**createApiKey**](AccountApi.md#createapikeyoperation) | **POST** /account/keys |  |
| [**deleteAccount**](AccountApi.md#deleteaccount) | **DELETE** /account |  |
| [**dismissOnboarding**](AccountApi.md#dismissonboarding) | **POST** /account/onboarding/dismiss |  |
| [**finishGithubOAuth**](AccountApi.md#finishgithuboauth) | **GET** /auth/github/callback |  |
| [**getAccount**](AccountApi.md#getaccount) | **GET** /account |  |
| [**getAccountUsage**](AccountApi.md#getaccountusage) | **GET** /account/usage |  |
| [**getPreferences**](AccountApi.md#getpreferences) | **GET** /account/preferences |  |
| [**getV1Usage**](AccountApi.md#getv1usage) | **GET** /v1/usage |  |
| [**listApiKeys**](AccountApi.md#listapikeys) | **GET** /account/keys |  |
| [**logout**](AccountApi.md#logout) | **POST** /auth/logout |  |
| [**replayOnboarding**](AccountApi.md#replayonboarding) | **POST** /account/onboarding/replay |  |
| [**revokeApiKey**](AccountApi.md#revokeapikey) | **DELETE** /account/keys/{id} |  |
| [**startGithubOAuth**](AccountApi.md#startgithuboauth) | **GET** /auth/github |  |
| [**syncSponsorship**](AccountApi.md#syncsponsorship) | **POST** /account/sync-sponsorship |  |
| [**updatePreferences**](AccountApi.md#updatepreferences) | **PATCH** /account/preferences |  |



## completeOnboarding

> completeOnboarding()



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { CompleteOnboardingRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AccountApi(config);

  try {
    const data = await api.completeOnboarding();
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

`void` (Empty response body)

### Authorization

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Onboarding completed |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createApiKey

> ApiKey createApiKey(createApiKeyRequest)



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { CreateApiKeyOperationRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AccountApi(config);

  const body = {
    // CreateApiKeyRequest
    createApiKeyRequest: ...,
  } satisfies CreateApiKeyOperationRequest;

  try {
    const data = await api.createApiKey(body);
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
| **createApiKeyRequest** | [CreateApiKeyRequest](CreateApiKeyRequest.md) |  | |

### Return type

[**ApiKey**](ApiKey.md)

### Authorization

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | API key created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteAccount

> deleteAccount()



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { DeleteAccountRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AccountApi(config);

  try {
    const data = await api.deleteAccount();
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

`void` (Empty response body)

### Authorization

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Account deleted |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## dismissOnboarding

> dismissOnboarding()



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { DismissOnboardingRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AccountApi(config);

  try {
    const data = await api.dismissOnboarding();
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

`void` (Empty response body)

### Authorization

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Onboarding dismissed |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## finishGithubOAuth

> finishGithubOAuth(code, state)



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { FinishGithubOAuthRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new AccountApi();

  const body = {
    // string
    code: code_example,
    // string
    state: state_example,
  } satisfies FinishGithubOAuthRequest;

  try {
    const data = await api.finishGithubOAuth(body);
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
| **code** | `string` |  | [Defaults to `undefined`] |
| **state** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **302** | Redirect to the web application |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getAccount

> { [key: string]: any; } getAccount()



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { GetAccountRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AccountApi(config);

  try {
    const data = await api.getAccount();
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

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Account |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getAccountUsage

> { [key: string]: any; } getAccountUsage()



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { GetAccountUsageRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AccountApi(config);

  try {
    const data = await api.getAccountUsage();
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
| **200** | Account usage |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getPreferences

> { [key: string]: any; } getPreferences()



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { GetPreferencesRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AccountApi(config);

  try {
    const data = await api.getPreferences();
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
| **200** | Preferences |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getV1Usage

> { [key: string]: any; } getV1Usage()



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { GetV1UsageRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AccountApi(config);

  try {
    const data = await api.getV1Usage();
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

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Usage |  -  |
| **401** | Authentication required |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listApiKeys

> ListApiKeys200Response listApiKeys()



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { ListApiKeysRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AccountApi(config);

  try {
    const data = await api.listApiKeys();
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

[**ListApiKeys200Response**](ListApiKeys200Response.md)

### Authorization

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | API keys |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## logout

> logout()



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { LogoutRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AccountApi(config);

  try {
    const data = await api.logout();
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

`void` (Empty response body)

### Authorization

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Session ended |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## replayOnboarding

> replayOnboarding()



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { ReplayOnboardingRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AccountApi(config);

  try {
    const data = await api.replayOnboarding();
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

`void` (Empty response body)

### Authorization

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Onboarding replay enabled |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## revokeApiKey

> revokeApiKey(id)



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { RevokeApiKeyRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AccountApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies RevokeApiKeyRequest;

  try {
    const data = await api.revokeApiKey(body);
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

`void` (Empty response body)

### Authorization

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | API key revoked |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## startGithubOAuth

> startGithubOAuth()



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { StartGithubOAuthRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const api = new AccountApi();

  try {
    const data = await api.startGithubOAuth();
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

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **302** | Redirect to GitHub OAuth |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## syncSponsorship

> { [key: string]: any | null; } syncSponsorship()



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { SyncSponsorshipRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AccountApi(config);

  try {
    const data = await api.syncSponsorship();
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

[sessionCookie](../README.md#sessionCookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Sponsorship synchronized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## updatePreferences

> { [key: string]: any; } updatePreferences(requestBody)



### Example

```ts
import {
  Configuration,
  AccountApi,
} from '@llmfaucet/openapi-client';
import type { UpdatePreferencesRequest } from '@llmfaucet/openapi-client';

async function example() {
  console.log("🚀 Testing @llmfaucet/openapi-client SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
  });
  const api = new AccountApi(config);

  const body = {
    // { [key: string]: any; }
    requestBody: Object,
  } satisfies UpdatePreferencesRequest;

  try {
    const data = await api.updatePreferences(body);
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
| **200** | Updated preferences |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

