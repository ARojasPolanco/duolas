export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    ALTER TABLE duo_connections
      DROP CONSTRAINT IF EXISTS duo_connections_source_check;
    ALTER TABLE duo_connections
      ADD CONSTRAINT duo_connections_source_check
      CHECK (source IN ('like', 'availability', 'post', 'aram'));
  `);

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS aram_posts (
      aram_posts_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      mode VARCHAR(8) NOT NULL,
      players_present SMALLINT NOT NULL,
      slots_needed SMALLINT NOT NULL,
      time_window VARCHAR(10) NOT NULL,
      has_mic BOOLEAN NOT NULL DEFAULT false,
      note VARCHAR(140),
      status VARCHAR(10) NOT NULL DEFAULT 'active',
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT aram_posts_mode_check CHECK (mode IN ('solo', 'group')),
      CONSTRAINT aram_posts_window_check CHECK (time_window IN ('now', 'tonight')),
      CONSTRAINT aram_posts_status_check CHECK (
        status IN ('active', 'filled', 'cancelled', 'expired')
      ),
      CONSTRAINT aram_posts_shape_check CHECK (
        (mode = 'solo' AND players_present = 1 AND slots_needed = 1)
        OR (
          mode = 'group'
          AND players_present BETWEEN 2 AND 4
          AND slots_needed BETWEEN 1 AND (5 - players_present)
        )
      )
    )
  `);

  await queryInterface.sequelize.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS aram_posts_active_owner_idx ON aram_posts (owner_id) WHERE status = 'active'"
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS aram_posts_status_expires_idx ON aram_posts (status, expires_at)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS aram_posts_mode_status_idx ON aram_posts (mode, status)'
  );

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS aram_applications (
      aram_applications_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES aram_posts(aram_posts_id) ON DELETE CASCADE,
      applicant_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      message VARCHAR(140),
      status VARCHAR(10) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT aram_applications_status_check CHECK (
        status IN ('pending', 'accepted', 'rejected', 'withdrawn')
      )
    )
  `);

  await queryInterface.sequelize.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS aram_applications_post_applicant_idx ON aram_applications (post_id, applicant_id)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS aram_applications_applicant_status_idx ON aram_applications (applicant_id, status)'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS aram_applications');
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS aram_posts');
  await queryInterface.sequelize.query("DELETE FROM duo_connections WHERE source = 'aram'");
  await queryInterface.sequelize.query(`
    ALTER TABLE duo_connections
      DROP CONSTRAINT IF EXISTS duo_connections_source_check;
    ALTER TABLE duo_connections
      ADD CONSTRAINT duo_connections_source_check
      CHECK (source IN ('like', 'availability', 'post'));
  `);
}
