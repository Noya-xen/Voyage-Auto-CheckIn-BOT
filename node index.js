const https = require('https');
const fs = require('fs');

// Konfigurasi API
const API_CONFIG = {
  hostname: 'onvoyage-backend-954067898723.us-central1.run.app',
  basePath: '/api/v1',
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.6',
    'Content-Type': 'application/json',
    'Origin': 'https://app.onvoyage.ai',
    'Referer': 'https://app.onvoyage.ai/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

// Fungsi helper untuk membuat request HTTPS
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Fungsi untuk membaca token dari file akun.txt
function readTokensFromFile(filename = 'akun.txt') {
  try {
    const data = fs.readFileSync(filename, 'utf8');
    const tokens = data
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));
    
    return tokens;
  } catch (error) {
    console.error(`❌ Error membaca file ${filename}:`, error.message);
    return [];
  }
}

// Fungsi untuk mengambil profil user
async function getUserProfile(token) {
  const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  
  const options = {
    hostname: API_CONFIG.hostname,
    path: `${API_CONFIG.basePath}/user/profile`,
    method: 'GET',
    headers: {
      ...API_CONFIG.headers,
      'Authorization': authToken
    }
  };
  
  return await makeRequest(options);
}

// Fungsi untuk mengambil balance
async function getBalance(token) {
  const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  
  const options = {
    hostname: API_CONFIG.hostname,
    path: `${API_CONFIG.basePath}/user/balance`,
    method: 'GET',
    headers: {
      ...API_CONFIG.headers,
      'Authorization': authToken
    }
  };
  
  return await makeRequest(options);
}

// Fungsi untuk mengambil status
async function getStatus(token) {
  const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  
  const options = {
    hostname: API_CONFIG.hostname,
    path: `${API_CONFIG.basePath}/user/status`,
    method: 'GET',
    headers: {
      ...API_CONFIG.headers,
      'Authorization': authToken
    }
  };
  
  return await makeRequest(options);
}

// Fungsi untuk check-in
async function checkIn(token) {
  const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  
  const options = {
    hostname: API_CONFIG.hostname,
    path: `${API_CONFIG.basePath}/task/checkin`,
    method: 'POST',
    headers: {
      ...API_CONFIG.headers,
      'Authorization': authToken
    }
  };
  
  return await makeRequest(options);
}

// Fungsi untuk menampilkan informasi akun
function displayAccountInfo(accountNumber, profile, balance, status) {
  console.log('\n' + '='.repeat(60));
  console.log(`📱 INFORMASI AKUN #${accountNumber}`);
  console.log('='.repeat(60));
  
  if (profile && profile.data) {
    const data = profile.data;
    console.log(`👤 Username: ${data.username || 'N/A'}`);
    console.log(`🏷️  Display Name: ${data.display_name || 'N/A'}`);
    console.log(`🆔 User ID: ${data.id || 'N/A'}`);
    console.log(`📧 Login Provider: ${data.login_provider || 'N/A'}`);
    console.log(`✅ Status: ${data.status || 'N/A'}`);
    console.log(`📅 Created At: ${data.created_at || 'N/A'}`);
    
    if (data.wallets && data.wallets.length > 0) {
      console.log(`\n💼 Wallet:`);
      data.wallets.forEach(wallet => {
        const maskedAddress = wallet.address 
          ? `${wallet.address.substring(0, 8)}****${wallet.address.substring(wallet.address.length - 8)}`
          : 'N/A';
        console.log(`   - Chain: ${wallet.chain}`);
        console.log(`   - Address: ${maskedAddress}`);
      });
    }
  }
  
  if (balance && balance.data) {
    console.log(`\n💰 BALANCE:`);
    console.log(`   - Reward: ${balance.data.reward || 0}`);
    console.log(`   - Streak Days: ${balance.data.streak_days || 0}`);
  }
  
  console.log('='.repeat(60));
}

// Fungsi untuk menampilkan hasil check-in
function displayCheckInResult(accountNumber, result) {
  console.log('\n' + '🎯'.repeat(20));
  console.log(`✨ HASIL CHECK-IN AKUN #${accountNumber}`);
  console.log('🎯'.repeat(20));
  
  if (result.statusCode === 200 && result.data) {
    if (result.data.code === 0) {
      console.log(`✅ Status: BERHASIL`);
      console.log(`📊 Code: ${result.data.code}`);
      console.log(`💬 Message: ${result.data.message || 'success'}`);
      
      if (result.data.data) {
        console.log(`🎁 Reward: ${result.data.data.reward || 0}`);
        console.log(`🔥 Streak Days: ${result.data.data.streak_days || 0}`);
      }
    } else {
      console.log(`⚠️  Status: Gagal`);
      console.log(`📊 Code: ${result.data.code}`);
      console.log(`💬 Message: ${result.data.message || 'Unknown error'}`);
    }
  } else {
    console.log(`❌ Status: ERROR`);
    console.log(`📊 HTTP Code: ${result.statusCode}`);
    console.log(`💬 Response: ${JSON.stringify(result.data)}`);
  }
  
  console.log('🎯'.repeat(20) + '\n');
}

// Fungsi untuk format waktu countdown
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Fungsi countdown
async function countdown(seconds) {
  return new Promise((resolve) => {
    let remaining = seconds;
    
    const interval = setInterval(() => {
      process.stdout.write(`\r⏳ Waktu tunggu berikutnya: ${formatTime(remaining)} `);
      remaining--;
      
      if (remaining < 0) {
        clearInterval(interval);
        console.log('\n');
        resolve();
      }
    }, 1000);
  });
}

// Fungsi untuk menampilkan ringkasan
function displaySummary(results) {
  console.log('\n' + '📊'.repeat(20));
  console.log('📈 RINGKASAN CHECK-IN');
  console.log('📊'.repeat(20));
  
  const success = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Berhasil: ${success} akun`);
  console.log(`❌ Gagal: ${failed} akun`);
  console.log(`📋 Total: ${results.length} akun`);
  
  const totalReward = results.reduce((sum, r) => sum + (r.reward || 0), 0);
  console.log(`💰 Total Reward: ${totalReward}`);
  
  console.log('📊'.repeat(20) + '\n');
}

// Fungsi proses check-in untuk semua akun
async function processAllAccounts() {
  console.log('\n🚀 ONVOYAGE AUTO CHECK-IN SCRIPT');
  console.log('📅 Waktu: ' + new Date().toLocaleString('id-ID'));
  console.log('');
  
  // Baca token dari file akun.txt
  const tokens = readTokensFromFile('akun.txt');
  
  if (tokens.length === 0) {
    console.log('❌ Tidak ada token yang ditemukan di file akun.txt');
    return [];
  }
  
  console.log(`📋 Total akun: ${tokens.length}\n`);
  
  const results = [];
  
  // Proses setiap akun
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const accountNumber = i + 1;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Memproses akun ${accountNumber}/${tokens.length}`);
    console.log(`${'='.repeat(60)}`);
    
    const result = {
      accountNumber: accountNumber,
      success: false,
      reward: 0,
      streakDays: 0
    };
    
    try {
      // Ambil informasi akun
      console.log('📡 Mengambil informasi profil...');
      const profile = await getUserProfile(token);
      
      console.log('📡 Mengambil informasi balance...');
      const balance = await getBalance(token);
      
      console.log('📡 Mengambil status...');
      const status = await getStatus(token);
      
      // Tampilkan informasi akun
      displayAccountInfo(accountNumber, profile, balance, status);
      
      // Delay sebelum check-in
      console.log('⏳ Menunggu 2 detik sebelum check-in...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Lakukan check-in
      console.log('🎯 Melakukan check-in...');
      const checkInResult = await checkIn(token);
      
      // Tampilkan hasil check-in
      displayCheckInResult(accountNumber, checkInResult);
      
      // Simpan hasil
      if (checkInResult.statusCode === 200 && checkInResult.data && checkInResult.data.code === 0) {
        result.success = true;
        result.reward = checkInResult.data.data?.reward || 0;
        result.streakDays = checkInResult.data.data?.streak_days || 0;
      }
      
      // Delay antar akun
      if (i < tokens.length - 1) {
        console.log('⏳ Menunggu 3 detik sebelum memproses akun berikutnya...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
    } catch (error) {
      console.error(`❌ Error saat memproses akun #${accountNumber}:`, error.message);
      result.success = false;
    }
    
    results.push(result);
  }
  
  // Tampilkan ringkasan
  displaySummary(results);
  
  console.log('✅ SEMUA AKUN TELAH DIPROSES');
  
  return results;
}

// Fungsi utama dengan loop 24 jam
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       🚀 VOYAGE AUTO CHECK-IN BOT (24 JAM LOOP)            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  while (true) {
    try {
      // Jalankan proses check-in
      await processAllAccounts();
      
      // Hitung waktu tunggu (24 jam = 86400 detik)
      const waitTime = 24 * 60 * 60; // 24 jam dalam detik
      
      console.log('\n🎉 Check-in selesai!');
      console.log(`⏰ Script akan berjalan kembali dalam 24 jam`);
      console.log(`📅 Waktu berikutnya: ${new Date(Date.now() + waitTime * 1000).toLocaleString('id-ID')}`);
      console.log('\n' + '='.repeat(60));
      
      // Countdown 24 jam
      await countdown(waitTime);
      
    } catch (error) {
      console.error('❌ Error fatal:', error.message);
      console.log('🔄 Mencoba lagi dalam 5 menit...');
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }
  }
}

// Handle Ctrl+C untuk exit dengan bersih
process.on('SIGINT', () => {
  console.log('\n\n👋 Script dihentikan oleh user. Goodbye!');
  process.exit(0);
});

// Jalankan script
main();
