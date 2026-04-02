const { execSync } = require('child_process');

console.log('🚀 CAPITA COFFEE - PATH FIX & BUILD VERIFICATION');
console.log('='.repeat(60));
console.log('');

try {
  // Step 1: Clean up typo files
  console.log('📝 Step 1: Cleaning up typo files...\n');
  execSync('node cleanup-typo-files.js', { stdio: 'inherit' });
  
  // Step 2: Verify all paths
  console.log('\n📝 Step 2: Verifying all path fixes...\n');
  execSync('node verify-paths.js', { stdio: 'inherit' });
  
  // Step 3: Build project
  console.log('\n📝 Step 3: Building project...\n');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL CHECKS PASSED!');
  console.log('🎉 Project is ready to deploy!');
  console.log('='.repeat(60));
  
} catch (error) {
  console.log('\n' + '='.repeat(60));
  console.log('❌ BUILD FAILED');
  console.log('Please check the errors above and fix them.');
  console.log('='.repeat(60));
  process.exit(1);
}
