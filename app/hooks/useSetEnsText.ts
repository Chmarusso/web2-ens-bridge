'use client';

import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { namehash } from 'viem/ens';
import type { Address, Hash } from 'viem';
import { SET_TEXT_ABI } from '@/app/lib/constants';
import { useVerificationStore } from '@/app/lib/store';

export function useSetEnsText() {
  const chainId = useVerificationStore((s) => s.chainId);
  const { switchChainAsync } = useSwitchChain();
  const {
    writeContractAsync,
    data: txHash,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash: txHash, chainId });

  async function setText(
    resolverAddress: Address,
    ensName: string,
    key: string,
    value: string
  ): Promise<Hash> {
    await switchChainAsync({ chainId });
    const node = namehash(ensName);
    const hash = await writeContractAsync({
      chainId,
      address: resolverAddress,
      abi: SET_TEXT_ABI,
      functionName: 'setText',
      args: [node, key, value],
    });
    return hash;
  }

  return {
    setText,
    txHash: txHash ?? null,
    isWriting,
    isConfirming,
    isConfirmed,
    error: writeError,
  };
}
