import { Test } from '@nestjs/testing'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { SecretLoaderService } from './secretloader.service'
import { SecretLoadException } from './exceptions'
import { SECRET_MANAGER_CLIENT_TOKEN } from './constants'

jest.mock('@google-cloud/secret-manager')
describe('SecretLoaderService', () => {
  describe('static', () => {
    it('Can load 1 secret statically', async () => {
      const client = new SecretManagerServiceClient()
      ;(client.accessSecretVersion as jest.Mock).mockImplementationOnce(({ name }) => [
        {
          payload: { data: name },
        },
      ])

      const secrets = ['project/some-project/secrets/some-secret/versions/latest']
      const values = await SecretLoaderService.staticLoadSecrets(client, secrets)
      expect(client.accessSecretVersion).toBeCalledTimes(1)
      expect(values).toEqual({
        'project/some-project/secrets/some-secret/versions/latest': 'project/some-project/secrets/some-secret/versions/latest',
      })
    })

    it('Can load 0 secrets statically', async () => {
      const client = new SecretManagerServiceClient()
      ;(client.accessSecretVersion as jest.Mock).mockImplementationOnce(({ name }) => [
        {
          payload: { data: name },
        },
      ])

      const secrets: string[] = []
      const values = await SecretLoaderService.staticLoadSecrets(client, secrets)
      expect(client.accessSecretVersion).toBeCalledTimes(0)
      expect(values).toEqual({})
    })

    it('Can load 2 secrets statically', async () => {
      const client = new SecretManagerServiceClient()
      ;(client.accessSecretVersion as jest.Mock).mockImplementation(({ name }) => [
        {
          payload: { data: name },
        },
      ])

      const secrets: string[] = ['project/some-project/secrets/some-secret/versions/latest', 'project/some-project/secrets/some-secret/versions/1']
      const values = await SecretLoaderService.staticLoadSecrets(client, secrets)
      expect(client.accessSecretVersion).toBeCalledTimes(2)
      expect(values).toEqual({
        'project/some-project/secrets/some-secret/versions/latest': 'project/some-project/secrets/some-secret/versions/latest',
        'project/some-project/secrets/some-secret/versions/1': 'project/some-project/secrets/some-secret/versions/1',
      })
    })

    it('Overrides result object if the same secret is loaded twice', async () => {
      const client = new SecretManagerServiceClient()
      ;(client.accessSecretVersion as jest.Mock).mockImplementation(({ name }) => [
        {
          payload: { data: name },
        },
      ])

      const secrets: string[] = [
        'project/some-project/secrets/some-secret/versions/latest',
        'project/some-project/secrets/some-secret/versions/latest',
      ]
      const values = await SecretLoaderService.staticLoadSecrets(client, secrets)
      expect(client.accessSecretVersion).toBeCalledTimes(2)
      expect(values).toEqual({
        'project/some-project/secrets/some-secret/versions/latest': 'project/some-project/secrets/some-secret/versions/latest',
      })
    })

    it('Throws an error if secret load fails', async () => {
      const client = new SecretManagerServiceClient()
      ;(client.accessSecretVersion as jest.Mock).mockImplementation(() => {
        throw new SecretLoadException('Load failed')
      })

      const secrets: string[] = ['project/some-project/secrets/some-secret/versions/latest']
      await expect(SecretLoaderService.staticLoadSecrets(client, secrets)).rejects.toThrow(SecretLoadException)
    })
  })

  describe('dynamic', () => {
    let secretLoadService: SecretLoaderService
    let client: SecretManagerServiceClient
    beforeEach(async () => {
      client = new SecretManagerServiceClient()
      ;(client.accessSecretVersion as jest.Mock).mockImplementation(({ name }) => [
        {
          payload: { data: name },
        },
      ])
      const moduleRef = await Test.createTestingModule({
        providers: [
          SecretLoaderService,
          {
            provide: SECRET_MANAGER_CLIENT_TOKEN,
            useValue: client,
          },
        ],
      }).compile()
      secretLoadService = moduleRef.get<SecretLoaderService>(SecretLoaderService)
    })

    it('Can load a secret dynamically', async () => {
      const secret = 'project/some-project/secrets/some-secret/versions/latest'
      const value = await secretLoadService.loadSecret(secret)
      expect(secret).toEqual(value)
      expect(client.accessSecretVersion).toHaveBeenCalledTimes(1)
    })
  })
})
