export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS users (
      users_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(20) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(10) NOT NULL DEFAULT 'player',
      email_verified BOOLEAN NOT NULL DEFAULT false,
      email_verification_token VARCHAR(255),
      email_verification_expires TIMESTAMPTZ,
      password_reset_token VARCHAR(64),
      password_reset_expires TIMESTAMPTZ,
      age_confirmed_at TIMESTAMPTZ NOT NULL,
      terms_accepted_at TIMESTAMPTZ NOT NULL,
      status VARCHAR(10) NOT NULL DEFAULT 'active',
      suspended_until TIMESTAMPTZ,
      suspension_reason TEXT,
      warning_count INTEGER NOT NULL DEFAULT 0,
      last_login_at TIMESTAMPTZ,
      last_active_at TIMESTAMPTZ,
      is_deleted BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT users_role_check CHECK (role IN ('player', 'admin')),
      CONSTRAINT users_status_check CHECK (status IN ('active', 'suspended')),
      CONSTRAINT users_warning_count_check CHECK (warning_count >= 0)
    )
  `);

  await queryInterface.sequelize.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username))'
  );
  await queryInterface.sequelize.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email))'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS users_status_idx ON users (status)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS users_last_active_idx ON users (last_active_at)'
  );

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS errors (
      errors_id BIGSERIAL PRIMARY KEY,
      status VARCHAR(10) NOT NULL,
      status_code INTEGER,
      message TEXT NOT NULL,
      stack TEXT,
      method VARCHAR(10),
      path VARCHAR(255),
      user_id UUID,
      ip VARCHAR(45),
      user_agent TEXT,
      is_operational BOOLEAN,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS errors_created_at_idx ON errors (created_at)'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS errors');
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS users');
}
