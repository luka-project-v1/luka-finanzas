import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key for seed operations (bypasses RLS)
// If not available, fallback to anon key (may have permission issues)
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  console.error('\n💡 Tip: Make sure your .env file has these variables set.');
  console.error('   For seed operations, SUPABASE_SERVICE_ROLE_KEY is recommended to bypass RLS.');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Warning: Using ANON_KEY instead of SERVICE_ROLE_KEY.');
  console.warn('   This may cause permission errors. Consider using SUPABASE_SERVICE_ROLE_KEY for seed operations.');
  console.warn('   You can find it in Supabase Dashboard → Settings → API → service_role key');
}

// Use service role key for seed operations (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('🌱 Starting seed...');

  // Create Account Types
  console.log('📝 Creating account types...');
  
  const accountTypes = [
    {
      code: 'BANK_ACCOUNT',
      name: 'Cuenta Bancaria',
      balance_nature: 'ASSET' as const,
    },
    {
      code: 'CREDIT_CARD',
      name: 'Tarjeta de Crédito',
      balance_nature: 'LIABILITY' as const,
    },
    {
      code: 'CASH',
      name: 'Efectivo',
      balance_nature: 'ASSET' as const,
    },
  ];

  for (const accountType of accountTypes) {
    // Check if account type already exists
    const { data: existing } = await supabase
      .from('account_types')
      .select('id')
      .eq('code', accountType.code)
      .single();

    if (!existing) {
      const { error } = await supabase
        .from('account_types')
        .insert(accountType);

      if (error) {
        console.error(`❌ Error creating account type ${accountType.code}:`, error.message);
      } else {
        console.log(`✅ Created account type: ${accountType.code}`);
      }
    } else {
      console.log(`⏭️  Account type already exists: ${accountType.code}`);
    }
  }

  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  });
