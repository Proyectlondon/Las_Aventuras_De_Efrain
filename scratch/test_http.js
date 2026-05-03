const http = require('http');

function callOllamaWithHttp() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'llama3.1:8b',
      messages: [{ role: 'user', content: 'Say hello in 5 different languages. Return JSON.' }],
      response_format: { type: 'json_object' }
    });

    const req = http.request('http://127.0.0.1:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 900000 // 15 minutes
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.choices[0].message.content);
        } catch (e) {
          reject(new Error('Failed to parse response: ' + data));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HTTP request timed out'));
    });
    
    req.write(postData);
    req.end();
  });
}

callOllamaWithHttp()
  .then(console.log)
  .catch(console.error);
