declare module "node:fs" {
  export const promises: {
    readFile(path: string): Promise<Uint8Array>;
    readFile(path: string, encoding: "utf8"): Promise<string>;
  };
}

declare module "node:path" {
  export function join(...paths: string[]): string;
}
