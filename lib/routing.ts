const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const basePath =
  rawBasePath.length > 1 && rawBasePath.endsWith("/")
    ? rawBasePath.slice(0, -1)
    : rawBasePath;

export function appPath(path: `/${string}`) {
  return `${basePath}${path}`;
}
