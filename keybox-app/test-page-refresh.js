// Test script to simulate page refresh scenario
// This tests if passwords are properly loaded after a page refresh

async function testPageRefreshScenario() {
  try {
    console.log('🧪 Testing page refresh scenario...');

    const userId = 'a9343d11-e59a-4ee5-84d9-22fb7a3992c3'; // User ID from the logs

    // 1. First, test the load API directly
    console.log('📤 Step 1: Testing direct API load...');
    const loadResponse = await fetch('http://localhost:3002/api/passwords/load', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    if (!loadResponse.ok) {
      throw new Error(`Load API failed: ${loadResponse.status}`);
    }

    const loadData = await loadResponse.json();
    console.log('✅ Load API response:', {
      success: loadData.success,
      ciphersCount: loadData.ciphers?.length || 0,
      count: loadData.count || 0,
    });

    if (loadData.ciphers && loadData.ciphers.length > 0) {
      console.log('🔐 Sample cipher structure:', {
        id: loadData.ciphers[0].id,
        hasName: !!loadData.ciphers[0].name,
        hasData: !!loadData.ciphers[0].data,
        nameType: typeof loadData.ciphers[0].name,
        dataType: typeof loadData.ciphers[0].data,
        createdAt: loadData.ciphers[0].created_at
      });

      // Check if data is properly formatted (not double-serialized)
      try {
        if (typeof loadData.ciphers[0].name === 'string' && loadData.ciphers[0].name.startsWith('{')) {
          const parsedName = JSON.parse(loadData.ciphers[0].name);
          console.log('📝 Name structure:', {
            encryptionType: parsedName.encryptionType,
            hasData: !!parsedName.data,
            hasIv: !!parsedName.iv
          });
        }
      } catch (parseError) {
        console.warn('⚠️ Could not parse name field:', parseError.message);
      }
    }

    // 2. Test if the manage page would be able to load this data
    console.log('📤 Step 2: Testing manage page data flow...');
    
    if (loadData.success && loadData.ciphers.length > 0) {
      console.log('✅ Page refresh scenario should work - data is available');
      console.log('💡 The issue might be in the client-side loading logic or IndexedDB');
    } else {
      console.log('❌ Page refresh scenario will fail - no data available');
    }

    // 3. Provide debugging suggestions
    console.log('🔍 Debugging suggestions:');
    console.log('1. Check browser console for "📥 Data loading useEffect triggered"');
    console.log('2. Check for "📦 getLocalPasswords" logs');
    console.log('3. Check for "⚡ Loading passwords with optimized service"');
    console.log('4. Verify user authentication state persists across refresh');
    console.log('5. Check IndexedDB in browser DevTools -> Application -> Storage');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPageRefreshScenario();
