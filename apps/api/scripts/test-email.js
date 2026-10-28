import { randomUUID } from 'node:crypto';
import { envs } from '../src/config/enviroments.js';
import { mailService } from '../src/config/resend/resend.js';

const to = process.argv[2] || envs.TEST_EMAIL_TO;

if (!to) {
  console.error('Uso: npm run mail:test --workspace @duo-las/api -- email@dominio.com');
  process.exit(1);
}

if (!envs.RESEND_API_KEY) {
  console.error('Falta RESEND_API_KEY en apps/api/.env');
  process.exit(1);
}

const token = randomUUID().replaceAll('-', '');
const suspendedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const cases = [
  ['verificación', () => mailService.sendVerificationEmail(to, token)],
  ['reset', () => mailService.sendPasswordResetEmail(to, token)],
  ['suspensión', () => mailService.sendSuspensionEmail(to, 'Prueba de plantilla.', suspendedUntil)],
];

let failed = 0;

for (const [name, send] of cases) {
  const result = await send();

  if (result?.id) {
    console.log(`OK  ${name}`);
  } else {
    failed += 1;
    console.error(`ERROR ${name}`);
  }
}

if (failed > 0) {
  console.error(`Fallaron ${failed} de ${cases.length} emails. Revisá el log de la API.`);
  process.exitCode = 1;
} else {
  console.log(`Listo: ${cases.length} emails enviados a la casilla configurada.`);
}
