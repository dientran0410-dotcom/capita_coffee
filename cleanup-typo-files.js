const fs = require('fs');
const { execSync } = require('child_process');

console.log('🧹 Cleaning up duplicate and typo files...\n');

const filesToDelete = [
  'src/pages/customer/NerbyStores.tsx',  // Typo: should be NearbyStores
  'src/pages/auth/VerifyOPT.tsx'         // Typo: should be VerifyOTP
];

let deletedCount = 0;
let notFoundCount = 0;

filesToDelete.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✅ Deleted: ${file}`);
      deletedCount++;
    } else {
      console.log(`⚠️  Not found (already cleaned?): ${file}`);
      notFoundCount++;
    }
  } catch (error) {
    console.log(`❌ Error deleting ${file}: ${error.message}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Deleted: ${deletedCount} files`);
console.log(`   Not found: ${notFoundCount} files`);

console.log('\n✅ Cleanup completed!');
console.log('\n📦 Now you can run: npm run build');
