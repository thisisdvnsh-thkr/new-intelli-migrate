const https = require('https');
const sodium = require('tweetsodium');

const [owner, repo, secretName] = process.argv.slice(2);
const token = process.env.GITHUB_PAT;
const secretValue = process.env.CLOUDFLARE_TOKEN;

if (!owner || !repo || !secretName) {
  console.error('Usage: node set_github_secret.js owner repo secretName');
  process.exit(1);
}
if (!token || !secretValue) {
  console.error('GITHUB_PAT and CLOUDFLARE_TOKEN must be provided as env vars');
  process.exit(1);
}

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({statusCode: res.statusCode, body: data});
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  try {
    // Get public key
    const pkOptions = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/actions/secrets/public-key`,
      method: 'GET',
      headers: {
        'User-Agent': 'setup-script',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const pkRes = await request(pkOptions);
    if (pkRes.statusCode !== 200) throw new Error('Failed to get public key: ' + pkRes.body);
    const pk = JSON.parse(pkRes.body);
    const publicKey = pk.key;
    const keyId = pk.key_id;

    // Encrypt secret
    const messageBytes = Buffer.from(secretValue);
    const keyBytes = Buffer.from(publicKey, 'base64');
    const encryptedBytes = sodium.seal(messageBytes, keyBytes);
    const encrypted = Buffer.from(encryptedBytes).toString('base64');

    // Put secret
    const putOptions = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/actions/secrets/${secretName}`,
      method: 'PUT',
      headers: {
        'User-Agent': 'setup-script',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    const body = JSON.stringify({encrypted_value: encrypted, key_id: keyId});
    const putRes = await request(putOptions, body);
    if (putRes.statusCode === 201 || putRes.statusCode === 204) {
      console.log('Secret uploaded successfully');
    } else {
      throw new Error('Failed to upload secret: ' + putRes.statusCode + ' ' + putRes.body);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
