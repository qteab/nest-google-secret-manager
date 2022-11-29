import { Test } from '@nestjs/testing'
import { SECRET_MANAGER_PRELOADED_DATA_TOKEN } from './constants'
import { SecretNotLoadedException } from './exceptions'
import { SecretLoaderService } from './secretloader.service'
import { SecretManagerService } from './secretmanager.service'

jest.mock('./secretloader.service')
describe('SecretManagerService', () => {
  let secretManagerService: SecretManagerService
  let secretLoaderService: SecretLoaderService
  const preloadedSecrets = {
    'project/test-project/secrets/some-secret/versions/latest': 'some-secret',
  }
  beforeEach(async () => {
    jest.resetAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    secretLoaderService = new SecretLoaderService(null as any)
    ;(secretLoaderService.loadSecret as jest.Mock).mockImplementationOnce(() => 'some-secret')

    const moduleRef = await Test.createTestingModule({
      providers: [
        SecretManagerService,
        SecretLoaderService,
        {
          provide: SECRET_MANAGER_PRELOADED_DATA_TOKEN,
          useValue: preloadedSecrets,
        },
      ],
    })
      .overrideProvider(SecretLoaderService)
      .useValue(secretLoaderService)
      .compile()

    secretManagerService = moduleRef.get<SecretManagerService>(SecretManagerService)
  })

  it('Preloaded secrets are returned', () => {
    const values = secretManagerService.getSecrets()
    expect(values).toEqual(preloadedSecrets)
  })

  it('Can get a preloaded secret', () => {
    const secret = 'project/test-project/secrets/some-secret/versions/latest'
    const value = secretManagerService.getSecret(secret)
    expect(value).toEqual(preloadedSecrets[secret])
  })

  it('Throws an error when trying to get a secret that does not exist', () => {
    const secret = 'project/test-project/secrets/no-secret/versions/latest'
    expect(() => {
      secretManagerService.getSecret(secret)
    }).toThrow(SecretNotLoadedException)
  })

  it('Can load in a new secret in the cache', async () => {
    const secret = 'project/test-project/secrets/no-secret/versions/latest'
    expect(() => {
      secretManagerService.getSecret(secret)
    }).toThrow(SecretNotLoadedException)

    await secretManagerService.loadSecretDynamic(secret)
    expect(secretManagerService.getSecret(secret)).toEqual('some-secret')
  })

  it('does not do external lookups for cached secrets', async () => {
    const secret = 'project/test-project/secrets/no-secret/versions/latest'
    expect(() => {
      secretManagerService.getSecret(secret)
    }).toThrow(SecretNotLoadedException)

    await secretManagerService.loadSecretDynamic(secret)
    await secretManagerService.loadSecretDynamic(secret)
    expect(secretLoaderService.loadSecret).toHaveBeenCalledTimes(1)
    expect(secretManagerService.getSecret(secret)).toEqual('some-secret')
  })
})
