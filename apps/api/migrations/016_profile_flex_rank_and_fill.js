export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    ALTER TABLE player_profiles
      ADD COLUMN IF NOT EXISTS flex_rank_tier VARCHAR(12),
      ADD COLUMN IF NOT EXISTS flex_rank_division VARCHAR(3),
      ADD COLUMN IF NOT EXISTS flex_rank_lp INTEGER,
      ADD COLUMN IF NOT EXISTS flex_rank_index SMALLINT,
      ADD COLUMN IF NOT EXISTS flex_rank_source VARCHAR(10) NOT NULL DEFAULT 'declared';
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_roles_check;
    ALTER TABLE player_profiles
      ADD CONSTRAINT player_profiles_roles_check CHECK (
        primary_role IN ('top', 'jungle', 'mid', 'adc', 'support', 'fill')
        AND secondary_role IN ('top', 'jungle', 'mid', 'adc', 'support', 'fill')
      );

    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_roles_distinct_check;
    ALTER TABLE player_profiles
      ADD CONSTRAINT player_profiles_roles_distinct_check CHECK (
        primary_role = 'fill'
        OR secondary_role = 'fill'
        OR secondary_role <> primary_role
      );

    ALTER TABLE invites
      DROP CONSTRAINT IF EXISTS invites_role_check;
    ALTER TABLE invites
      ADD CONSTRAINT invites_role_check CHECK (
        role IN ('top', 'jungle', 'mid', 'adc', 'support', 'fill')
      );

    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_flex_tier_check;
    ALTER TABLE player_profiles
      ADD CONSTRAINT player_profiles_flex_tier_check CHECK (
        flex_rank_tier IS NULL
        OR flex_rank_tier IN (
          'iron', 'bronze', 'silver', 'gold', 'platinum',
          'emerald', 'diamond', 'master', 'grandmaster', 'challenger'
        )
      );

    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_flex_rank_shape_check;
    ALTER TABLE player_profiles
      ADD CONSTRAINT player_profiles_flex_rank_shape_check CHECK (
        (
          flex_rank_tier IS NULL
          AND flex_rank_division IS NULL
          AND flex_rank_index IS NULL
        )
        OR (
          flex_rank_tier IN ('master', 'grandmaster', 'challenger')
          AND flex_rank_division IS NULL
          AND flex_rank_index >= 0
        )
        OR (
          flex_rank_tier NOT IN ('master', 'grandmaster', 'challenger')
          AND flex_rank_division IN ('iv', 'iii', 'ii', 'i')
          AND flex_rank_index >= 0
        )
      );

    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_flex_rank_lp_check;
    ALTER TABLE player_profiles
      ADD CONSTRAINT player_profiles_flex_rank_lp_check
      CHECK (flex_rank_lp IS NULL OR flex_rank_lp >= 0);

    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_flex_rank_source_check;
    ALTER TABLE player_profiles
      ADD CONSTRAINT player_profiles_flex_rank_source_check
      CHECK (flex_rank_source IN ('declared', 'riot'));
  `);

  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS player_profiles_server_flex_rank_idx ON player_profiles (server, flex_rank_index)'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    UPDATE player_profiles
    SET primary_role = 'support'
    WHERE primary_role = 'fill' AND secondary_role = 'fill';

    UPDATE player_profiles
    SET primary_role = CASE WHEN secondary_role = 'support' THEN 'adc' ELSE 'support' END
    WHERE primary_role = 'fill';

    UPDATE player_profiles
    SET secondary_role = CASE WHEN primary_role = 'support' THEN 'adc' ELSE 'support' END
    WHERE secondary_role = 'fill';

    UPDATE invites SET role = 'support' WHERE role = 'fill';
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_roles_check;
    ALTER TABLE player_profiles
      ADD CONSTRAINT player_profiles_roles_check CHECK (
        primary_role IN ('top', 'jungle', 'mid', 'adc', 'support')
        AND secondary_role IN ('top', 'jungle', 'mid', 'adc', 'support')
      );

    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_roles_distinct_check;
    ALTER TABLE player_profiles
      ADD CONSTRAINT player_profiles_roles_distinct_check CHECK (secondary_role <> primary_role);

    ALTER TABLE invites
      DROP CONSTRAINT IF EXISTS invites_role_check;
    ALTER TABLE invites
      ADD CONSTRAINT invites_role_check CHECK (
        role IN ('top', 'jungle', 'mid', 'adc', 'support')
      );

    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_flex_tier_check;
    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_flex_rank_shape_check;
    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_flex_rank_lp_check;
    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_flex_rank_source_check;
  `);

  await queryInterface.sequelize.query('DROP INDEX IF EXISTS player_profiles_server_flex_rank_idx');
  await queryInterface.sequelize.query(`
    ALTER TABLE player_profiles
      DROP COLUMN IF EXISTS flex_rank_source,
      DROP COLUMN IF EXISTS flex_rank_index,
      DROP COLUMN IF EXISTS flex_rank_lp,
      DROP COLUMN IF EXISTS flex_rank_division,
      DROP COLUMN IF EXISTS flex_rank_tier;
  `);
}
