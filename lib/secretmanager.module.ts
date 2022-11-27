import { DynamicModule, Module } from '@nestjs/common'
import { SECRET_MANAGER_PRELOADED_DATA_TOKEN, SECRET_MANAGER_CLIENT_TOKEN, SECRET_MANAGER_OPTIONS } from './constants'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { AsyncSecretManagerOptions, SecretManagerOptions } from './interfaces/options'
import { SecretLoaderService } from './secretloader.service'
import { SecretManagerService } from './secretmanager.service'

@Module({})
export class SecretManagerModule {
  static async register(options: AsyncSecretManagerOptions): Promise<DynamicModule> {
    return {
      module: SecretManagerModule,
      global: true,
      providers: [
        {
          provide: SECRET_MANAGER_CLIENT_TOKEN,
          useFactory: (options: SecretManagerOptions) => {
            return new SecretManagerServiceClient({ keyFile: options.keyFile })
          },
          inject: [SECRET_MANAGER_OPTIONS],
        },
        {
          provide: SECRET_MANAGER_OPTIONS,
          useFactory: options.useFactory
            ? options.useFactory
            : (): SecretManagerOptions => {
                return {
                  secrets: options.secrets || [],
                }
              },
          inject: options.inject,
        },
        {
          provide: SECRET_MANAGER_PRELOADED_DATA_TOKEN,
          useFactory: (client: SecretManagerServiceClient, options: SecretManagerOptions) => {
            return SecretLoaderService.staticLoadSecrets(client, options.secrets || [])
          },
          inject: [SECRET_MANAGER_CLIENT_TOKEN, SECRET_MANAGER_OPTIONS],
        },
        SecretLoaderService,
        SecretManagerService,
      ],
      exports: [SecretManagerService],
    }
  }
}
