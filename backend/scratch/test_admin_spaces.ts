async function test() {
  try {
    const res = await fetch('http://localhost:3001/spaces', {
      headers: {
        'x-admin-id': 'admin'
      }
    });
    
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Spaces count:', data.length);
    if (data.length > 0) {
      console.log('Types:', [...new Set(data.map((s: any) => s.type))]);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
