# @qte/nest-google-secret-manager
A module for reading Google Secret Manager secrets in Nest.

## Installation

```bash
$ yarn add @qte/nest-google-secret-manager
```

## Quick start
Import and use the module with a list of secrets to preload.
```ts
SecretManagerModule.register({
  secrets: ['project/some-project/secrets/some-secret/versions/latest'],
})
```

Use the `SecretManagerService` to get any preloaded secret, or to dynamically load more secrets.

## License
@qte/nest-google-secret-manager is [MIT licensed](LICENSE).
