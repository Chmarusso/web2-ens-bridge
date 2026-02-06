'use client';

import type { ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

const config = createConfig({
  chains: [sepolia, mainnet],
  connectors: projectId
    ? [
        injected(),
        walletConnect({
          projectId,
          metadata: {
            name: 'ENS Verified Records',
            description: 'Verify and attest your ENS identity records',
            url: 'https://ensverifiedrecords.com',
            icons: [],
          },
        }),
      ]
    : [injected()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
