import type { DigestString, Manifest, Sha256Hex } from "@ohbp/types";
export interface ChecksumEntry {
    path: string;
    sha256: DigestString | Sha256Hex;
}
export declare function projectManifestForBinding(manifest: Manifest): Manifest;
export declare function manifestBindingDigest(manifest: Manifest): DigestString;
export declare function materializeChecksums(entries: ChecksumEntry[] | Record<string, DigestString | Sha256Hex>): string;
export declare function checksumsToBundleDigestHex(checksums: string | ChecksumEntry[] | Record<string, DigestString | Sha256Hex>): Sha256Hex;
export declare function checksumsToBundleDigest(checksums: string | ChecksumEntry[] | Record<string, DigestString | Sha256Hex>): DigestString;
export declare function parseChecksums(text: string): ChecksumEntry[];
//# sourceMappingURL=checksums.d.ts.map