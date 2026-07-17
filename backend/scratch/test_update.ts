async function test() {
  const formData = {
    id: "fc71f272-2766-4978-b654-e99655949836",
    name: "Technology",
    description: "tech discussion updated",
    type: "PUBLIC",
    coverUrl: "https://media.naijanews360.com.ng/test.jpg"
  };

  try {
    const res = await fetch(`http://localhost:3001/spaces/${formData.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-id": "admin" },
      body: JSON.stringify(formData)
    });
    
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error(err);
  }
}

test();
