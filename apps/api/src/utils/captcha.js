import { envs } from '../config/enviroments.js';

const HCAPTCHA_VERIFY_URL = 'https://api.hcaptcha.com/siteverify';

export async function verifyCaptcha(token) {
  if (envs.NODE_ENV === 'test') return true;
  if (!envs.HCAPTCHA_SECRET) return true;
  if (!token) return false;

  try {
    const body = new URLSearchParams({
      secret: envs.HCAPTCHA_SECRET,
      response: token,
    });
    const response = await fetch(HCAPTCHA_VERIFY_URL, { method: 'POST', body });
    const data = await response.json();
    return Boolean(data.success);
  } catch (_error) {
    return false;
  }
}
