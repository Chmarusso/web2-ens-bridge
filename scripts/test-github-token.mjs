// Usage: node scripts/test-github-token.mjs <TOKEN>

const token = process.argv[2];
if (!token) {
  console.error('Usage: node scripts/test-github-token.mjs <TOKEN>');
  process.exit(1);
}

const res = await fetch('https://api.github.com/user', {
  headers: {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'ens-verified-records',
  },
});

console.log('Status:', res.status);
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
