import type { DigestString, Sha256Hex } from "@ohbp/types";
export declare function sha256Hex(input: string | Uint8Array): Sha256Hex;
export declare function sha256(input: string | Uint8Array): DigestString;
export declare function objectDigestHex<T>(value: T): Sha256Hex;
export declare function objectDigest<T>(value: T): DigestString;
export declare function normalizeDigestHex(digest: DigestString | Sha256Hex): Sha256Hex;
//# sourceMappingURL=hash.d.ts.map