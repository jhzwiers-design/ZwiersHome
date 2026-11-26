/**
 * Sample photos used as stand-in camera views (prototype only).
 *
 * They are real photos of the home, so they live in src/assets/private/
 * (git-ignored) and are only loaded in private builds. Public builds compile
 * this map to {} and never reference the files. A photo is named after its
 * camera id, e.g. cam-front.jpg. Cameras without a photo show a line drawing.
 */
type Loader = () => Promise<string>;

const loaders: Record<string, Loader> = __PUBLIC__
  ? {}
  : (import.meta.glob('../assets/private/cam-*.jpg', { query: '?url', import: 'default' }) as Record<string, Loader>);

export function cameraPhotoLoader(cameraId: string): Loader | undefined {
  if (__PUBLIC__) return undefined;
  return loaders[`../assets/private/${cameraId}.jpg`];
}
