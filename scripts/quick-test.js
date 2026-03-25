const http = require('http');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MjBmZGExOC03Nzk2LTQwNDctOTg5Mi1kMTEzMDRmNjBiNjciLCJyb2xlIjoiUlVOTkVSIiwiaWF0IjoxNzc0NDU2ODQ0LCJleHAiOjE3NzQ0NjA0NDR9.ab6fYIqqplYgAwe-kvKt6pTklqUgWBMr9RA8dV9UO3M';
const ORDER_ID = '9eaa326c-a5b6-41ac-804f-172b8135390b';

function claim(index) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/orders/${ORDER_ID}/claim`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        let msg = '';
        try { msg = JSON.parse(data).message || JSON.parse(data).error || ''; } catch(e) {}
        resolve({ index: index+1, status: res.statusCode, success: res.statusCode === 200, duration, msg });
      });
    });
    req.on('error', err => resolve({ index: index+1, status: 'ERR', success: false, duration: Date.now()-start, msg: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ index: index+1, status: 'T/O', success: false, duration: Date.now()-start, msg: 'timeout' }); });
    req.end();
  });
}

async function main() {
  console.log('Testing 10 concurrent claims...');
  const promises = Array.from({length: 10}, (_, i) => claim(i));
  const results = await Promise.all(promises);
  
  results.forEach(r => console.log(`Req ${r.index}: HTTP ${r.status} (${r.duration}ms) - ${r.msg}`));
  
  const success = results.filter(r => r.success).length;
  const conflict = results.filter(r => r.status === 409).length;
  const other = results.length - success - conflict;
  
  console.log(`\n=== Results ===`);
  console.log(`Success (200): ${success}`);
  console.log(`Conflict (409): ${conflict}`);
  console.log(`Other: ${other}`);
  console.log(success === 1 && conflict === 9 ? '\n✅ PASSED: Lock working correctly!' : '\n❌ FAILED: Check lock implementation');
}
main();
