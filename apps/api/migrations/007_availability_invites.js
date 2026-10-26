export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS availability_sessions (
      availability_sessions_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      roles TEXT[] NOT NULL,
      queue VARCHAR(10) NOT NULL,
      note VARCHAR(140),
      status VARCHAR(10) NOT NULL DEFAULT 'active',
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL,
      ended_at TIMESTAMPTZ,
      closed_reason VARCHAR(10),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT availability_roles_check CHECK (array_length(roles, 1) BETWEEN 1 AND 2),
      CONSTRAINT availability_queue_check CHECK (queue IN ('solo_duo', 'flex')),
      CONSTRAINT availability_status_check CHECK (status IN ('active', 'closed')),
      CONSTRAINT availability_closed_reason_check CHECK (
        closed_reason IS NULL OR closed_reason IN ('expired', 'manual', 'matched')
      ),
      CONSTRAINT availability_closed_consistency_check CHECK (
        status = 'active' OR (ended_at IS NOT NULL AND closed_reason IS NOT NULL)
      )
    )
  `);

  await queryInterface.sequelize.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS availability_active_user_idx ON availability_sessions (user_id) WHERE status = 'active'"
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS availability_status_expires_idx ON availability_sessions (status, expires_at)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS availability_queue_status_idx ON availability_sessions (queue, status)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS availability_started_ended_idx ON availability_sessions (started_at, ended_at)'
  );

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS invites (
      invites_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      from_user_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      to_user_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      availability_id UUID NOT NULL REFERENCES availability_sessions(availability_sessions_id) ON DELETE CASCADE,
      role VARCHAR(10) NOT NULL,
      message VARCHAR(140),
      status VARCHAR(10) NOT NULL DEFAULT 'pending',
      expires_at TIMESTAMPTZ NOT NULL,
      responded_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT invites_distinct_check CHECK (from_user_id <> to_user_id),
      CONSTRAINT invites_role_check CHECK (role IN ('top', 'jungle', 'mid', 'adc', 'support')),
      CONSTRAINT invites_status_check CHECK (
        status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired')
      )
    )
  `);

  await queryInterface.sequelize.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS invites_pending_pair_idx ON invites (from_user_id, to_user_id) WHERE status = 'pending'"
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS invites_to_status_idx ON invites (to_user_id, status)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS invites_expires_idx ON invites (expires_at)'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS invites');
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS availability_sessions');
}
