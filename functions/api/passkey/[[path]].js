// /api/passkey и ниже: вход пасскеем (WebAuthn), §11.1 спецификации auth-kit.
// login/begin и login/finish идут без ключа (ключа у человека ещё нет), остальное с ключом; весь разбор и коды ответов в эталонном ../auth-kit.js.
import { passkeyResponse } from '../auth-kit.js';

const PROJECT_ID = 'gym-hero';   // константа в коде, не из запроса

export const onRequest = ({ request, env }) => passkeyResponse(request, env, PROJECT_ID);
