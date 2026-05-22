const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();

console.log('==================================================');
console.log('🔑 World Cup Fantasy 2026 VAPID Keys Generated!');
console.log('==================================================');
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('==================================================');
console.log('👉 Please add these keys to your backend .env file');
console.log('👉 Add VAPID_PUBLIC_KEY to your frontend .env.local as NEXT_PUBLIC_VAPID_PUBLIC_KEY');
console.log('==================================================');
