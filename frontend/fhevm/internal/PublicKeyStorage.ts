import type { FhevmInstanceConfigPublicKey, FhevmInstanceConfigPublicParams } from "../fhevmTypes";

export async function publicKeyStorageGet(aclAddress: `0x${string}`): Promise<{
  publicKey?: FhevmInstanceConfigPublicKey;
  publicParams: FhevmInstanceConfigPublicParams | null;
}> {
  // 简化：返回 null，首次由 SDK 填充
  return { publicParams: null };
}

export async function publicKeyStorageSet(
  _aclAddress: `0x${string}`,
  _publicKey: any,
  _publicParams: any
): Promise<void> {
  // 简化实现：跳过持久化
  return;
}


