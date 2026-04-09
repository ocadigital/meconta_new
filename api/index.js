
// API Entry Point - Monolith Architecture
import { allowCors } from './lib/cors.js';
import * as controllers from './lib/controllers.js';
import * as whatsappController from './lib/whatsappController.js';

async function handler(req, res) {
  // Extract specific API path from request URL
  // Vercel rewrites will send /api/users to this file, so req.url might be /api/users
  // We need to parse the last segment of the path
  const urlParts = req.url.split('?')[0].split('/');
  // Usually ['', 'api', 'users'] -> pop gives 'users'
  // But strictly handling '/api/' prefix logic:
  const pathIndex = urlParts.indexOf('api');
  let path = pathIndex !== -1 && urlParts[pathIndex + 1] ? urlParts[pathIndex + 1] : 'unknown';
  
  // Handle nested routes like /api/webhook/whatsapp
  if (path === 'webhook' && urlParts[pathIndex + 2]) {
      path = `webhook/${urlParts[pathIndex + 2]}`;
  }

  switch(path) {
    case 'users':
      return controllers.usersHandler(req, res);
    case 'transactions':
      return controllers.transactionsHandler(req, res);
    case 'accounts':
      return controllers.accountsHandler(req, res);
    case 'categories':
      return controllers.categoriesHandler(req, res);
    case 'ai':
      return controllers.aiHandler(req, res);
    case 'goals':
      return controllers.goalsHandler(req, res);
    case 'webhook/whatsapp':
      return whatsappController.handler(req, res);
    default:
      return res.status(404).json({ error: `Endpoint /api/${path} not found. Available: users, transactions, accounts, categories, ai, goals, webhook/whatsapp` });
  }
}

export default allowCors(handler);
