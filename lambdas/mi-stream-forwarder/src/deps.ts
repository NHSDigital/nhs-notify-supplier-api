import { KinesisClient } from '@aws-sdk/client-kinesis';
import { envVars, EnvVars } from './env';

export type Deps = {
  kinesisClient: KinesisClient;
  env: EnvVars;
};

export function createDependenciesContainer(): Deps {
  return {
    kinesisClient: new KinesisClient({}),
    env: envVars,
  };
}
