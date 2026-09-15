import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './queues/worker.module';

/**
 * Queue worker entrypoint. In docker-compose this runs as its own container;
 * on single-dyno hosting the same processors can be mounted in-process by
 * setting INLINE_WORKER=1 on the API (see AppModule).
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  await app.init();
  // eslint-disable-next-line no-console
  console.log('[worker] processors online');
}
bootstrap();
