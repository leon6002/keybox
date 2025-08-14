// Test script to check if password loading API is working

async function testPasswordLoading() {
  try {
    console.log('🧪 Testing password loading API...');

    const requestBody = {
      userId: 'a9343d11-e59a-4ee5-84d9-22fb7a3992c3', // User ID from the logs
    };

    console.log('📤 Sending request:', requestBody);

    // Test the password load API
    const response = await fetch('http://localhost:3002/api/passwords/load', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Password loading API response:', {
        success: data.success,
        ciphersCount: data.ciphers?.length || 0,
        count: data.count || 0,
        hasData: !!data.ciphers,
        fullResponse: data
      });
      
      if (data.data?.passwords?.length > 0) {
        console.log('🔐 First password entry:', {
          id: data.data.passwords[0].id,
          hasName: !!data.data.passwords[0].name,
          hasData: !!data.data.passwords[0].data,
          createdAt: data.data.passwords[0].created_at
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPasswordLoading();
