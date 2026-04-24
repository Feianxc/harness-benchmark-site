declare class Buffer extends Uint8Array {
  static from(input: string, encoding?: string): Buffer;
}

declare module "node:crypto" {
  interface Hash {
    update(data: string | Uint8Array): Hash;
    digest(encoding: "hex"): string;
  }

  export function createHash(algorithm: string): Hash;
}
