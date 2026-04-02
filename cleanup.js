const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Starting cleanup and build check...\n');

// Files to delete
const filesToDelete = [
  'src/pages/customer/NerbyStores.tsx',
  'src/pages/auth/VerifyOPT.tsx'
];

// Delete files
console.log('📝 Deleting old files:\n');
filesToDelete.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✅ Deleted: ${file}`);
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  } catch (error) {
    console.log(`❌ Error deleting ${file}: ${error.message}`);
  }
});

// Run build
console.log('\n📦 Running TypeScript build check:\n');
try {
  execSync('npm run build', { stdio: 'inherit', shell: true });
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.log('\n❌ Build failed with errors above');
  process.exit(1);
}
