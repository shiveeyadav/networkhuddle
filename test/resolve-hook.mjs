// Lets `node --test` load the app's extensionless ESM imports (`./errors`)
// the same way Next.js does, without adding a build step or dependencies.
import { register } from 'node:module';

register(
  'data:text/javascript,' +
    encodeURIComponent(`
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    if (err && err.code === 'ERR_MODULE_NOT_FOUND' && (specifier.startsWith('.') || specifier.startsWith('/'))) {
      return next(specifier + '.js', context);
    }
    throw err;
  }
}`),
  import.meta.url
);
