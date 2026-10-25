export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS player_profiles (
      player_profiles_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(users_id) ON DELETE CASCADE,
      riot_id VARCHAR(30) NOT NULL,
      riot_id_normalized VARCHAR(30) NOT NULL UNIQUE,
      server VARCHAR(10) NOT NULL DEFAULT 'LAS',
      primary_role VARCHAR(10) NOT NULL,
      secondary_role VARCHAR(10) NOT NULL,
      rank_tier VARCHAR(12) NOT NULL,
      rank_division VARCHAR(2),
      rank_lp INTEGER,
      rank_index SMALLINT NOT NULL,
      play_style VARCHAR(10) NOT NULL,
      languages TEXT[] NOT NULL,
      has_mic BOOLEAN NOT NULL,
      schedule_blocks TEXT[] NOT NULL,
      bio VARCHAR(280),
      discord_tag VARCHAR(32),
      rank_source VARCHAR(10) NOT NULL DEFAULT 'declared',
      rank_verified_at TIMESTAMPTZ,
      reputation_positive INTEGER NOT NULL DEFAULT 0,
      reputation_negative INTEGER NOT NULL DEFAULT 0,
      reputation_score SMALLINT NOT NULL DEFAULT 50,
      reputation_calculated_at TIMESTAMPTZ,
      profile_completed_at TIMESTAMPTZ,
      is_deleted BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT player_profiles_server_check CHECK (server = 'LAS'),
      CONSTRAINT player_profiles_roles_check CHECK (
        primary_role IN ('top', 'jungle', 'mid', 'adc', 'support')
        AND secondary_role IN ('top', 'jungle', 'mid', 'adc', 'support')
      ),
      CONSTRAINT player_profiles_roles_distinct_check CHECK (secondary_role <> primary_role),
      CONSTRAINT player_profiles_tier_check CHECK (
        rank_tier IN (
          'iron', 'bronze', 'silver', 'gold', 'platinum',
          'emerald', 'diamond', 'master', 'grandmaster', 'challenger'
        )
      ),
      CONSTRAINT player_profiles_division_check CHECK (
        (
          rank_tier IN ('master', 'grandmaster', 'challenger')
          AND rank_division IS NULL
        )
        OR (
          rank_tier NOT IN ('master', 'grandmaster', 'challenger')
          AND rank_division IN ('iv', 'iii', 'ii', 'i')
        )
      ),
      CONSTRAINT player_profiles_rank_index_check CHECK (rank_index >= 0),
      CONSTRAINT player_profiles_rank_lp_check CHECK (rank_lp IS NULL OR rank_lp >= 0),
      CONSTRAINT player_profiles_style_check CHECK (
        play_style IN ('casual', 'ranked', 'tryhard')
      ),
      CONSTRAINT player_profiles_languages_check CHECK (
        array_length(languages, 1) BETWEEN 1 AND 3
      ),
      CONSTRAINT player_profiles_schedule_check CHECK (
        array_length(schedule_blocks, 1) BETWEEN 1 AND 28
      ),
      CONSTRAINT player_profiles_rank_source_check CHECK (
        rank_source IN ('declared', 'riot')
      ),
      CONSTRAINT player_profiles_reputation_check CHECK (
        reputation_positive >= 0
        AND reputation_negative >= 0
        AND reputation_score BETWEEN 0 AND 100
      )
    )
  `);

  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS player_profiles_server_rank_idx ON player_profiles (server, rank_index)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS player_profiles_primary_role_idx ON player_profiles (primary_role)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS player_profiles_schedule_gin_idx ON player_profiles USING GIN (schedule_blocks)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS player_profiles_reputation_idx ON player_profiles (reputation_score)'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS player_profiles');
}
