// POST /api/claim: погашение одноразового кода входа (QR или ручной ввод), §10.1 спецификации auth-kit.
// Ключа у человека ещё нет, поэтому маршрут без проверки ключа; весь разбор и коды ответов в эталонном ./auth-kit.js.
import { claimResponse } from './auth-kit.js';

const PROJECT_ID = 'gym-hero';   // константа в коде, не из запроса

export const onRequest = ({ request, env }) => claimResponse(request, env, PROJECT_ID);
