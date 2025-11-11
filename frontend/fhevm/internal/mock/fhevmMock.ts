import { JsonRpcProvider, Contract } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";
import { FhevmInstance } from "../../fhevmTypes";

export const fhevmMockCreateInstance = async (parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): Promise<FhevmInstance> => {
  const provider = new JsonRpcProvider(parameters.rpcUrl);

  // Query InputVerifier EIP712 domain to get accurate verifying contract address and chainId
  const inputVerifierContract = new Contract(
    parameters.metadata.InputVerifierAddress,
    [
      "function eip712Domain() external view returns (bytes1, string, string, uint256, address, bytes32, uint256[])"
    ],
    provider
  );
  let verifyingContractAddressInputVerification = parameters.metadata.InputVerifierAddress;
  let gatewayChainId = parameters.chainId;
  try {
    const domain = await inputVerifierContract.eip712Domain();
    // domain[3] = chainId, domain[4] = verifyingContract
    if (domain && domain.length >= 5) {
      const domainChainId = Number(domain[3]);
      const domainVerifying = domain[4] as `0x${string}`;
      if (Number.isFinite(domainChainId)) gatewayChainId = domainChainId;
      if (typeof domainVerifying === "string") verifyingContractAddressInputVerification = domainVerifying;
      console.log(
        `[fhevmMockCreateInstance] InputVerifier EIP712 domain chainId: ${gatewayChainId}, verifyingContract: ${verifyingContractAddressInputVerification}`
      );
    }
  } catch {
    // Fallback to provided parameters if domain query fails
  }

  const instance = await MockFhevmInstance.create(
    provider,
    provider,
    {
      aclContractAddress: parameters.metadata.ACLAddress,
      chainId: parameters.chainId,
      gatewayChainId,
      inputVerifierContractAddress: parameters.metadata.InputVerifierAddress,
      kmsContractAddress: parameters.metadata.KMSVerifierAddress,
      verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
      verifyingContractAddressInputVerification
    },
    {
      // Required properties param in v0.3.0
      inputVerifierProperties: {},
      kmsVerifierProperties: {}
    }
  );
  return instance as unknown as FhevmInstance;
};


