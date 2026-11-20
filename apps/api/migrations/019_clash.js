export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    ALTER TABLE duo_connections
      DROP CONSTRAINT IF EXISTS duo_connections_source_check;
    ALTER TABLE duo_connections
      ADD CONSTRAINT duo_connections_source_check
      CHECK (source IN ('like', 'availability', 'post', 'aram', 'clash'));
  `);

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS clash_posts (
      clash_posts_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      team_name VARCHAR(40) NOT NULL,
      day VARCHAR(10) NOT NULL,
      captain_role VARCHAR(10) NOT NULL,
      roles_needed TEXT[] NOT NULL,
      rank_min_tier VARCHAR(12) NOT NULL,
      rank_max_tier VARCHAR(12) NOT NULL,
      rank_min_index SMALLINT NOT NULL,
      rank_max_index SMALLINT NOT NULL,
      note VARCHAR(280),
      status VARCHAR(10) NOT NULL DEFAULT 'active',
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT clash_posts_day_check CHECK (day IN ('saturday', 'sunday', 'both')),
      CONSTRAINT clash_posts_captain_role_check CHECK (
        captain_role IN ('top', 'jungle', 'mid', 'adc', 'support')
      ),
      CONSTRAINT clash_posts_roles_check CHECK (array_length(roles_needed, 1) BETWEEN 1 AND 4),
      CONSTRAINT clash_posts_rank_index_check CHECK (rank_min_index <= rank_max_index),
      CONSTRAINT clash_posts_status_check CHECK (
        status IN ('active', 'filled', 'expired', 'cancelled')
      )
    )
  `);

  await queryInterface.sequelize.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS clash_posts_active_owner_idx ON clash_posts (owner_id) WHERE status = 'active'"
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS clash_posts_status_expires_idx ON clash_posts (status, expires_at)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS clash_posts_day_status_idx ON clash_posts (day, status)'
  );

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS clash_applications (
      clash_applications_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES clash_posts(clash_posts_id) ON DELETE CASCADE,
      applicant_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      role VARCHAR(10) NOT NULL,
      message VARCHAR(280),
      status VARCHAR(10) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT clash_applications_role_check CHECK (
        role IN ('top', 'jungle', 'mid', 'adc', 'support')
      ),
      CONSTRAINT clash_applications_status_check CHECK (
        status IN ('pending', 'accepted', 'rejected', 'withdrawn')
      )
    )
  `);

  await queryInterface.sequelize.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS clash_applications_post_applicant_idx ON clash_applications (post_id, applicant_id)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS clash_applications_post_status_idx ON clash_applications (post_id, status)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS clash_applications_applicant_status_idx ON clash_applications (applicant_id, status)'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS clash_applications');
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS clash_posts');
  await queryInterface.sequelize.query("DELETE FROM duo_connections WHERE source = 'clash'");
  await queryInterface.sequelize.query(`
    ALTER TABLE duo_connections
      DROP CONSTRAINT IF EXISTS duo_connections_source_check;
    ALTER TABLE duo_connections
      ADD CONSTRAINT duo_connections_source_check
      CHECK (source IN ('like', 'availability', 'post', 'aram'));
  `);
}
