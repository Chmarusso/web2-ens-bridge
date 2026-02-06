'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

function shortAddress(address?: string) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ConnectButton({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <button
        className={className}
        onClick={() => disconnect()}
        type="button"
        aria-live="polite"
      >
        Connected {shortAddress(address)}
      </button>
    );
  }

  if (connectors.length === 1) {
    const connector = connectors[0];
    return (
      <button
        className={className}
        onClick={() => connect({ connector })}
        type="button"
        disabled={isPending}
        aria-live="polite"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="connector-list" role="group" aria-label="Connect wallet">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          className={`connector-option ${className ?? ''}`}
          onClick={() => connect({ connector })}
          type="button"
          disabled={isPending}
        >
          {isPending ? 'Connecting...' : connector.name}
        </button>
      ))}
    </div>
  );
}
