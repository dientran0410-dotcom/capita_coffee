const fs = require('fs');

const filesToDelete = [
  'src/pages/customer/NerbyStores.tsx',
  'src/pages/auth/VerifyOPT.tsx'
];

console.log('Deleting old files with typos...\n');

filesToDelete.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✓ Deleted: ${file}`);
    } else {
      console.log(`✗ Not found: ${file}`);
    }
  } catch (error) {
    console.log(`✗ Error: ${file} - ${error.message}`);
  }
});

console.log('\nDone!');
