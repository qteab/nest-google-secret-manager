import { Test } from '@nestjs/testing'
import { Module, Global } from '@nestjs/common'
import { SecretManagerModule, SecretManagerService } from './index'
import { SECRET_MANAGER_CLIENT_TOKEN } from './constants'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

const SECRET_CONFIG_MODULE = 'SECRET_CONFIG_MODULE'
@Module({
  providers: [
    {
      provide: SECRET_CONFIG_MODULE,
      useValue: {
        secrets: ['project/some-project/secrets/some-secret/versions/latest'],
      },
    },
  ],
  exports: [SECRET_CONFIG_MODULE],
})
@Global()
class ConfigModule {}

jest.mock('@google-cloud/secret-manager')
describe('SecretManagerModule', () => {
  let client: SecretManagerServiceClient

  beforeEach(() => {
    jest.resetAllMocks()
    client = new SecretManagerServiceClient()
    ;(client.accessSecretVersion as jest.Mock).mockImplementationOnce(({ name }) => [
      {
        payload: { data: name },
      },
    ])
  })

  describe('Static creation', () => {
    it('Can create a module and load the provided secrets', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          SecretManagerModule.register({
            secrets: ['project/some-project/secrets/some-secret/versions/latest'],
          }),
        ],
      })
        .overrideProvider(SECRET_MANAGER_CLIENT_TOKEN)
        .useValue(client)
        .compile()
      const secretManagerService = moduleRef.get<SecretManagerService>(SecretManagerService)
      expect(secretManagerService.getSecrets()).toEqual({
        'project/some-project/secrets/some-secret/versions/latest': 'project/some-project/secrets/some-secret/versions/latest',
      })
    })
  })

  describe('Factory creation', () => {
    it('Can create a module and load the provided secrets', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          SecretManagerModule.register({
            useFactory: ({ secrets }: { secrets: string[] }) => {
              return {
                secrets: secrets,
              }
            },
            inject: [{ token: SECRET_CONFIG_MODULE, optional: false }],
          }),
          ConfigModule,
        ],
      })
        .overrideProvider(SECRET_MANAGER_CLIENT_TOKEN)
        .useValue(client)
        .compile()
      const secretManagerService = moduleRef.get<SecretManagerService>(SecretManagerService)
      expect(secretManagerService.getSecrets()).toEqual({
        'project/some-project/secrets/some-secret/versions/latest': 'project/some-project/secrets/some-secret/versions/latest',
      })
    })
  })
})
