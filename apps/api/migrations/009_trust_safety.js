export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS reports (
      reports_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reporter_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      reported_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      reason VARCHAR(20) NOT NULL,
      details VARCHAR(500),
      status VARCHAR(10) NOT NULL DEFAULT 'open',
      priority BOOLEAN NOT NULL DEFAULT false,
      admin_id UUID REFERENCES users(users_id) ON DELETE SET NULL,
      admin_note VARCHAR(500),
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT reports_distinct_check CHECK (reporter_id <> reported_id),
      CONSTRAINT reports_reason_check CHECK (
        reason IN ('toxicity', 'fake_rank', 'abandonment', 'spam', 'underage', 'other')
      ),
      CONSTRAINT reports_other_details_check CHECK (reason <> 'other' OR details IS NOT NULL),
      CONSTRAINT reports_status_check CHECK (
        status IN ('open', 'reviewing', 'resolved', 'dismissed')
      )
    )
  `);

  await queryInterface.sequelize.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS reports_open_pair_idx ON reports (reporter_id, reported_id) WHERE status IN ('open', 'reviewing')"
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS reports_status_created_idx ON reports (status, created_at)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS reports_reported_idx ON reports (reported_id)'
  );

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      feedbacks_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      connection_id UUID NOT NULL REFERENCES duo_connections(duo_connections_id) ON DELETE CASCADE,
      author_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      target_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      sentiment VARCHAR(8) NOT NULL,
      tags TEXT[] NOT NULL DEFAULT '{}',
      comment VARCHAR(280),
      visible_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT feedbacks_distinct_check CHECK (author_id <> target_id),
      CONSTRAINT feedbacks_sentiment_check CHECK (sentiment IN ('positive', 'negative')),
      CONSTRAINT feedbacks_tags_cardinality_check CHECK (
        COALESCE(array_length(tags, 1), 0) <= 3
      ),
      CONSTRAINT feedbacks_negative_tags_check CHECK (
        sentiment <> 'negative' OR COALESCE(array_length(tags, 1), 0) >= 1
      )
    )
  `);

  await queryInterface.sequelize.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS feedbacks_connection_author_idx ON feedbacks (connection_id, author_id)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS feedbacks_target_visible_idx ON feedbacks (target_id, visible_at)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS feedbacks_connection_idx ON feedbacks (connection_id)'
  );

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS sanctions (
      sanctions_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      admin_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      report_id UUID REFERENCES reports(reports_id) ON DELETE SET NULL,
      action VARCHAR(24) NOT NULL,
      reason VARCHAR(500) NOT NULL,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT sanctions_action_check CHECK (
        action IN ('warned', 'suspended_7d', 'suspended_30d', 'suspended_permanent')
      )
    )
  `);

  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS sanctions_user_created_idx ON sanctions (user_id, created_at)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS sanctions_admin_idx ON sanctions (admin_id)'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS sanctions');
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS feedbacks');
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS reports');
}
