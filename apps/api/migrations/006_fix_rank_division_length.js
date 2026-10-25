export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(
    'ALTER TABLE player_profiles ALTER COLUMN rank_division TYPE VARCHAR(3)'
  );
}

export async function down({ context: queryInterface }) {
  const [rows] = await queryInterface.sequelize.query(
    "SELECT 1 FROM player_profiles WHERE rank_division = 'iii' LIMIT 1"
  );

  if (rows.length) {
    // No se puede volver a VARCHAR(2) sin perder el valor 'iii'.
    return;
  }

  await queryInterface.sequelize.query(
    'ALTER TABLE player_profiles ALTER COLUMN rank_division TYPE VARCHAR(2)'
  );
}
