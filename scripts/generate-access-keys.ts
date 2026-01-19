/**
 * Generate Secure Access Keys
 * 
 * Run this script to generate cryptographically secure access keys
 * for production use.
 * 
 * Usage:
 *   npx ts-node scripts/generate-access-keys.ts
 */

import { randomBytes } from 'crypto';
import { nanoid } from 'nanoid';

interface AccessKey {
  role: 'admin' | 'guide' | 'tourism';
  label: string;
  guideSlug?: string;
}

/**
 * Generate a secure random access key
 */
function generateKey(role: string): string {
  // Format: ak_{role}_{random_32_chars}
  const random = randomBytes(16).toString('hex'); // 32 chars
  return `ak_${role}_${random}`;
}

/**
 * Generate access keys for production
 */
function generateAccessKeys(keys: AccessKey[]): void {
  console.log('\n🔐 Generated Access Keys for Production\n');
  console.log('⚠️  IMPORTANT: Save these keys securely! They will not be shown again.\n');
  console.log('=' .repeat(80));
  
  const sqlStatements: string[] = [];
  
  keys.forEach((keyConfig, index) => {
    const key = generateKey(keyConfig.role);
    const guideId = keyConfig.guideSlug 
      ? `(SELECT id FROM guides WHERE slug = '${keyConfig.guideSlug}')` 
      : 'NULL';
    
    console.log(`\n${index + 1}. ${keyConfig.label}`);
    console.log(`   Role: ${keyConfig.role}`);
    if (keyConfig.guideSlug) {
      console.log(`   Guide: ${keyConfig.guideSlug}`);
    }
    console.log(`   Key: ${key}`);
    console.log(`   URL: YOUR_DOMAIN/d/${keyConfig.role === 'guide' ? `guide/${keyConfig.guideSlug}` : keyConfig.role}?k=${key}`);
    
    // Generate SQL INSERT statement
    sqlStatements.push(
      `INSERT INTO access_keys (key, role, guide_id, active, label) VALUES ('${key}', '${keyConfig.role}', ${guideId}, true, '${keyConfig.label}');`
    );
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 SQL Statements (run these in Supabase SQL Editor):\n');
  console.log('-- Delete demo keys');
  console.log("DELETE FROM access_keys WHERE key LIKE 'ak_demo%' OR key LIKE 'ak_sarah%' OR key LIKE 'ak_david%';\n");
  console.log('-- Insert new production keys');
  sqlStatements.forEach(sql => console.log(sql));
  
  console.log('\n✅ Done! Make sure to save these keys in a secure location (password manager).\n');
}

// Example usage: Define your production keys here
const productionKeys: AccessKey[] = [
  {
    role: 'admin',
    label: 'Super Admin Access',
  },
  {
    role: 'tourism',
    label: 'Ministry of Tourism Dashboard',
  },
  // Add guide keys as needed:
  // {
  //   role: 'guide',
  //   label: 'Guide Name - Dashboard Access',
  //   guideSlug: 'guide-slug-here',
  // },
];

// Run the generator
generateAccessKeys(productionKeys);

console.log('💡 Tip: To add more guides, first create them in the guides table, then run this script again.');
console.log('💡 Tip: Update this file with your guide slugs before running.\n');
