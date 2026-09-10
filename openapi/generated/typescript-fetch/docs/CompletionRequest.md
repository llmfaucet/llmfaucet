
# CompletionRequest


## Properties

Name | Type
------------ | -------------
`model` | string
`prompt` | any
`maxTokens` | number
`temperature` | number
`stream` | boolean

## Example

```typescript
import type { CompletionRequest } from '@llmfaucet/openapi-client'

// TODO: Update the object below with actual values
const example = {
  "model": null,
  "prompt": null,
  "maxTokens": null,
  "temperature": null,
  "stream": null,
} satisfies CompletionRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CompletionRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


