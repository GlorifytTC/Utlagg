const postgres = require('postgres');

// Use the DATABASE_URL from environment
const sql = postgres(process.env.DATABASE_URL);

async function fix() {
  try {
    console.log('Fixing admin roles...');
    
    // Change default for future users
    await sql`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'`;
    console.log('✓ Default role changed to user');
    
    // Set all users to user first
    await sql`UPDATE users SET role = 'user'`;
    console.log('✓ All users set to user');
    
    // Promote specific email to admin
    const result = await sql`UPDATE users SET role = 'admin' WHERE email = 'georgegqweqwelor40@hotmail.com' RETURNING email, role`;
    console.log('✓ Admin promoted:', result);
    
    // Verify
    const users = await sql`SELECT email, role FROM users`;
    console.table(users);
    
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fix();