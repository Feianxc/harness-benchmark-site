declare module "node:crypto" {
  export interface Hash {
    update(data: string | Uint8Array): Hash;
    digest(encoding: "hex"): string;
  }

  export function createHash(algorithm: string): Hash;
}

declare module "node:fs" {
  export interface Dirent {
    name: string;
    isDirectory(): boolean;
    isFile(): boolean;
  }

  export const promises: {
    access(path: string): Promise<void>;
    mkdir(
      path: string,
      options?: { recursive?: boolean },
    ): Promise<string | undefined>;
    readFile(path: string, encoding: "utf8"): Promise<string>;
    readFile(path: string): Promise<Uint8Array>;
    writeFile(
      path: string,
      data: string | Uint8Array,
      encoding?: "utf8",
    ): Promise<void>;
    readdir(
      path: string,
      options?: { withFileTypes?: boolean },
    ): Promise<string[] | Dirent[]>;
  };
}

declare module "node:path" {
  export const sep: string;
  export function basename(path: string): string;
  export function dirname(path: string): string;
  export function join(...paths: string[]): string;
  export function relative(from: string, to: string): string;
  export function resolve(...paths: string[]): string;
}
