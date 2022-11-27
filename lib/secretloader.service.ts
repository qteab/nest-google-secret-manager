import { Injectable, Inject } from '@nestjs/common'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { SECRET_MANAGER_CLIENT_TOKEN } from './constants'
import { SecretLoadException } from './exceptions'

@Injectable()
export class SecretLoaderService {
  private readonly client: SecretManagerServiceClient
  constructor(@Inject(SECRET_MANAGER_CLIENT_TOKEN) client: SecretManagerServiceClient) {
    this.client = client
  }

  public async loadSecret(secret: string) {
    return SecretLoaderService.staticLoadSecret(this.client, secret)
  }

  private static async staticLoadSecret(client: SecretManagerServiceClient, secret: string) {
    try {
      const secretData = await client.accessSecretVersion({
        name: secret,
      })
      const value = secretData[0].payload?.data?.toString()
      if (!value) {
        throw new SecretLoadException('Secret has no value')
      }
      return value
    } catch (e) {
      if (e instanceof Error) {
        throw new SecretLoadException(e.message)
      }
      throw new SecretLoadException('Unknown error')
    }
  }

  public static async staticLoadSecrets(client: SecretManagerServiceClient, secrets: string[]) {
    const promises = secrets.map((secret) => this.staticLoadSecret(client, secret))
    const secretValues = await Promise.all(promises)

    const secretObject = secrets.reduce((obj, key, index) => {
      return {
        ...obj,
        [key]: secretValues[index],
      }
    }, {})
    return secretObject
  }
}
