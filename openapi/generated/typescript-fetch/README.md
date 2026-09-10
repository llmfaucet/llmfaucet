# @llmfaucet/openapi-client@0.1.0

A TypeScript SDK client for the api.llmfaucet.dev API.

## Usage

First, install the SDK from npm.

```bash
npm install @llmfaucet/openapi-client --save
```

Next, try it out.


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


## Documentation

### API Endpoints

All URIs are relative to *https://api.llmfaucet.dev*

| Class | Method | HTTP request | Description
| ----- | ------ | ------------ | -------------
*AccountApi* | [**completeOnboarding**](docs/AccountApi.md#completeonboarding) | **POST** /account/onboarding/complete | 
*AccountApi* | [**createApiKey**](docs/AccountApi.md#createapikeyoperation) | **POST** /account/keys | 
*AccountApi* | [**deleteAccount**](docs/AccountApi.md#deleteaccount) | **DELETE** /account | 
*AccountApi* | [**dismissOnboarding**](docs/AccountApi.md#dismissonboarding) | **POST** /account/onboarding/dismiss | 
*AccountApi* | [**finishGithubOAuth**](docs/AccountApi.md#finishgithuboauth) | **GET** /auth/github/callback | 
*AccountApi* | [**getAccount**](docs/AccountApi.md#getaccount) | **GET** /account | 
*AccountApi* | [**getAccountUsage**](docs/AccountApi.md#getaccountusage) | **GET** /account/usage | 
*AccountApi* | [**getPreferences**](docs/AccountApi.md#getpreferences) | **GET** /account/preferences | 
*AccountApi* | [**getV1Usage**](docs/AccountApi.md#getv1usage) | **GET** /v1/usage | 
*AccountApi* | [**listApiKeys**](docs/AccountApi.md#listapikeys) | **GET** /account/keys | 
*AccountApi* | [**logout**](docs/AccountApi.md#logout) | **POST** /auth/logout | 
*AccountApi* | [**replayOnboarding**](docs/AccountApi.md#replayonboarding) | **POST** /account/onboarding/replay | 
*AccountApi* | [**revokeApiKey**](docs/AccountApi.md#revokeapikey) | **DELETE** /account/keys/{id} | 
*AccountApi* | [**startGithubOAuth**](docs/AccountApi.md#startgithuboauth) | **GET** /auth/github | 
*AccountApi* | [**syncSponsorship**](docs/AccountApi.md#syncsponsorship) | **POST** /account/sync-sponsorship | 
*AccountApi* | [**updatePreferences**](docs/AccountApi.md#updatepreferences) | **PATCH** /account/preferences | 
*AdminApi* | [**approveWaitlist**](docs/AdminApi.md#approvewaitlist) | **POST** /api/admin/waitlist/{id}/approve | 
*AdminApi* | [**getWaitlistRecord**](docs/AdminApi.md#getwaitlistrecord) | **GET** /api/admin/waitlist/{id} | 
*AdminApi* | [**listWaitlist**](docs/AdminApi.md#listwaitlist) | **GET** /api/admin/waitlist | 
*AdminApi* | [**revokeWaitlist**](docs/AdminApi.md#revokewaitlist) | **POST** /api/admin/waitlist/{id}/revoke | 
*CompatibilityApi* | [**countAnthropicTokens**](docs/CompatibilityApi.md#countanthropictokens) | **POST** /v1/messages/count_tokens | 
*CompatibilityApi* | [**createAnthropicMessage**](docs/CompatibilityApi.md#createanthropicmessage) | **POST** /v1/messages | 
*CompatibilityApi* | [**createChatCompletion**](docs/CompatibilityApi.md#createchatcompletion) | **POST** /v1/chat/completions | 
*CompatibilityApi* | [**createCompletion**](docs/CompatibilityApi.md#createcompletion) | **POST** /v1/completions | 
*CompatibilityApi* | [**createEmbedding**](docs/CompatibilityApi.md#createembedding) | **POST** /v1/embeddings | 
*CompatibilityApi* | [**createResponse**](docs/CompatibilityApi.md#createresponse) | **POST** /v1/responses | 
*CompatibilityApi* | [**listModels**](docs/CompatibilityApi.md#listmodels) | **GET** /v1/models | 
*PublicApi* | [**getPublicGithub**](docs/PublicApi.md#getpublicgithub) | **GET** /api/public/github | 
*PublicApi* | [**getPublicMetrics**](docs/PublicApi.md#getpublicmetrics) | **GET** /api/public/metrics | 
*PublicApi* | [**getPublicSponsors**](docs/PublicApi.md#getpublicsponsors) | **GET** /api/public/sponsors | 
*SystemApi* | [**getHealth**](docs/SystemApi.md#gethealth) | **GET** /health | 
*SystemApi* | [**getStatus**](docs/SystemApi.md#getstatus) | **GET** /status | 
*WaitlistApi* | [**applyToWaitlist**](docs/WaitlistApi.md#applytowaitlist) | **POST** /api/waitlist | 
*WaitlistApi* | [**createWaitlistKey**](docs/WaitlistApi.md#createwaitlistkey) | **POST** /api/waitlist/me/key | 
*WaitlistApi* | [**getMyWaitlistApplication**](docs/WaitlistApi.md#getmywaitlistapplication) | **GET** /api/waitlist/me | 
*WaitlistApi* | [**updateMyWaitlistApplication**](docs/WaitlistApi.md#updatemywaitlistapplication) | **PATCH** /api/waitlist/me | 
*WebhooksApi* | [**receiveGithubSponsorsWebhook**](docs/WebhooksApi.md#receivegithubsponsorswebhook) | **POST** /webhooks/github-sponsors | 


### Models

- [AnthropicMessageRequest](docs/AnthropicMessageRequest.md)
- [ApiKey](docs/ApiKey.md)
- [ChatCompletionRequest](docs/ChatCompletionRequest.md)
- [ChatCompletionResponse](docs/ChatCompletionResponse.md)
- [ChatMessage](docs/ChatMessage.md)
- [CompletionRequest](docs/CompletionRequest.md)
- [CountAnthropicTokens200Response](docs/CountAnthropicTokens200Response.md)
- [CreateApiKeyRequest](docs/CreateApiKeyRequest.md)
- [EmbeddingRequest](docs/EmbeddingRequest.md)
- [Health](docs/Health.md)
- [ListApiKeys200Response](docs/ListApiKeys200Response.md)
- [ListWaitlist200Response](docs/ListWaitlist200Response.md)
- [Model](docs/Model.md)
- [ModelError](docs/ModelError.md)
- [ModelList](docs/ModelList.md)
- [ResponsesRequest](docs/ResponsesRequest.md)
- [SponsorDirectory](docs/SponsorDirectory.md)
- [Status](docs/Status.md)
- [TokenUsage](docs/TokenUsage.md)
- [WaitlistApplication](docs/WaitlistApplication.md)

### Authorization


Authentication schemes defined for the API:
<a id="bearerAuth"></a>
#### bearerAuth


- **Type**: HTTP Bearer Token authentication
<a id="sessionCookie"></a>
#### sessionCookie


- **Type**: API key
- **API key parameter name**: `llmfaucet_session`
- **Location**: 

## About

This TypeScript SDK client supports the [Fetch API](https://fetch.spec.whatwg.org/)
and is automatically generated by the
[OpenAPI Generator](https://openapi-generator.tech) project:

- API version: `0.1.0`
- Package version: `0.1.0`
- Generator version: `7.25.0`
- Build package: `org.openapitools.codegen.languages.TypeScriptFetchClientCodegen`

The generated npm module supports the following:

- Environments
  * Node.js
  * Webpack
  * Browserify
- Language levels
  * ES5 - you must have a Promises/A+ library installed
  * ES6
- Module systems
  * CommonJS
  * ES6 module system


## Development

### Building

To build the TypeScript source code, you need to have Node.js and npm installed.
After cloning the repository, navigate to the project directory and run:

```bash
npm install
npm run build
```

### Publishing

Once you've built the package, you can publish it to npm:

```bash
npm publish
```

## License

[]()
