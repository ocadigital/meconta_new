import pool from './db.js';
import { sendEmail } from './email.js';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from "@google/genai";

// --- HELPERS ---
async function getGenAI() {
    let apiKey = process.env.API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        try {
            const [rows] = await pool.query("SELECT key_value FROM system_config WHERE key_name = 'google_api_key'");
            if (rows.length > 0 && rows[0].key_value) apiKey = rows[0].key_value;
        } catch (e) {}
    }
    if (!apiKey) throw new Error("API_KEY_MISSING");
    return new GoogleGenAI({ apiKey });
}

// --- CATEGORIES ---
export async function categoriesHandler(req, res) {
    try {
        const requesterId = req.headers['x-user-id'];
        if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
        const [userResult] = await pool.query('SELECT family_id FROM users WHERE id = ?', [requesterId]);
        if (userResult.length === 0) return res.status(403).json({ error: 'User invalid' });
        const familyId = userResult[0].family_id;

        const connection = await pool.getConnection();
        try {
            await connection.query(`CREATE TABLE IF NOT EXISTS categories (id INT AUTO_INCREMENT PRIMARY KEY, family_id VARCHAR(255), type VARCHAR(50), name VARCHAR(100), UNIQUE KEY unique_cat (family_id, type, name))`);
            try { await connection.query("ALTER TABLE categories MODIFY COLUMN type VARCHAR(50)"); } catch(e) {}
        } finally { connection.release(); }

        if (req.method === 'GET') {
            const [rows] = await pool.query('SELECT type, name FROM categories WHERE family_id = ?', [familyId]);
            const income = rows.filter(r => r.type === 'income').map(r => r.name);
            const expense = rows.filter(r => r.type === 'expense').map(r => r.name);
            return res.status(200).json({ income, expense });
        }
        
        if (req.method === 'POST') {
            const { income, expense } = req.body;
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                await connection.query('DELETE FROM categories WHERE family_id = ?', [familyId]);
                const inserts = [];
                if (income?.length) income.forEach(name => inserts.push([familyId, 'income', name]));
                if (expense?.length) expense.forEach(name => inserts.push([familyId, 'expense', name]));
                if (inserts.length > 0) await connection.query('INSERT INTO categories (family_id, type, name) VALUES ?', [inserts]);
                await connection.commit();
                return res.status(200).json({ success: true });
            } catch (e) { await connection.rollback(); throw e; } finally { connection.release(); }
        }
        return res.status(405).json({ error: 'Method not allowed' });
    } catch(e) { res.status(500).json({error: e.message}); }
}

// --- USERS ---
export async function usersHandler(req, res) {
  try {
    const action = req.query.action;

    // AUTO MIGRATION
    if (req.method === 'POST' || req.method === 'GET') {
        const connection = await pool.getConnection();
        try {
            try { await connection.query("ALTER TABLE users ADD COLUMN phone VARCHAR(50)"); } catch (e) {}
            try { await connection.query("ALTER TABLE users ADD COLUMN trial_ends_at DATETIME"); } catch (e) {}
            try { await connection.query("ALTER TABLE users ADD COLUMN avatar_color VARCHAR(50)"); } catch (e) {}
            try { await connection.query("ALTER TABLE users ADD COLUMN referred_by VARCHAR(255)"); } catch (e) {}
            try { await connection.query("CREATE TABLE IF NOT EXISTS alert_acknowledgements (user_id VARCHAR(255) NOT NULL, alert_key VARCHAR(255) NOT NULL, created_at DATETIME DEFAULT NOW(), PRIMARY KEY (user_id, alert_key))"); } catch(e) {}
        } finally { connection.release(); }
    }

    if (req.method === 'POST' && action === 'recover') { return res.status(200).json({success:true}); }

    if (req.method === 'POST' && action === 'login') {
        const { email, passwordHash } = req.body; 
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Inválido' });
        const user = users[0];
        const isMatch = await bcrypt.compare(passwordHash, user.password_hash) || user.password_hash === passwordHash; 
        if (!isMatch) return res.status(401).json({ error: 'Inválido' });
        
        await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
        const [familyUsers] = await pool.query('SELECT id, family_id, name, email, avatar_color, plan FROM users WHERE family_id = ?', [user.family_id]);
        
        const formattedUser = {
            id: user.id,
            familyId: user.family_id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatarColor: user.avatar_color,
            isAdmin: Boolean(user.is_admin),
            isApproved: Boolean(user.is_approved),
            plan: user.plan || 'basic'
        };
        const formattedFamily = familyUsers.map(u => ({ id: u.id, familyId: u.family_id, name: u.name, email: u.email, avatarColor: u.avatar_color, plan: u.plan }));
        return res.status(200).json({ user: formattedUser, familyUsers: formattedFamily });
    }

    const requesterId = req.headers['x-user-id'];

    // NOTIFICATIONS
    if (req.method === 'GET' && action === 'notifications') {
        if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
        const [rows] = await pool.query('SELECT alert_key FROM alert_acknowledgements WHERE user_id = ?', [requesterId]);
        return res.status(200).json({ ignoredKeys: rows.map(r => r.alert_key) });
    }
    if (req.method === 'POST' && action === 'ignore_alert') {
        if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
        const { alertKey } = req.body;
        await pool.query('INSERT IGNORE INTO alert_acknowledgements (user_id, alert_key) VALUES (?, ?, ?)', [requesterId, alertKey]);
        return res.status(200).json({ success: true });
    }

    // ADMIN ACTIONS
    if (req.method === 'GET' && action === 'all_users') {
        if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
        const [admins] = await pool.query('SELECT is_admin FROM users WHERE id = ?', [requesterId]);
        if (!admins[0]?.is_admin) return res.status(403).json({ error: 'Denied' });
        
        // Fetch users WITH referrer info using a self-join
        const [rows] = await pool.query(`
            SELECT u.id, u.name, u.email, u.phone, u.family_id as familyId, 
                   u.avatar_color as avatarColor, u.is_approved as isApproved, 
                   u.last_login_at as lastLoginAt, u.created_at as createdAt, 
                   u.plan, u2.name as referrerName
            FROM users u
            LEFT JOIN users u2 ON u.referred_by = u2.id
            ORDER BY u.created_at DESC
        `);
        return res.status(200).json(rows.map(u => ({...u, isApproved: Boolean(u.isApproved), isAdmin: false, plan: u.plan || 'basic'})));
    }

    if (req.method === 'POST' && action === 'update_user_status') {
        if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
        const [admins] = await pool.query('SELECT is_admin FROM users WHERE id = ?', [requesterId]);
        if (!admins[0]?.is_admin) return res.status(403).json({ error: 'Denied' });
        const { targetUserId, isApproved, plan } = req.body;
        if (isApproved !== undefined) await pool.query('UPDATE users SET is_approved = ? WHERE id = ?', [isApproved ? 1 : 0, targetUserId]);
        return res.status(200).json({ success: true });
    }

    // UPDATE PROFILE / REGISTER
    if (req.method === 'POST' && !action) {
      const { users } = req.body;
      const userList = Array.isArray(users) ? users : [users];
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const u of userList) {
          const [exists] = await connection.execute('SELECT id FROM users WHERE id = ?', [u.id]);
          if (exists.length > 0) {
            await connection.execute(
                'UPDATE users SET name = ?, email = ?, phone = ?, avatar_color = ? WHERE id = ?', 
                [u.name, u.email, u.phone || null, u.avatarColor, u.id]
            );
          } else {
            const [emailCheck] = await connection.execute('SELECT id FROM users WHERE email = ?', [u.email]);
            if (emailCheck.length > 0) throw new Error(`Email ${u.email} já existe.`);
            const [count] = await connection.execute('SELECT COUNT(*) as c FROM users');
            const isAdmin = count[0].c === 0 ? 1 : 0;
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(u.passwordHash, salt);
            
            // Check for referrer
            let referrerId = null;
            if (u.referredBy) {
                // Verify referrer exists
                const [refCheck] = await connection.execute('SELECT id FROM users WHERE id = ?', [u.referredBy]);
                if (refCheck.length > 0) referrerId = u.referredBy;
            }

            await connection.execute(
                'INSERT INTO users (id, family_id, name, email, phone, password_hash, avatar_color, is_admin, is_approved, plan, referred_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())', 
                [u.id, u.familyId, u.name, u.email, u.phone || null, hashed, u.avatarColor, isAdmin, 1, u.plan || 'basic', referrerId]
            );
            try {
                await connection.query(`CREATE TABLE IF NOT EXISTS bank_accounts (id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), owner_id VARCHAR(255), family_id VARCHAR(255), name VARCHAR(255), type VARCHAR(50), color VARCHAR(50), initial_balance DECIMAL(10,2), created_at DATETIME DEFAULT NOW())`);
                await connection.execute(`INSERT INTO bank_accounts (id, user_id, owner_id, family_id, name, type, color, initial_balance) VALUES (?, ?, ?, ?, ?, 'WALLET', 'bg-gray-800', 0)`, [Date.now().toString(), u.id, u.id, u.familyId, 'Carteira Física']);
            } catch(e) {}
          }
        }
        await connection.commit();
        return res.status(200).json({ success: true });
      } catch (err) { await connection.rollback(); throw err; } finally { connection.release(); }
    }

    if (req.method === 'GET' && !action) {
        if (!requesterId) return res.status(200).json([]);
        const [requester] = await pool.query('SELECT family_id FROM users WHERE id = ?', [requesterId]);
        if (requester.length === 0) return res.status(403).json({ error: 'User not found' });
        const [rows] = await pool.query('SELECT id, family_id as familyId, name, email, phone, avatar_color as avatarColor, plan, is_admin as isAdmin FROM users WHERE family_id = ?', [requester[0].family_id]);
        return res.status(200).json(rows.map(u => ({ ...u, isAdmin: Boolean(u.isAdmin) })));
    }

    if (action === 'delete_me') {
        if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
        await pool.execute('DELETE FROM transactions WHERE user_id = ?', [requesterId]);
        await pool.execute('DELETE FROM users WHERE id = ?', [requesterId]);
        return res.status(200).json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

// --- ACCOUNTS ---
export async function accountsHandler(req, res) { 
    try {
        const requesterId = req.headers['x-user-id'];
        if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
        const [userResult] = await pool.query('SELECT family_id FROM users WHERE id = ?', [requesterId]);
        if (userResult.length === 0) return res.status(403).json({ error: 'User invalid' });
        const familyId = userResult[0].family_id;

        if (req.method === 'GET') {
            const [accounts] = await pool.query('SELECT * FROM bank_accounts WHERE family_id = ?', [familyId]);
            const [cards] = await pool.query('SELECT c.* FROM credit_cards c JOIN bank_accounts a ON c.account_id = a.id WHERE a.family_id = ?', [familyId]);
            const result = accounts.map(a => ({
                id: a.id, userId: a.user_id, ownerId: a.owner_id, name: a.name, type: a.type, color: a.color, balance: parseFloat(a.initial_balance || 0),
                cards: cards.filter(c => c.account_id === a.id).map(c => ({ id: c.id, accountId: c.account_id, name: c.name, limit: parseFloat(c.limit_amount || 0), closingDay: c.closing_day, dueDay: c.due_day }))
            }));
            return res.status(200).json(result);
        }
        
        if (req.method === 'POST') {
            const { type } = req.query;
            const data = req.body;
            if (type === 'account') {
                await pool.query(`INSERT INTO bank_accounts (id, user_id, owner_id, family_id, name, type, color, initial_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, type=?, color=?, initial_balance=?`, [data.id, requesterId, data.ownerId, familyId, data.name, data.type, data.color, data.balance, data.name, data.type, data.color, data.balance]);
            } else if (type === 'card') {
                // Ensure columns exist if not already
                const connection = await pool.getConnection();
                try {
                    await connection.query("ALTER TABLE credit_cards ADD COLUMN due_day INT"); 
                } catch(e) {} finally { connection.release(); }

                await pool.query(`INSERT INTO credit_cards (id, account_id, owner_id, name, type, brand, closing_day, due_day, limit_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, limit_amount=?, due_day=?, closing_day=?`, [data.id, data.accountId, data.ownerId, data.name, 'CREDIT', 'VISA', data.closingDay, data.dueDay, data.limit, data.name, data.limit, data.dueDay, data.closingDay]);
            }
            return res.status(200).json({ success: true });
        }

        if (req.method === 'DELETE') {
            const { entity, id } = req.query;
            const connection = await pool.getConnection();
            try {
                if (entity === 'account') {
                    // Check for dependencies first (transactions)
                    const [trans] = await connection.execute('SELECT id FROM transactions WHERE account_id = ? LIMIT 1', [id]);
                    if (trans.length > 0) return res.status(400).json({ error: 'Esta conta possui transações vinculadas e não pode ser excluída.' });
                    // Delete cards first
                    await connection.execute('DELETE FROM credit_cards WHERE account_id = ?', [id]);
                    await connection.execute('DELETE FROM bank_accounts WHERE id = ? AND family_id = ?', [id, familyId]);
                } else if (entity === 'card') {
                    const [trans] = await connection.execute('SELECT id FROM transactions WHERE card_id = ? LIMIT 1', [id]);
                    if (trans.length > 0) return res.status(400).json({ error: 'Este cartão possui transações vinculadas e não pode ser excluído.' });
                    await connection.execute('DELETE FROM credit_cards WHERE id = ?', [id]);
                }
                return res.status(200).json({ success: true });
            } finally { connection.release(); }
        }

        res.status(200).json([]); 
    } catch(e) { res.status(500).json({error: e.message}); }
} 

// ... other handlers (aiHandler, goalsHandler, transactionsHandler) ...
export async function goalsHandler(req, res) {
    try {
        const requesterId = req.headers['x-user-id'];
        if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
        const [userResult] = await pool.query('SELECT family_id FROM users WHERE id = ?', [requesterId]);
        if (userResult.length === 0) return res.status(403).json({ error: 'User invalid' });
        const familyId = userResult[0].family_id;

        const connection = await pool.getConnection();
        try {
            await connection.query(`CREATE TABLE IF NOT EXISTS goals (id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), family_id VARCHAR(255), description TEXT, amount DECIMAL(10,2), image_url LONGTEXT, is_public TINYINT(1), created_at DATETIME DEFAULT NOW())`);
        } finally { connection.release(); }

        if (req.method === 'GET') {
            const [rows] = await pool.query('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC', [requesterId]);
            return res.status(200).json(rows.map(r => ({
                id: r.id, userId: r.user_id, familyId: r.family_id, description: r.description,
                amount: parseFloat(r.amount || 0), imageUrl: r.image_url, isPublic: Boolean(r.is_public), createdAt: r.created_at
            })));
        }

        if (req.method === 'POST') {
            const goal = req.body;
            await pool.query(`INSERT INTO goals (id, user_id, family_id, description, amount, image_url, is_public, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE description=?, amount=?, image_url=?, is_public=?`, 
                [goal.id, requesterId, familyId, goal.description, goal.amount, goal.imageUrl, goal.isPublic ? 1 : 0, goal.description, goal.amount, goal.imageUrl, goal.isPublic ? 1 : 0]);
            return res.status(200).json({ success: true });
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            await pool.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, requesterId]);
            return res.status(200).json({ success: true });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function transactionsHandler(req, res) {
  try {
    const requesterId = req.headers['x-user-id'];
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    const [userResult] = await pool.query('SELECT family_id FROM users WHERE id = ?', [requesterId]);
    if (userResult.length === 0) return res.status(403).json({ error: 'User invalid' });
    const familyId = userResult[0].family_id;
    const mode = req.query.mode;

    if (req.method === 'GET' || req.method === 'POST') {
        const connection = await pool.getConnection();
        try {
            await connection.query(`CREATE TABLE IF NOT EXISTS transactions (id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), member_id VARCHAR(255), date DATE, due_date DATE, date_purchase DATETIME, description VARCHAR(255), store VARCHAR(255), amount DECIMAL(10,2), amount_planned DECIMAL(10,2), amount_paid DECIMAL(10,2), type VARCHAR(20), category VARCHAR(100), payment_method VARCHAR(50), account_id VARCHAR(255), card_id VARCHAR(255), is_fixed TINYINT(1), is_paid TINYINT(1), is_private TINYINT(1) DEFAULT 0, is_imported TINYINT(1) DEFAULT 0, receipt_image LONGTEXT, notes TEXT, installment_number INT DEFAULT 1, installment_total INT DEFAULT 1, parent_transaction_id VARCHAR(255), created_at DATETIME DEFAULT NOW())`);
            await connection.query(`CREATE TABLE IF NOT EXISTS transaction_reactions (id INT AUTO_INCREMENT PRIMARY KEY, transaction_id VARCHAR(255), user_id VARCHAR(255), reaction_type VARCHAR(20), created_at DATETIME DEFAULT NOW(), UNIQUE KEY unique_reaction (transaction_id, user_id))`);
            try { await connection.query("ALTER TABLE transactions ADD COLUMN due_date DATE"); } catch(e) {}
            try { await connection.query("ALTER TABLE transactions ADD COLUMN account_id VARCHAR(255)"); } catch(e) {}
            try { await connection.query("ALTER TABLE transactions ADD COLUMN card_id VARCHAR(255)"); } catch(e) {}
            try { await connection.query("ALTER TABLE transactions ADD COLUMN is_imported TINYINT(1) DEFAULT 0"); } catch(e) {}
            try { await connection.query("ALTER TABLE transactions ADD COLUMN frequency_months TEXT"); } catch(e) {}
        } finally { connection.release(); }
    }

    if (mode === 'feed' && req.method === 'GET') {
        const sqlTrans = `SELECT t.id, t.user_id, t.member_id, t.date, t.created_at, t.description, t.store, t.amount, t.type, t.category, t.is_private, t.is_imported, u.name as user_name, u.avatar_color, (SELECT COUNT(*) FROM transaction_reactions WHERE transaction_id = t.id AND reaction_type = 'LIKE') as likes, (SELECT COUNT(*) FROM transaction_reactions WHERE transaction_id = t.id AND reaction_type = 'CLAP') as claps, (SELECT reaction_type FROM transaction_reactions WHERE transaction_id = t.id AND user_id = ?) as my_reaction FROM transactions t JOIN users u ON t.member_id = u.id WHERE u.family_id = ? AND (t.is_private = 0 OR t.member_id = ?) ORDER BY t.created_at DESC LIMIT 50`;
        const [rowsTrans] = await pool.query(sqlTrans, [requesterId, familyId, requesterId]);
        
        const sqlGoals = `SELECT g.id, g.user_id, g.description, g.amount, g.image_url, g.created_at, u.name as user_name, u.avatar_color FROM goals g LEFT JOIN users u ON g.user_id = u.id WHERE g.family_id = ? AND g.is_public = 1 ORDER BY g.created_at DESC LIMIT 3`;
        const [rowsGoals] = await pool.query(sqlGoals, [familyId]);

        const goalsFormatted = rowsGoals.map(g => ({
            id: g.id, userId: g.user_id, memberId: g.user_id, 
            date: new Date(g.created_at).toISOString(),
            description: `Nova Meta: ${g.description}`, store: 'Meta Financeira', amount: parseFloat(g.amount || 0),
            type: 'Meta', category: 'Sonho', isPrivate: false, userName: g.user_name || 'Família',
            avatarColor: g.avatar_color || 'bg-purple-500', imageUrl: g.image_url, reactions: { 'LIKE': 0, 'CLAP': 0 }, userReaction: null, isGoal: true
        }));

        const transactionsFormatted = rowsTrans.map(r => ({ 
            id: r.id, userId: r.user_id, memberId: r.member_id, 
            date: new Date(r.created_at || r.date).toISOString(),
            description: r.description, 
            store: r.store, amount: parseFloat(r.amount), type: r.type, category: r.category, isPrivate: Boolean(r.is_private), isImported: Boolean(r.is_imported),
            userName: r.user_name, avatarColor: r.avatar_color, reactions: { 'LIKE': r.likes, 'CLAP': r.claps }, userReaction: r.my_reaction 
        }));

        const combined = [...transactionsFormatted, ...goalsFormatted].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return res.status(200).json(combined.slice(0, 50));
    }

    if (mode === 'reaction' && req.method === 'POST') {
        const { transactionId, reactionType } = req.body;
        const connection = await pool.getConnection();
        try {
            const [existing] = await connection.execute('SELECT reaction_type FROM transaction_reactions WHERE transaction_id = ? AND user_id = ?', [transactionId, requesterId]);
            if (existing.length > 0) {
                if (existing[0].reaction_type === reactionType) await connection.execute('DELETE FROM transaction_reactions WHERE transaction_id = ? AND user_id = ?', [transactionId, requesterId]);
                else await connection.execute('UPDATE transaction_reactions SET reaction_type = ? WHERE transaction_id = ? AND user_id = ?', [reactionType, transactionId, requesterId]);
            } else await connection.execute('INSERT INTO transaction_reactions (transaction_id, user_id, reaction_type) VALUES (?, ?, ?)', [transactionId, requesterId, reactionType]);
            return res.status(200).json({ success: true });
        } finally { connection.release(); }
    }

    if (req.method === 'GET') {
        const [rows] = await pool.query(`SELECT * FROM transactions WHERE user_id IN (SELECT id FROM users WHERE family_id = ?) ORDER BY date DESC LIMIT 500`, [familyId]);
        return res.status(200).json(rows.map(t => ({
            id: t.id,
            userId: t.user_id,
            memberId: t.member_id || t.user_id,
            description: t.description,
            amount: parseFloat(t.amount),
            amountPlanned: parseFloat(t.amount_planned || t.amount),
            amountPaid: t.amount_paid ? parseFloat(t.amount_paid) : null,
            date: t.date ? new Date(t.date).toISOString().split('T')[0] : null,
            dueDate: t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : null,
            type: t.type,
            category: t.category,
            store: t.store,
            isFixed: Boolean(t.is_fixed),
            isPaid: Boolean(t.is_paid),
            isPrivate: Boolean(t.is_private),
            isImported: Boolean(t.is_imported),
            paymentMethod: t.payment_method || 'DEBIT',
            accountId: t.account_id,
            cardId: t.card_id,
            installmentTotal: t.installment_total || 1,
            frequencyMonths: t.frequency_months ? JSON.parse(t.frequency_months) : [],
            parentTransactionId: t.parent_transaction_id
        })));
    }

    if (req.method === 'POST') {
      const t = req.body;
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        
        let batchId = t.parentTransactionId || t.id;
        const baseDate = new Date(t.date);
        const currentYear = baseDate.getFullYear();
        
        if (t.isFixed && Array.isArray(t.frequencyMonths) && t.frequencyMonths.length > 0) {
            const months = t.frequencyMonths; 
            const day = baseDate.getDate();
            const freqJson = JSON.stringify(months);

            await connection.execute(
                `DELETE FROM transactions WHERE parent_transaction_id = ? AND YEAR(date) = ? AND MONTH(date) NOT IN (${months.join(',')})`,
                [batchId, currentYear]
            );

            for (const monthNum of months) {
                const itemDate = new Date(currentYear, monthNum - 1, day);
                let itemDueDate = null;
                if (t.dueDate) {
                    const dd = new Date(t.dueDate).getDate();
                    itemDueDate = new Date(currentYear, monthNum - 1, dd);
                }

                const [existing] = await connection.query(
                    `SELECT id, is_paid FROM transactions WHERE parent_transaction_id = ? AND YEAR(date) = ? AND MONTH(date) = ?`,
                    [batchId, currentYear, monthNum]
                );

                let targetId = existing.length > 0 ? existing[0].id : `${batchId}_${currentYear}_${monthNum}`;
                if (existing.length === 0 && monthNum === (baseDate.getMonth() + 1)) targetId = t.id;

                let finalIsPaid = 0;
                if (targetId === t.id) {
                    finalIsPaid = t.isPaid ? 1 : 0; 
                } else if (existing.length > 0) {
                    finalIsPaid = existing[0].is_paid; 
                } else {
                    finalIsPaid = 0; 
                }

                await connection.execute(
                    `INSERT INTO transactions (id, user_id, member_id, date, due_date, description, store, amount, amount_planned, type, category, payment_method, account_id, card_id, is_fixed, is_paid, is_private, is_imported, parent_transaction_id, installment_number, installment_total, frequency_months) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE description=?, amount=?, due_date=?, is_paid=?, account_id=?, card_id=?, category=?, type=?, payment_method=?, frequency_months=?`,
                    [
                        targetId, t.userId, t.memberId, itemDate, itemDueDate, t.description, t.store, t.amount, t.amount, 
                        t.type, t.category, t.paymentMethod, t.accountId || null, t.cardId || null, 1, 
                        finalIsPaid, t.isPrivate ? 1 : 0, t.isImported ? 1 : 0, batchId, 1, 1, freqJson,
                        t.description, t.amount, itemDueDate, finalIsPaid, t.accountId || null, t.cardId || null, t.category, t.type, t.paymentMethod, freqJson
                    ]
                );
            }
        } 
        else {
            const [existing] = await connection.execute('SELECT id FROM transactions WHERE id = ?', [t.id]);
            let installmentTotal = t.installmentTotal || 1;
            
            if (existing.length > 0) {
                 await connection.execute(`UPDATE transactions SET description=?, amount=?, due_date=?, is_paid=?, account_id=?, payment_method=?, card_id=?, category=?, type=? WHERE id=?`, 
                    [t.description, t.amount, t.dueDate || null, t.isPaid?1:0, t.accountId||null, t.paymentMethod, t.cardId||null, t.category, t.type, t.id]);
            } else {
                let baseDueDate = t.dueDate ? new Date(t.dueDate) : new Date(t.date);
                for (let i = 0; i < installmentTotal; i++) {
                    const currentId = i === 0 ? t.id : `${t.id}_${i}`;
                    const itemDate = new Date(baseDate);
                    itemDate.setMonth(baseDate.getMonth() + i);
                    
                    const itemDueDate = new Date(baseDueDate);
                    itemDueDate.setMonth(baseDueDate.getMonth() + i);

                    let description = t.description;
                    if (installmentTotal > 1) description = `${t.description} (${i+1}/${installmentTotal})`;
                    
                    const isPaidForThisItem = (t.isPaid && i === 0) ? 1 : 0;

                    await connection.execute(
                        `INSERT INTO transactions (id, user_id, member_id, date, due_date, description, store, amount, amount_planned, type, category, payment_method, account_id, card_id, is_fixed, is_paid, is_private, is_imported, parent_transaction_id, installment_number, installment_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            currentId, t.userId, t.memberId, itemDate, itemDueDate, description, t.store, t.amount, t.amount, 
                            t.type, t.category, t.paymentMethod, t.accountId || null, t.cardId || null, 0, 
                            isPaidForThisItem, t.isPrivate ? 1 : 0, t.isImported ? 1 : 0, t.id, i + 1, installmentTotal
                        ]
                    );
                }
            }
        }
        await connection.commit();
        return res.status(201).json({ success: true });
      } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
    }
    
    if (req.method === 'DELETE') {
        const { id } = req.query;
        await pool.execute('DELETE FROM transactions WHERE id = ?', [id]);
        return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function aiHandler(req, res) { 
    try {
        const { action, payload } = req.body;
        const genAI = await getGenAI();

        if (action === 'analyze_receipt') {
            const { base64Image, mimeType, context } = payload;
            const prompt = `Analise este recibo/nota. Extraia: data (YYYY-MM-DD), valor total (float), nome da loja/estabelecimento, descrição curta. ${context ? "Contexto: " + context : ""} Retorne JSON: {date, totalAmount, storeName, description, categorySuggestion}`;
            
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType, data: base64Image } }
                    ]
                }
            });
            const text = response.text;
            const json = text.replace(/```json|```/g, '').trim();
            return res.status(200).json({ result: JSON.parse(json) });
        }

        if (action === 'analyze_pdf_statement') {
            const { base64Pdf } = payload;
            const prompt = `
                Analise esta fatura de cartão ou extrato bancário.
                Extraia todas as transações em formato de lista.
                Para cada transação, identifique: 
                - data (YYYY-MM-DD)
                - descrição (limpa, sem códigos estranhos)
                - valor (float, positivo)
                - tipo (Entrada ou Saída)
                Retorne APENAS um Array JSON puro: [{ date, description, amount, type }, ...]
            `;
            
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: 'application/pdf', data: base64Pdf } }
                    ]
                }
            });
            const text = response.text;
            const json = text.replace(/```json|```/g, '').trim();
            return res.status(200).json({ result: JSON.parse(json) });
        }

        if (action === 'categorize_batch') {
            const { transactions, categories } = payload;
            const prompt = `
                Tenho estas transações: ${JSON.stringify(transactions)}.
                As categorias disponíveis são: ${JSON.stringify(categories)}.
                Para cada transação, sugira a categoria MAIS PROVÁVEL baseada na descrição e valor.
                Retorne um objeto JSON onde a chave é a descrição da transação e o valor é a categoria sugerida.
            `;
            
            const response = await genAI.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            const text = response.text;
            return res.status(200).json({ result: JSON.parse(text) });
        }

        if (action === 'chat') { 
            const { history, message } = payload;
            const chat = genAI.chats.create({
                model: 'gemini-3-flash-preview',
                history: history
            });
            const result = await chat.sendMessage({ message: message });
            return res.status(200).json({ result: result.text });
        }

        if (action === 'tts') { 
            const { text } = payload;
             const response = await genAI.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            return res.status(200).json({ result: base64Audio });
        }

        if (action === 'generate_image') { 
            const { prompt, size } = payload;
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
            });
            
            let base64Image = null;
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        base64Image = `data:image/png;base64,${part.inlineData.data}`;
                        break;
                    }
                }
            }
            return res.status(200).json({ result: base64Image });
        }

        res.status(200).json({});
    } catch(e) {
        console.error("AI Error", e);
        res.status(500).json({ error: e.message });
    }
}