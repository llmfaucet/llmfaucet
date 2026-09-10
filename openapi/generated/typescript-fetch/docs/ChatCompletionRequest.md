
# ChatCompletionRequest


## Properties

Name | Type
------------ | -------------
`model` | string
`messages` | [Array&lt;ChatMessage&gt;](ChatMessage.md)
`stream` | boolean
`maxTokens` | number
`temperature` | number
`tools` | Array&lt;{ [key: string]: any; }&gt;
`toolChoice` | any
`responseFormat` | any

## Example

```typescript
import type { ChatCompletionRequest } from '@llmfaucet/openapi-client'

// TODO: Update the object below with actual values
const example = {
  "model": null,
  "messages": null,
  "stream": null,
  "maxTokens": null,
  "temperature": null,
  "tools": null,
  "toolChoice": null,
  "responseFormat": null,
} satisfies ChatCompletionRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ChatCompletionRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


