"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useMetaMaskEthersSigner() {
  const AUTOCONNECT_KEY = "geovote_autoconnect";
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(
    undefined
  );
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[] | undefined>(undefined);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>(
    undefined
  );
  const [readonlyProvider, setReadonlyProvider] =
    useState<ethers.Provider | undefined>(undefined);

  useEffect(() => {
    const w = globalThis as unknown as { ethereum?: ethers.Eip1193Provider };
    if (w.ethereum) {
      setProvider(w.ethereum);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!provider) return;
    const accounts = (await provider.request({
      method: "eth_requestAccounts",
    })) as string[];
    setAccounts(accounts);
    const chainIdHex = (await provider.request({
      method: "eth_chainId",
    })) as string;
    setChainId(parseInt(chainIdHex, 16));

    const browserProvider = new ethers.BrowserProvider(provider);
    const signer = await browserProvider.getSigner();
    setSigner(signer);
    setReadonlyProvider(browserProvider);

    // remember user preference
    try {
      localStorage.setItem(AUTOCONNECT_KEY, "1");
    } catch {}
  }, [provider]);

  // Silent restore on page load (no prompt)
  useEffect(() => {
    const silentReconnect = async () => {
      if (!provider) return;
      try {
        const wantAuto =
          typeof window !== "undefined" &&
          localStorage.getItem(AUTOCONNECT_KEY) === "1";
        // Query existing permissions/accounts (no UI prompt)
        const accs = (await provider.request({
          method: "eth_accounts",
        })) as string[];
        if (accs && accs.length > 0) {
          setAccounts(accs);
          const chainIdHex = (await provider.request({
            method: "eth_chainId",
          })) as string;
          setChainId(parseInt(chainIdHex, 16));
          const browserProvider = new ethers.BrowserProvider(provider);
          const signer = await browserProvider.getSigner();
          setSigner(signer);
          setReadonlyProvider(browserProvider);
          // persist for future sessions
          if (wantAuto === false) {
            try {
              localStorage.setItem(AUTOCONNECT_KEY, "1");
            } catch {}
          }
        } else {
          // clear if no accounts (e.g., user disconnected in wallet)
          setAccounts([]);
          setSigner(undefined);
          setReadonlyProvider(undefined);
          try {
            localStorage.removeItem(AUTOCONNECT_KEY);
          } catch {}
        }
      } catch {
        // ignore silent failures
      }
    };
    silentReconnect();
  }, [provider]);

  useEffect(() => {
    if (!provider) return;
    const onAccountsChanged = (accs: string[]) => setAccounts(accs);
    const onChainChanged = (hex: string) => setChainId(parseInt(hex, 16));
    (provider as any).on?.("accountsChanged", onAccountsChanged);
    (provider as any).on?.("chainChanged", onChainChanged);
    return () => {
      (provider as any).removeListener?.("accountsChanged", onAccountsChanged);
      (provider as any).removeListener?.("chainChanged", onChainChanged);
    };
  }, [provider]);

  const isConnected = useMemo(() => (accounts?.length ?? 0) > 0, [accounts]);

  const initialMockChains = useMemo(
    () => ({ 31337: "http://localhost:8545" }),
    []
  );

  return {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner: signer,
    ethersReadonlyProvider: readonlyProvider,
    initialMockChains,
  };
}


