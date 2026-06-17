const { HttpsProxyAgent } = require('https-proxy-agent');
const fetch = require('node-fetch');

const proxies = [
  "http://43.218.77.16:443",
  "http://156.244.1.250:8443",
  "http://36.95.152.58:12137",
  "http://103.6.207.108:8080"
];

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.status(200).end();
  }

  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  if (!url.includes('visionplus.id')) {
    return res.status(403).json({ error: 'Proxy ini khusus untuk Vision+' });
  }

  const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
  const agent = new HttpsProxyAgent(randomProxy);

  const headers = { ...req.headers };
  delete headers['host'];
  delete headers['connection'];
  delete headers['accept-encoding'];

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: headers,
      agent: agent,
      redirect: 'follow',
      timeout: 15000
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    
    response.headers.forEach((val, key) => {
      if (!['content-encoding', 'transfer-encoding', 'access-control-allow-origin', 'content-length'].includes(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });

    res.status(response.status);
    response.body.pipe(res);

  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(502).json({ 
      error: 'Gagal mengambil stream via Proxy', 
      proxyUsed: randomProxy,
      detail: error.message 
    });
  }
};
