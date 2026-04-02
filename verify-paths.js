const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING ALL PATH FIXES\n');
console.log('=' .repeat(60));

// Check if typo files still exist (should be deleted)
console.log('\n📁 1. Checking typo files (should NOT exist):\n');
const typoFiles = [
  'src/pages/customer/NerbyStores.tsx',
  'src/pages/auth/VerifyOPT.tsx'
];

let typoIssues = 0;
typoFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`❌ FOUND (should be deleted): ${file}`);
    typoIssues++;
  } else {
    console.log(`✅ Correctly removed: ${file}`);
  }
});

// Check if correct files exist
console.log('\n📁 2. Checking correct files (should exist):\n');
const correctFiles = [
  'src/pages/customer/NearbyStores.tsx',
  'src/pages/auth/VerifyOTP.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/layouts/staff/StaffSidebar.tsx'
];

let missingFiles = 0;
correctFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ Exists: ${file}`);
  } else {
    console.log(`❌ MISSING: ${file}`);
    missingFiles++;
  }
});

// Check import statements in key files
console.log('\n📄 3. Checking import statements:\n');
const checks = [
  {
    file: 'src/App.tsx',
    shouldContain: '@/routes/MainRoute',
    shouldNotContain: '../src/routes/MainRoute'
  },
  {
    file: 'src/routes/MainRoute.tsx',
    shouldContain: '../pages/customer/NearbyStores',
    shouldNotContain: '../pages/customer/NerbyStores'
  },
  {
    file: 'src/routes/MainRoute.tsx',
    shouldContain: '../pages/auth/VerifyOTP',
    shouldNotContain: '../pages/auth/VerifyOPT'
  },
  {
    file: 'src/layouts/customer/CustomerLayout.tsx',
    shouldContain: 'layout/Sidebar',
    shouldNotContain: 'layout/SideBar'
  },
  {
    file: 'src/layouts/manager/ManagerLayout.tsx',
    shouldContain: 'layout/Sidebar',
    shouldNotContain: 'layout/SideBar'
  },
  {
    file: 'src/layouts/supplier/SupplierLayout.tsx',
    shouldContain: 'layout/Sidebar',
    shouldNotContain: 'layout/SideBar'
  },
  {
    file: 'src/layouts/staff/StaffLayout.tsx',
    shouldContain: 'staff/StaffSidebar',
    shouldNotContain: 'staff/StaffSideBar'
  }
];

let importIssues = 0;
checks.forEach(check => {
  if (!fs.existsSync(check.file)) {
    console.log(`⚠️  File not found: ${check.file}`);
    return;
  }
  
  const content = fs.readFileSync(check.file, 'utf8');
  const hasCorrect = content.includes(check.shouldContain);
  const hasIncorrect = content.includes(check.shouldNotContain);
  
  if (hasCorrect && !hasIncorrect) {
    console.log(`✅ ${check.file}`);
    console.log(`   ✓ Contains: "${check.shouldContain}"`);
  } else {
    console.log(`❌ ${check.file}`);
    if (!hasCorrect) {
      console.log(`   ✗ Missing: "${check.shouldContain}"`);
    }
    if (hasIncorrect) {
      console.log(`   ✗ Still has incorrect: "${check.shouldNotContain}"`);
    }
    importIssues++;
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY:\n');

const totalIssues = typoIssues + missingFiles + importIssues;

if (totalIssues === 0) {
  console.log('✅ ALL PATH FIXES VERIFIED SUCCESSFULLY!');
  console.log('   • No typo files found');
  console.log('   • All correct files exist');
  console.log('   • All imports are correct');
  console.log('\n🚀 Ready to build and deploy!');
  process.exit(0);
} else {
  console.log(`❌ Found ${totalIssues} issue(s):`);
  if (typoIssues > 0) console.log(`   • ${typoIssues} typo file(s) still exist`);
  if (missingFiles > 0) console.log(`   • ${missingFiles} expected file(s) missing`);
  if (importIssues > 0) console.log(`   • ${importIssues} incorrect import(s)`);
  console.log('\n⚠️  Please fix the issues above before deploying.');
  process.exit(1);
}
