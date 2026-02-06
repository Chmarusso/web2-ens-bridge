'use client';

import { useAccount, useEnsName, useEnsResolver } from 'wagmi';
import { normalize } from 'viem/ens';

export function useEnsIdentity(chainId?: number) {
  const { address } = useAccount();

  const {
    data: ensName,
    isLoading: isLoadingName,
  } = useEnsName({ address, chainId });

  const {
    data: resolverAddress,
    isLoading: isLoadingResolver,
  } = useEnsResolver({
    name: ensName ? normalize(ensName) : undefined,
    chainId,
  });

  return {
    ensName: ensName ?? null,
    resolverAddress: resolverAddress ?? null,
    isLoading: isLoadingName || isLoadingResolver,
    hasEns: !!ensName,
  };
}
