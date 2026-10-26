export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS duo_posts (
      duo_posts_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      queue VARCHAR(10) NOT NULL,
      roles_needed TEXT[] NOT NULL,
      rank_min_tier VARCHAR(12) NOT NULL,
      rank_max_tier VARCHAR(12) NOT NULL,
      rank_min_index SMALLINT NOT NULL,
      rank_max_index SMALLINT NOT NULL,
      note VARCHAR(140),
      status VARCHAR(10) NOT NULL DEFAULT 'active',
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT duo_posts_queue_check CHECK (queue IN ('solo_duo', 'flex')),
      CONSTRAINT duo_posts_roles_check CHECK (array_length(roles_needed, 1) BETWEEN 1 AND 2),
      CONSTRAINT duo_posts_rank_index_check CHECK (rank_min_index <= rank_max_index),
      CONSTRAINT duo_posts_status_check CHECK (
        status IN ('active', 'filled', 'expired', 'cancelled')
      )
    )
  `);

  await queryInterface.sequelize.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS duo_posts_active_owner_queue_idx ON duo_posts (owner_id, queue) WHERE status = 'active'"
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS duo_posts_status_expires_idx ON duo_posts (status, expires_at)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS duo_posts_queue_status_idx ON duo_posts (queue, status)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS duo_posts_owner_status_idx ON duo_posts (owner_id, status)'
  );

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS post_applications (
      post_applications_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES duo_posts(duo_posts_id) ON DELETE CASCADE,
      applicant_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      message VARCHAR(140),
      status VARCHAR(10) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT post_applications_status_check CHECK (
        status IN ('pending', 'accepted', 'rejected', 'withdrawn')
      )
    )
  `);

  await queryInterface.sequelize.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS post_applications_pair_idx ON post_applications (post_id, applicant_id)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS post_applications_post_status_idx ON post_applications (post_id, status)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS post_applications_applicant_status_idx ON post_applications (applicant_id, status)'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS post_applications');
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS duo_posts');
}
