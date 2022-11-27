import { InjectionToken, OptionalFactoryDependency } from '@nestjs/common'

export interface SecretManagerOptions {
  secrets?: string[]
  keyFile?: string
}

export interface AsyncSecretManagerOptions extends SecretManagerOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useFactory?: (...args: any[]) => SecretManagerOptions
  inject?: (InjectionToken | OptionalFactoryDependency)[] | undefined
}
