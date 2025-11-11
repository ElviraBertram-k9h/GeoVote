import { ethers } from "ethers";
import { EIP712Type, FhevmInstance } from "./fhevmTypes";
import { GenericStringStorage } from "./GenericStringStorage";

function _timestampNow(): number {
  return Math.floor(Date.now() / 1000);
}

class FhevmDecryptionSignatureStorageKey {
  #key: string;
  constructor(instance: FhevmInstance, contractAddresses: string[], userAddress: string, publicKey?: string) {
    const sorted = (contractAddresses as `0x${string}`[]).sort();
    const e = instance.createEIP712(publicKey ?? ethers.ZeroAddress, sorted, 0, 0);
    const hash = ethers.TypedDataEncoder.hash(
      e.domain,
      { UserDecryptRequestVerification: (e.types as any).UserDecryptRequestVerification },
      e.message
    );
    this.#key = `${userAddress}:${hash}`;
  }
  get key(): string { return this.#key; }
}

export class FhevmDecryptionSignature {
  #publicKey: string;
  #privateKey: string;
  #signature: string;
  #startTimestamp: number;
  #durationDays: number;
  #userAddress: `0x${string}`;
  #contractAddresses: `0x${string}`[];
  #eip712: EIP712Type;

  private constructor(parameters: {
    publicKey: string;
    privateKey: string;
    signature: string;
    startTimestamp: number;
    durationDays: number;
    userAddress: `0x${string}`;
    contractAddresses: `0x${string}`[];
    eip712: EIP712Type;
  }) {
    this.#publicKey = parameters.publicKey;
    this.#privateKey = parameters.privateKey;
    this.#signature = parameters.signature;
    this.#startTimestamp = parameters.startTimestamp;
    this.#durationDays = parameters.durationDays;
    this.#userAddress = parameters.userAddress;
    this.#contractAddresses = parameters.contractAddresses;
    this.#eip712 = parameters.eip712;
  }

  get privateKey() { return this.#privateKey; }
  get publicKey() { return this.#publicKey; }
  get signature() { return this.#signature; }
  get contractAddresses() { return this.#contractAddresses; }
  get startTimestamp() { return this.#startTimestamp; }
  get durationDays() { return this.#durationDays; }
  get userAddress() { return this.#userAddress; }

  isValid(): boolean {
    return _timestampNow() < this.#startTimestamp + this.#durationDays * 24 * 60 * 60;
  }

  toJSON() {
    return {
      publicKey: this.#publicKey,
      privateKey: this.#privateKey,
      signature: this.#signature,
      startTimestamp: this.#startTimestamp,
      durationDays: this.#durationDays,
      userAddress: this.#userAddress,
      contractAddresses: this.#contractAddresses,
      eip712: this.#eip712,
    };
  }

  static fromJSON(json: unknown) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    const d = data as any;
    return new FhevmDecryptionSignature(d);
  }

  async saveToGenericStringStorage(storage: GenericStringStorage, instance: FhevmInstance, withPublicKey: boolean) {
    const key = new FhevmDecryptionSignatureStorageKey(
      instance,
      this.#contractAddresses,
      this.#userAddress,
      withPublicKey ? this.#publicKey : undefined
    ).key;
    await storage.setItem(key, JSON.stringify(this));
  }

  static async loadFromGenericStringStorage(
    storage: GenericStringStorage,
    instance: FhevmInstance,
    contractAddresses: string[],
    userAddress: string,
    publicKey?: string
  ): Promise<FhevmDecryptionSignature | null> {
    const key = new FhevmDecryptionSignatureStorageKey(instance, contractAddresses, userAddress, publicKey).key;
    const s = await storage.getItem(key);
    if (!s) return null;
    try {
      const parsed = FhevmDecryptionSignature.fromJSON(s);
      return parsed.isValid() ? parsed : null;
    } catch {
      return null;
    }
  }

  static async new(
    instance: FhevmInstance,
    contractAddresses: string[],
    publicKey: string,
    privateKey: string,
    signer: ethers.Signer
  ): Promise<FhevmDecryptionSignature | null> {
    try {
      const userAddress = (await signer.getAddress()) as `0x${string}`;
      const startTimestamp = _timestampNow();
      const durationDays = 365;
      const eip712 = instance.createEIP712(publicKey, contractAddresses, startTimestamp, durationDays);
      const signature = await signer.signTypedData(
        eip712.domain as any,
        { UserDecryptRequestVerification: (eip712.types as any).UserDecryptRequestVerification },
        eip712.message as any
      );
      return new FhevmDecryptionSignature({
        publicKey,
        privateKey,
        contractAddresses: contractAddresses as `0x${string}`[],
        startTimestamp,
        durationDays,
        signature,
        eip712,
        userAddress,
      });
    } catch {
      return null;
    }
  }

  static async loadOrSign(
    instance: FhevmInstance,
    contractAddresses: string[],
    signer: ethers.Signer,
    storage: GenericStringStorage,
    keyPair?: { publicKey: string; privateKey: string }
  ): Promise<FhevmDecryptionSignature | null> {
    const userAddress = (await signer.getAddress()) as `0x${string}`;

    const cached = await FhevmDecryptionSignature.loadFromGenericStringStorage(
      storage,
      instance,
      contractAddresses,
      userAddress,
      keyPair?.publicKey
    );
    if (cached) return cached;

    const { publicKey, privateKey } = keyPair ?? instance.generateKeypair();
    const sig = await FhevmDecryptionSignature.new(instance, contractAddresses, publicKey, privateKey, signer);
    if (!sig) return null;
    await sig.saveToGenericStringStorage(storage, instance, Boolean(keyPair?.publicKey));
    return sig;
  }
}


