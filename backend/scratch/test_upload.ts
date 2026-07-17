const fs = require('fs');
const path = require('path');

async function test() {
  const formData = new FormData();
  const fileContent = Buffer.from('test image content');
  const blob = new Blob([fileContent], { type: 'image/jpeg' });
  formData.append('file', blob, 'test.jpg');

  try {
    const res = await fetch('http://localhost:3001/uploads/admin/image', {
      method: 'POST',
      headers: { 'x-admin-id': 'admin' },
      body: formData
    });
    
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error(err);
  }
}

test();
