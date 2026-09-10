
# Model


## Properties

Name | Type
------------ | -------------
`id` | string
`provider` | string
`capabilities` | Array&lt;string&gt;
`quality` | number
`speed` | number
`context` | number
`supportedParameters` | Array&lt;string&gt;

## Example

```typescript
import type { Model } from '@llmfaucet/openapi-client'

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "provider": null,
  "capabilities": null,
  "quality": null,
  "speed": null,
  "context": null,
  "supportedParameters": null,
} satisfies Model

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Model
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


