export type EIP712Type = {
  domain: Record<string, unknown>;
  primaryType: string;
  types: Record<string, unknown>;
  message: Record<string, unknown>;
};

export type FhevmInstanceConfigPublicKey = {
  id: string;
  data: string;
};

export type FhevmInstanceConfigPublicParams = Record<string, unknown> | null;

export type FhevmInstance = {
  getPublicKey(): { publicKeyId: string; publicKey: string } | null;
  getPublicParams(size: number): Record<string, unknown> | null;
  createEncryptedInput(
    contractAddress: string,
    userAddress: string
  ): {
    add32(v: number): void;
    encrypt(): Promise<{ handles: string[]; inputProof: string }>;
  };
  generateKeypair(): { publicKey: string; privateKey: string };
  createEIP712(
    publicKey: string | string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ): EIP712Type;
  userDecrypt(
    items: { handle: string; contractAddress: string }[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: `0x${string}`,
    startTimestamp: number,
    durationDays: number
  ): Promise<Record<string, bigint>>;
};


