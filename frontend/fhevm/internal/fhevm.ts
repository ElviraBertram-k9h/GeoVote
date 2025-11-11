import { isAddress, Eip1193Provider, JsonRpcProvider } from "ethers";
import type {
  FhevmInstance,
  FhevmInstanceConfigPublicKey,
  FhevmInstanceConfigPublicParams,
} from "../fhevmTypes";
import { RelayerSDKLoader, isFhevmWindowType } from "./RelayerSDKLoader";
import { publicKeyStorageGet, publicKeyStorageSet } from "./PublicKeyStorage";

export class FhevmAbortError extends Error {
  constructor(message = "FHEVM operation was cancelled") {
    super(message);
    this.name = "FhevmAbortError";
  }
}

type FhevmRelayerStatusType =
  | "sdk-loading"
  | "sdk-loaded"
  | "sdk-initializing"
  | "sdk-initialized"
  | "creating";

async function getChainId(providerOrUrl: Eip1193Provider | string): Promise<number> {
  if (typeof providerOrUrl === "string") {
    const provider = new JsonRpcProvider(providerOrUrl);
    return Number((await provider.getNetwork()).chainId);
  }
  const chainId = await providerOrUrl.request({ method: "eth_chainId" });
  return Number.parseInt(chainId as string, 16);
}

async function getWeb3Client(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    const version = await rpc.send("web3_clientVersion", []);
    return version;
  } finally {
    rpc.destroy();
  }
}

async function tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl: string): Promise<
  | {
      ACLAddress: `0x${string}`;
      InputVerifierAddress: `0x${string}`;
      KMSVerifierAddress: `0x${string}`;
    }
  | undefined
> {
  const version = await getWeb3Client(rpcUrl);
  if (typeof version !== "string" || !version.toLowerCase().includes("hardhat")) {
    return undefined;
  }
  try {
    const rpc = new JsonRpcProvider(rpcUrl);
    const metadata = await rpc.send("fhevm_relayer_metadata", []);
    return metadata;
  } catch {
    return undefined;
  }
}

type ResolveResult =
  | { isMock: true; chainId: number; rpcUrl: string }
  | { isMock: false; chainId: number; rpcUrl?: string };

async function resolve(providerOrUrl: Eip1193Provider | string, mockChains?: Record<number, string>): Promise<ResolveResult> {
  const chainId = await getChainId(providerOrUrl);
  let rpcUrl = typeof providerOrUrl === "string" ? providerOrUrl : undefined;
  const _mockChains: Record<number, string> = { 31337: "http://localhost:8545", ...(mockChains ?? {}) };
  if (Object.hasOwn(_mockChains, chainId)) {
    if (!rpcUrl) rpcUrl = _mockChains[chainId];
    return { isMock: true, chainId, rpcUrl };
    }
  return { isMock: false, chainId, rpcUrl };
}

function checkIsAddress(a: unknown): a is `0x${string}` {
  return typeof a === "string" && isAddress(a);
}

export const createFhevmInstance = async (parameters: {
  provider: Eip1193Provider | string;
  mockChains?: Record<number, string>;
  signal: AbortSignal;
  onStatusChange?: (status: FhevmRelayerStatusType) => void;
}): Promise<FhevmInstance> => {
  const { provider: providerOrUrl, mockChains, signal, onStatusChange } = parameters;
  const throwIfAborted = () => {
    if (signal.aborted) throw new FhevmAbortError();
  };
  const notify = (s: FhevmRelayerStatusType) => onStatusChange?.(s);

  const { isMock, rpcUrl, chainId } = await resolve(providerOrUrl, mockChains);

  if (isMock) {
    const metadata = await tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl!);
    if (metadata) {
      notify("creating");
      const fhevmMock = await import("./mock/fhevmMock");
      const mockInstance = await fhevmMock.fhevmMockCreateInstance({
        rpcUrl: rpcUrl!,
        chainId,
        metadata
      });
      throwIfAborted();
      return mockInstance;
    }
  }

  // Don't check abort before SDK loading - let it complete first
  
  if (!isFhevmWindowType(window, console.log)) {
    notify("sdk-loading");
    const loader = new RelayerSDKLoader({ trace: console.log });
    await loader.load();
    notify("sdk-loaded");
  }
  // @ts-ignore
  const relayerSDK = (window as any).relayerSDK;
  console.log("[createFhevmInstance] relayerSDK keys:", Object.keys(relayerSDK));
  
  // Check SharedArrayBuffer availability
  if (typeof SharedArrayBuffer === "undefined") {
    throw new Error("SharedArrayBuffer is not available. COOP/COEP headers may not be set correctly.");
  }
  console.log("[createFhevmInstance] SharedArrayBuffer is available ✓");
  
  if (relayerSDK.__initialized__ !== true) {
    notify("sdk-initializing");
    try {
      console.log("[createFhevmInstance] Calling initSDK()...");
      // Ensure only ONE initSDK runs globally (debounce concurrent calls)
      // @ts-ignore
      const sdkAny = relayerSDK as any;
      if (!sdkAny.__initPromise) {
        // Don't check abort during initSDK as it takes time to initialize WASM
        sdkAny.__initPromise = sdkAny.initSDK();
      }
      const ok = await sdkAny.__initPromise;
      console.log("[createFhevmInstance] initSDK() returned:", ok);
      if (!ok) throw new Error("RelayerSDK initSDK returned false");
      sdkAny.__initialized__ = true;
      notify("sdk-initialized");
      console.log("[createFhevmInstance] SDK initialized successfully");
    } catch (err) {
      console.error("[createFhevmInstance] initSDK() error:", err);
      // Reset promise so future retries can happen
      // @ts-ignore
      (relayerSDK as any).__initPromise = undefined;
      throw err;
    }
  }
  
  // Check abort after SDK is initialized
  throwIfAborted();

  // v0.3.0 may have different config object names
  const sepoliaConfig = relayerSDK.SepoliaConfig || relayerSDK.ZamaSepoliaConfig || relayerSDK.config;
  if (!sepoliaConfig) {
    throw new Error("No Sepolia config found in relayerSDK. Available keys: " + Object.keys(relayerSDK).join(", "));
  }

  const aclAddress = sepoliaConfig.aclContractAddress;
  if (!checkIsAddress(aclAddress)) {
    throw new Error(`Invalid ACL address: ${aclAddress}`);
  }
  const pub = await publicKeyStorageGet(aclAddress);
  throwIfAborted();

  const config = {
    ...sepoliaConfig,
    network: providerOrUrl,
    publicKey: pub.publicKey,
    publicParams: pub.publicParams,
  };

  notify("creating");
  const instance = await relayerSDK.createInstance(config);
  await publicKeyStorageSet(aclAddress, instance.getPublicKey(), instance.getPublicParams(2048));
  throwIfAborted();
  return instance;
};


