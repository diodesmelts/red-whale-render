-- Check if push_to_hero_banner column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'competitions' 
        AND column_name = 'push_to_hero_banner'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE competitions
        ADD COLUMN push_to_hero_banner BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'push_to_hero_banner column added to competitions table';
    ELSE
        RAISE NOTICE 'push_to_hero_banner column already exists';
    END IF;
END $$;