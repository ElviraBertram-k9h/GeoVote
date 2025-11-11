import { SDK_CDN_URL, SDK_LOCAL_URL } from "./constants";

export type FhevmRelayerSDKType = {
  __initialized__?: boolean;
  initSDK: (options?: Record<string, unknown>) => Promise<boolean>;
  createInstance: (config: Record<string, unknown>) => Promise<any>;
  SepoliaConfig: Record<string, any>;
};

export type FhevmWindowType = Window & { relayerSDK: FhevmRelayerSDKType };

type TraceType = (message?: unknown, ...optionalParams: unknown[]) => void;

export class RelayerSDKLoader {
  private _trace?: TraceType;
  constructor(options: { trace?: TraceType }) {
    this._trace = options.trace;
  }

  public isLoaded() {
    if (typeof window === "undefined") {
      throw new Error("RelayerSDKLoader: can only be used in the browser.");
    }
    return isFhevmWindowType(window, this._trace);
  }

  public load(): Promise<void> {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("RelayerSDKLoader: browser only."));
    }
    if ("relayerSDK" in window) {
      if (!isFhevmRelayerSDKType((window as any).relayerSDK, this._trace)) {
        throw new Error("RelayerSDKLoader: Unable to load FHEVM Relayer SDK");
      }
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const tryLoad = (src: string, onFail?: () => void) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          if (!isFhevmWindowType(window, this._trace)) {
            reject(new Error("RelayerSDKLoader: invalid window.relayerSDK"));
            return;
          }
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.type = "text/javascript";
        script.async = true;
        script.onload = () => {
          if (!isFhevmWindowType(window, this._trace)) {
            reject(new Error("RelayerSDKLoader: invalid relayerSDK after load"));
            return;
          }
          resolve();
        };
        script.onerror = () => {
          if (onFail) {
            onFail();
            return;
          }
          reject(new Error(`RelayerSDKLoader: failed to load ${src}`));
        };
        document.head.appendChild(script);
      };

      // Try CDN first, then fallback to local copy
      tryLoad(SDK_CDN_URL, () => tryLoad(SDK_LOCAL_URL));
    });
  }
}

export function isFhevmRelayerSDKType(o: unknown, trace?: TraceType): o is FhevmRelayerSDKType {
  if (!o || typeof o !== "object") {
    trace?.("RelayerSDKLoader: relayerSDK invalid");
    return false;
  }
  const oo = o as any;
  if (typeof oo.initSDK !== "function") {
    trace?.("RelayerSDKLoader: initSDK not a function");
    return false;
  }
  if (typeof oo.createInstance !== "function") {
    trace?.("RelayerSDKLoader: createInstance not a function");
    return false;
  }
  // Check for config object - v0.3.0 may have different names
  const hasConfig = oo.SepoliaConfig || oo.ZamaSepoliaConfig || oo.config;
  if (!hasConfig || typeof hasConfig !== "object") {
    trace?.("RelayerSDKLoader: no valid config object found", Object.keys(oo));
    return false;
  }
  return true;
}

export function isFhevmWindowType(win: unknown, trace?: TraceType): win is FhevmWindowType {
  if (!win || typeof win !== "object") {
    trace?.("RelayerSDKLoader: window invalid");
    return false;
  }
  if (!("relayerSDK" in (win as any))) {
    trace?.("RelayerSDKLoader: not found relayerSDK on window");
    return false;
  }
  return isFhevmRelayerSDKType((win as any).relayerSDK, trace);
}


