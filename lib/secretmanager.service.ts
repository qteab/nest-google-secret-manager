import { Injectable, Inject } from '@nestjs/common'
import { SECRET_MANAGER_PRELOADED_DATA_TOKEN } from './constants'
import { SecretLoaderService } from './secretloader.service'
import { SecretNotLoadedException } from './exceptions'

@Injectable()
export class SecretManagerService {
  private secrets: Record<string, string>

  constructor(readonly secretLoaderService: SecretLoaderService, @Inject(SECRET_MANAGER_PRELOADED_DATA_TOKEN) secrets: Record<string, string>) {
    this.secrets = secrets
  }

  public getSecret(secret: string) {
    const value = this.secrets[secret]
    if (!value) {
      throw new SecretNotLoadedException('Secret not found')
    }
    return value
  }

  public getSecrets() {
    return this.secrets
  }

  public async loadSecretDynamic(secret: string) {
    const value = await this.secretLoaderService.loadSecret(secret)
    this.secrets = {
      ...this.secrets,
      [secret]: value,
    }
    return value
  }
}
