'use client';

import { useEffect, useState, useCallback } from 'react';

const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

interface GitHubButtonProps {
  className?: string;
  onAuthenticated?: (login: string, token: string) => void;
}

export default function GitHubButton({ className, onAuthenticated }: GitHubButtonProps) {
  const [login, setLogin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUser = useCallback(async (token: string) => {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const user = await res.json();
    setLogin(user.login);
    onAuthenticated?.(user.login, token);
  }, [onAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    // Clean the URL
    window.history.replaceState({}, '', window.location.pathname);

    setLoading(true);
    fetch('/api/auth/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.access_token) {
          console.log('[DEBUG] GitHub token:', data.access_token);
          fetchUser(data.access_token);
        }
      })
      .finally(() => setLoading(false));
  }, [fetchUser]);

  const handleLogin = () => {
    const redirect = window.location.href.split('?')[0];
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}`;
  };

  if (loading) {
    return <button className={className} disabled>Linking GitHub...</button>;
  }

  if (login) {
    return (
      <button className={className} onClick={handleLogin}>
        {login} (re-link)
      </button>
    );
  }

  return (
    <button className={className} onClick={handleLogin}>
      Link GitHub
    </button>
  );
}
