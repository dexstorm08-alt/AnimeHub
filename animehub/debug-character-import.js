// Quick debug script to test character import
console.log('🔍 Debugging Character Import Issue...');

// Test 1: Check if database tables exist
console.log('\n📊 Step 1: Check Database Tables');
console.log('Run these SQL queries in your Supabase dashboard:');
console.log(`
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('anime_characters', 'anime_relations', 'anime_studios');
`);

// Test 2: Check if anime_characters table has correct structure
console.log('\n📊 Step 2: Check Table Structure');
console.log(`
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'anime_characters' 
ORDER BY ordinal_position;
`);

// Test 3: Check if any characters exist
console.log('\n📊 Step 3: Check Existing Characters');
console.log(`
SELECT COUNT(*) as total_characters FROM anime_characters;
`);

// Test 4: Check if any anime exist
console.log('\n📊 Step 4: Check Existing Anime');
console.log(`
SELECT COUNT(*) as total_anime FROM anime;
`);

console.log('\n🚨 Most Likely Issues:');
console.log('1. anime_characters table does not exist');
console.log('2. Database setup not run (anime-relations-setup.sql)');
console.log('3. Import process not using AniList (using Jikan instead)');
console.log('4. AniList API not returning character data');
console.log('5. Database permissions/RLS blocking inserts');

console.log('\n🔧 Solutions:');
console.log('1. Run anime-relations-setup.sql in Supabase');
console.log('2. Use AniList Search (not Jikan) for imports');
console.log('3. Check console logs during import');
console.log('4. Use debug tools in admin panel');
