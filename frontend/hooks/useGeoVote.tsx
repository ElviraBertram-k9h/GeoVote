"use client";

import { useCallback, useEffect, useMemo, useRef, useState, RefObject } from "react";
import { ethers } from "ethers";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { GeoVoteABI } from "@/abi/GeoVoteABI";
import { GeoVoteAddresses } from "@/abi/GeoVoteAddresses";

interface Landmark {
  id: number;
  name: string;
  country: string;
  imageUrl: string;
  votes: bigint;
  latMicro: bigint;
  lngMicro: bigint;
  votesHandle?: string;
}

export function useGeoVote(params: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain?: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner?: RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}) {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = params;

  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const isLoadingRef = useRef(false);
  const isVotingRef = useRef(false);
  const isDecryptingRef = useRef(false);
  const isAddingRef = useRef(false);

  // 合约信息
  const contractInfo = useMemo(() => {
    if (!chainId) return undefined;
    const entry = GeoVoteAddresses[chainId.toString() as keyof typeof GeoVoteAddresses];
    if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) return undefined;
    return {
      address: entry.address as `0x${string}`,
      chainId: entry.chainId ?? chainId,
      chainName: entry.chainName ?? "",
      abi: GeoVoteABI.abi,
    };
  }, [chainId]);

  // 检查是否是管理员
  useEffect(() => {
    const checkAdmin = async () => {
      if (!contractInfo || !ethersSigner || !ethersReadonlyProvider) {
        setIsAdmin(false);
        return;
      }
      try {
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersReadonlyProvider);
        const adminAddress = await contract.admin();
        const signerAddress = await ethersSigner.getAddress();
        setIsAdmin(adminAddress.toLowerCase() === signerAddress.toLowerCase());
      } catch (e) {
        console.error("Failed to check admin status:", e);
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [contractInfo, ethersSigner, ethersReadonlyProvider]);

  // 刷新地标列表
  const refreshLandmarks = useCallback(async () => {
    if (isLoadingRef.current || !contractInfo || !ethersReadonlyProvider) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setMessage("加载地标中...");

    try {
      const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersReadonlyProvider);
      const count: bigint = await contract.getLandmarkCount();
      const results: Landmark[] = [];

      for (let i = 0n; i < count; i++) {
        const id = Number(i);
        const [name, country, imageUrl, latMicro, lngMicro, votes] = await contract.getLandmark(id);
        const votesHandle = await contract.getVotesHandle(id);
        
        results.push({
          id,
          name,
          country,
          imageUrl,
          votes,
          latMicro,
          lngMicro,
          votesHandle,
        });
      }

      setLandmarks(results);
      setMessage(`加载完成，共 ${results.length} 个地标`);
    } catch (e) {
      console.error("Failed to load landmarks:", e);
      setMessage(`加载失败: ${(e as Error).message}`);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [contractInfo, ethersReadonlyProvider]);

  // 自动刷新
  useEffect(() => {
    refreshLandmarks();
  }, [refreshLandmarks]);

  // 投票
  const voteLandmark = useCallback(
    async (landmarkId: number) => {
      if (isVotingRef.current || !contractInfo || !instance || !ethersSigner) {
        return;
      }

      isVotingRef.current = true;
      setIsVoting(true);
      setMessage("准备投票...");

      const thisChainId = chainId;
      const thisAddress = contractInfo.address;
      const thisSigner = ethersSigner;

      try {
        // 创建加密输入（投1票）
        const input = instance.createEncryptedInput(thisAddress, thisSigner.address);
        input.add32(1);

        setMessage("加密输入中...");
        const enc = await input.encrypt();

        if (!(sameChain?.current?.(thisChainId) ?? true) || !(sameSigner?.current?.(thisSigner) ?? true)) {
          setMessage("链或签名者已变更，取消投票");
          return;
        }

        setMessage("提交投票交易...");
        const contract = new ethers.Contract(thisAddress, contractInfo.abi, thisSigner);
        const tx = await contract.vote(landmarkId, enc.handles[0], enc.inputProof);

        setMessage(`等待交易确认: ${tx.hash}`);
        await tx.wait();

        setMessage("投票成功！");
        await refreshLandmarks();
      } catch (e) {
        console.error("Vote failed:", e);
        setMessage(`投票失败: ${(e as Error).message}`);
      } finally {
        isVotingRef.current = false;
        setIsVoting(false);
      }
    },
    [contractInfo, instance, ethersSigner, chainId, refreshLandmarks, sameChain, sameSigner]
  );

  // 授权查看票数
  const grantViewVotes = useCallback(
    async (landmarkId: number) => {
      if (!contractInfo || !ethersSigner) {
        return;
      }

      try {
        setMessage("授权查看加密票数...");
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersSigner);
        const tx = await contract.grantViewVotes(landmarkId);
        await tx.wait();
        setMessage("授权成功");
      } catch (e) {
        console.error("Grant view failed:", e);
        setMessage(`授权失败: ${(e as Error).message}`);
        throw e;
      }
    },
    [contractInfo, ethersSigner]
  );

  // 解密票数
  const decryptVotes = useCallback(
    async (landmarkId: number): Promise<bigint | null> => {
      if (isDecryptingRef.current || !contractInfo || !instance || !ethersSigner) {
        return null;
      }

      isDecryptingRef.current = true;
      setIsDecrypting(true);

      const thisChainId = chainId;
      const thisAddress = contractInfo.address;
      const thisSigner = ethersSigner;

      try {
        // 获取加密句柄
        const contract = new ethers.Contract(thisAddress, contractInfo.abi, thisSigner);
        const votesHandle = await contract.getVotesHandle(landmarkId);

        setMessage("生成解密签名...");
        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [thisAddress],
          thisSigner,
          fhevmDecryptionSignatureStorage
        );

        if (!sig) {
          setMessage("无法生成解密签名");
          return null;
        }

        if (!(sameChain?.current?.(thisChainId) ?? true) || !(sameSigner?.current?.(thisSigner) ?? true)) {
          setMessage("链或签名者已变更，取消解密");
          return null;
        }

        setMessage("解密中...");
        const result = await instance.userDecrypt(
          [{ handle: votesHandle, contractAddress: thisAddress }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        const decryptedValue = result[votesHandle];
        setMessage(`解密成功: ${decryptedValue}`);
        return decryptedValue;
      } catch (e) {
        console.error("Decrypt failed:", e);
        setMessage(`解密失败: ${(e as Error).message}`);
        return null;
      } finally {
        isDecryptingRef.current = false;
        setIsDecrypting(false);
      }
    },
    [contractInfo, instance, ethersSigner, chainId, fhevmDecryptionSignatureStorage, sameChain, sameSigner]
  );

  // 添加地标（管理员）
  const addLandmark = useCallback(
    async (
      name: string,
      country: string,
      imageUrl: string,
      latMicro: number,
      lngMicro: number
    ): Promise<boolean> => {
      if (isAddingRef.current || !contractInfo || !ethersSigner) {
        return false;
      }

      isAddingRef.current = true;
      setIsAdding(true);
      setMessage("添加地标中...");

      try {
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersSigner);
        const tx = await contract.addLandmark(name, country, imageUrl, latMicro, lngMicro);

        setMessage(`等待交易确认: ${tx.hash}`);
        await tx.wait();

        setMessage("地标添加成功！");
        await refreshLandmarks();
        return true;
      } catch (e) {
        console.error("Add landmark failed:", e);
        setMessage(`添加失败: ${(e as Error).message}`);
        return false;
      } finally {
        isAddingRef.current = false;
        setIsAdding(false);
      }
    },
    [contractInfo, ethersSigner, refreshLandmarks]
  );

  // 检查是否已投票
  const hasVoted = useCallback(
    async (landmarkId: number, userAddress: string): Promise<boolean> => {
      if (!contractInfo || !ethersReadonlyProvider) {
        return false;
      }

      try {
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersReadonlyProvider);
        return await contract.hasVoted(landmarkId, userAddress);
      } catch (e) {
        console.error("Check voted failed:", e);
        return false;
      }
    },
    [contractInfo, ethersReadonlyProvider]
  );

  return {
    landmarks,
    isLoading,
    isVoting,
    isDecrypting,
    isAdding,
    isAdmin,
    message,
    voteLandmark,
    decryptVotes,
    grantViewVotes,
    addLandmark,
    hasVoted,
    refreshLandmarks,
  };
}
