import { Client } from 'pg';
import 'dotenv/config';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getCache, setCache, deleteCache } from '../../config/redis.js';

export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cacheKey = `conversations:${userId}`;
  const cached = await getCache(cacheKey);
  
  if (cached) {
    return res.json(cached);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // The single nested select query to get all conversations for the user
    // including the last message, unread count, and profiles of all members.
    // Also gets all contacts (other users not in a DM with current user).
    
    // 1. Get conversations
    const convQuery = `
      SELECT 
        c.id, c.type, c.name, c.description, c.avatar_url, c.created_by, c.last_message_id, c.last_activity_at,
        (
          SELECT json_build_object(
            'id', m.id, 'content', m.content, 'type', m.type, 'sender_id', m.sender_id, 'created_at', m.created_at
          )
          FROM public.messages m WHERE m.id = c.last_message_id
        ) as last_message,
        (
          SELECT json_agg(json_build_object(
            'user_id', cm2.user_id,
            'role', cm2.role,
            'is_muted', cm2.is_muted,
            'is_pinned', cm2.is_pinned,
            'is_archived', cm2.is_archived,
            'unread_count', cm2.unread_count,
            'joined_at', cm2.joined_at,
            'profile', (SELECT json_build_object(
              'id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url, 
              'avatar_color_bg', p.avatar_color_bg, 'avatar_color_text', p.avatar_color_text,
              'initials', p.initials, 'status', p.status, 'last_seen_at', p.last_seen_at
            ) FROM public.profiles p WHERE p.id = cm2.user_id)
          ))
          FROM public.conversation_members cm2 
          WHERE cm2.conversation_id = c.id
        ) as members
      FROM public.conversations c
      JOIN public.conversation_members cm ON cm.conversation_id = c.id
      WHERE cm.user_id = $1
      ORDER BY c.last_activity_at DESC
    `;
    
    const { rows: conversations } = await client.query(convQuery, [req.user.id]);

    // 2. Only get connected contacts (users already in DMs with current user)
    const contactsQuery = `
      SELECT DISTINCT
        p.id, p.full_name, p.avatar_url, p.avatar_color_bg, p.avatar_color_text, p.initials, p.status
      FROM public.conversations c
      JOIN public.conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
      JOIN public.conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id != $1
      JOIN public.profiles p ON p.id = cm2.user_id
      WHERE c.type = 'dm'
    `;
    const { rows: contacts } = await client.query(contactsQuery, [req.user.id]);

    // Format conversations to match what frontend expects
    const formattedConversations = conversations.map(c => {
      const myMembership = c.members ? c.members.find(m => m.user_id === req.user.id) : null;
      
      const formatted = {
        id: c.id,
        type: c.type,
        displayName: c.name,
        description: c.description || (c.type === 'group' ? `Official community group for "${c.name}".` : ''),
        createdBy: c.created_by,
        avatarUrl: c.avatar_url,
        last_message: c.last_message?.content || null,
        last_message_at: c.last_message?.created_at || null,
        unreadCount: myMembership?.unread_count || 0,
        isMuted: myMembership?.is_muted || false,
        isPinned: myMembership?.is_pinned || false,
        isArchived: myMembership?.is_archived || false,
        role: myMembership?.role || 'member',
        isAdmin: myMembership?.role === 'admin' || c.created_by === req.user.id,
        members: c.members || []
      };

      if (c.type === 'dm') {
        const otherMember = c.members.find(m => m.user_id !== req.user.id);
        if (otherMember?.profile) {
          formatted.displayName = otherMember.profile.full_name;
          formatted.avatarUrl = otherMember.profile.avatar_url;
          formatted.avatarColorBg = otherMember.profile.avatar_color_bg;
          formatted.avatarColorText = otherMember.profile.avatar_color_text;
          formatted.initials = otherMember.profile.initials;
          formatted.otherUserId = otherMember.profile.id;
          formatted.otherUserOnline = otherMember.profile.status === 'online';
        }
      }

      return formatted;
    });

    const responseData = { conversations: formattedConversations, contacts };
    await setCache(cacheKey, responseData, 60); // Cache for 60 seconds

    res.json(responseData);

  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
});

// GET /api/v1/chat/users/search?q=
export const searchUsers = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const rawQ = (req.query.q || '').trim();
  const q = rawQ.replace(/^@/, ''); // Remove leading @ if present

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    let query;
    let params;

    if (q) {
      query = `
        SELECT 
          COALESCE(u.id, p.id) AS id,
          COALESCE(u.full_name, p.full_name, 'Nexera User') AS full_name,
          COALESCE(u.username, LOWER(REGEXP_REPLACE(COALESCE(u.full_name, p.full_name, 'user'), '[^a-zA-Z0-9]', '', 'g'))) AS username,
          COALESCE(u.email, '') AS email,
          COALESCE(p.avatar_url, u.avatar_url) AS avatar_url,
          COALESCE(p.avatar_color_bg, '#6366f1') AS avatar_color_bg,
          COALESCE(p.avatar_color_text, '#ffffff') AS avatar_color_text,
          COALESCE(p.initials, UPPER(SUBSTRING(COALESCE(u.full_name, p.full_name, 'U') FROM 1 FOR 2))) AS initials,
          COALESCE(p.status, CASE WHEN u.is_online THEN 'online' ELSE 'offline' END) AS status,
          (
            SELECT c.id FROM public.conversations c
            JOIN public.conversation_members cm1 ON cm1.conversation_id = c.id
            JOIN public.conversation_members cm2 ON cm2.conversation_id = c.id
            WHERE c.type = 'dm' AND cm1.user_id = $1 AND cm2.user_id = COALESCE(u.id, p.id)
            LIMIT 1
          ) AS conversation_id
        FROM public.profiles p
        FULL OUTER JOIN "Users" u ON u.id = p.id
        WHERE COALESCE(u.id, p.id) != $1
          AND (
            u.username ILIKE $2
            OR u.full_name ILIKE $2
            OR u.email ILIKE $2
            OR p.full_name ILIKE $2
          )
        ORDER BY 
          CASE WHEN u.username ILIKE $3 THEN 0 ELSE 1 END,
          COALESCE(u.full_name, p.full_name) ASC
        LIMIT 20
      `;
      params = [currentUserId, `%${q}%`, `${q}%`];
    } else {
      query = `
        SELECT 
          COALESCE(u.id, p.id) AS id,
          COALESCE(u.full_name, p.full_name, 'Nexera User') AS full_name,
          COALESCE(u.username, LOWER(REGEXP_REPLACE(COALESCE(u.full_name, p.full_name, 'user'), '[^a-zA-Z0-9]', '', 'g'))) AS username,
          COALESCE(u.email, '') AS email,
          COALESCE(p.avatar_url, u.avatar_url) AS avatar_url,
          COALESCE(p.avatar_color_bg, '#6366f1') AS avatar_color_bg,
          COALESCE(p.avatar_color_text, '#ffffff') AS avatar_color_text,
          COALESCE(p.initials, UPPER(SUBSTRING(COALESCE(u.full_name, p.full_name, 'U') FROM 1 FOR 2))) AS initials,
          COALESCE(p.status, CASE WHEN u.is_online THEN 'online' ELSE 'offline' END) AS status,
          (
            SELECT c.id FROM public.conversations c
            JOIN public.conversation_members cm1 ON cm1.conversation_id = c.id
            JOIN public.conversation_members cm2 ON cm2.conversation_id = c.id
            WHERE c.type = 'dm' AND cm1.user_id = $1 AND cm2.user_id = COALESCE(u.id, p.id)
            LIMIT 1
          ) AS conversation_id
        FROM public.profiles p
        FULL OUTER JOIN "Users" u ON u.id = p.id
        WHERE COALESCE(u.id, p.id) != $1
        ORDER BY COALESCE(u.full_name, p.full_name) ASC
        LIMIT 15
      `;
      params = [currentUserId];
    }

    const { rows } = await client.query(query, params);

    // Remove any duplicate IDs if full outer join produced duplicate rows
    const seen = new Set();
    const users = [];
    for (const r of rows) {
      if (!r.id || seen.has(r.id)) continue;
      seen.add(r.id);
      users.push({
        id: r.id,
        fullName: r.full_name,
        username: r.username,
        email: r.email,
        avatarUrl: r.avatar_url,
        avatarColorBg: r.avatar_color_bg,
        avatarColorText: r.avatar_color_text,
        initials: r.initials,
        status: r.status,
        isConnected: !!r.conversation_id,
        conversationId: r.conversation_id || null
      });
    }

    res.json({ users });
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
});

const fetchAndFormatConversation = async (client, conversationId, currentUserId) => {
  const query = `
    SELECT 
      c.id, c.type, c.name, c.description, c.avatar_url, c.created_by, c.last_message_id, c.last_activity_at,
      (
        SELECT json_build_object(
          'id', m.id, 'content', m.content, 'type', m.type, 'sender_id', m.sender_id, 'created_at', m.created_at
        )
        FROM public.messages m WHERE m.id = c.last_message_id
      ) as last_message,
      (
        SELECT json_agg(json_build_object(
          'user_id', cm2.user_id,
          'role', cm2.role,
          'is_muted', cm2.is_muted,
          'is_pinned', cm2.is_pinned,
          'is_archived', cm2.is_archived,
          'unread_count', cm2.unread_count,
          'joined_at', cm2.joined_at,
          'profile', (SELECT json_build_object(
            'id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url, 
            'avatar_color_bg', p.avatar_color_bg, 'avatar_color_text', p.avatar_color_text,
            'initials', p.initials, 'status', p.status, 'last_seen_at', p.last_seen_at
          ) FROM public.profiles p WHERE p.id = cm2.user_id)
        ))
        FROM public.conversation_members cm2 
        WHERE cm2.conversation_id = c.id
      ) as members
    FROM public.conversations c
    WHERE c.id = $1
  `;
  const { rows } = await client.query(query, [conversationId]);
  if (rows.length === 0) return null;
  const c = rows[0];
  const myMembership = c.members ? c.members.find(m => m.user_id === currentUserId) : null;
  const formatted = {
    id: c.id,
    type: c.type,
    displayName: c.name,
    description: c.description || (c.type === 'group' ? `Official community group for "${c.name}".` : ''),
    createdBy: c.created_by,
    avatarUrl: c.avatar_url,
    last_message: c.last_message?.content || null,
    last_message_at: c.last_message?.created_at || null,
    unreadCount: myMembership?.unread_count || 0,
    isMuted: myMembership?.is_muted || false,
    isPinned: myMembership?.is_pinned || false,
    isArchived: myMembership?.is_archived || false,
    role: myMembership?.role || 'member',
    isAdmin: myMembership?.role === 'admin' || c.created_by === currentUserId,
    members: c.members || []
  };

  if (c.type === 'dm') {
    const otherMember = c.members.find(m => m.user_id !== currentUserId);
    if (otherMember?.profile) {
      formatted.displayName = otherMember.profile.full_name;
      formatted.avatarUrl = otherMember.profile.avatar_url;
      formatted.avatarColorBg = otherMember.profile.avatar_color_bg;
      formatted.avatarColorText = otherMember.profile.avatar_color_text;
      formatted.initials = otherMember.profile.initials;
      formatted.otherUserId = otherMember.profile.id;
      formatted.otherUserOnline = otherMember.profile.status === 'online';
    }
  }
  return formatted;
};

// POST /api/conversations/dm
export const createDM = asyncHandler(async (req, res) => {
  const { otherUserId, username } = req.body;
  if (!otherUserId && !username) {
    res.status(400).json({ error: 'otherUserId or username is required' });
    return;
  }
  const currentUserId = req.user.id;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    let targetUserId = otherUserId;
    if (!targetUserId && username) {
      const cleanUsername = username.trim().replace(/^@/, '');
      const userRes = await client.query(
        `SELECT id FROM "Users" WHERE username ILIKE $1 LIMIT 1`,
        [cleanUsername]
      );
      if (userRes.rows.length > 0) {
        targetUserId = userRes.rows[0].id;
      } else {
        const profRes = await client.query(
          `SELECT id FROM public.profiles WHERE full_name ILIKE $1 LIMIT 1`,
          [cleanUsername]
        );
        if (profRes.rows.length > 0) {
          targetUserId = profRes.rows[0].id;
        }
      }
    }

    if (!targetUserId) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (targetUserId === currentUserId) {
      res.status(400).json({ error: 'Cannot start a direct message with yourself' });
      return;
    }

    // Check if DM already exists
    const checkQuery = `
      SELECT c.id FROM public.conversations c
      JOIN public.conversation_members cm1 ON cm1.conversation_id = c.id
      JOIN public.conversation_members cm2 ON cm2.conversation_id = c.id
      WHERE c.type = 'dm' AND cm1.user_id = $1 AND cm2.user_id = $2
    `;
    const checkRes = await client.query(checkQuery, [currentUserId, targetUserId]);

    if (checkRes.rows.length > 0) {
      const convo = await fetchAndFormatConversation(client, checkRes.rows[0].id, currentUserId);
      res.json({ conversation: convo });
      return;
    }

    // Create new DM conversation
    const insertConv = `
      INSERT INTO public.conversations (type, created_by)
      VALUES ('dm', $1) RETURNING id
    `;
    const convRes = await client.query(insertConv, [currentUserId]);
    const conversationId = convRes.rows[0].id;

    // Add members
    const insertMember = `
      INSERT INTO public.conversation_members (conversation_id, user_id)
      VALUES ($1, $2), ($1, $3)
    `;
    await client.query(insertMember, [conversationId, currentUserId, targetUserId]);

    const convo = await fetchAndFormatConversation(client, conversationId, currentUserId);
    
    await deleteCache(`conversations:${currentUserId}`);
    await deleteCache(`conversations:${targetUserId}`);

    res.status(201).json({ conversation: convo });
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
});

// POST /api/conversations/group
export const createGroup = asyncHandler(async (req, res) => {
  const { name, description, avatarUrl, members = [] } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Group name is required' });
    return;
  }
  const currentUserId = req.user.id;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Create new group conversation
    const insertConv = `
      INSERT INTO public.conversations (type, name, description, avatar_url, created_by)
      VALUES ('group', $1, $2, $3, $4) RETURNING id
    `;
    const convRes = await client.query(insertConv, [name, description || null, avatarUrl || null, currentUserId]);
    const conversationId = convRes.rows[0].id;

    // Add creator as admin
    const insertCreator = `
      INSERT INTO public.conversation_members (conversation_id, user_id, role)
      VALUES ($1, $2, 'admin')
    `;
    await client.query(insertCreator, [conversationId, currentUserId]);

    // Add remaining members
    const otherMembers = members.filter(uid => uid !== currentUserId);
    if (otherMembers.length > 0) {
      const values = otherMembers.map((_, i) => `($1, $${i + 2}, 'member')`).join(', ');
      const insertMembers = `
        INSERT INTO public.conversation_members (conversation_id, user_id, role)
        VALUES ${values}
      `;
      await client.query(insertMembers, [conversationId, ...otherMembers]);
    }

    const convo = await fetchAndFormatConversation(client, conversationId, currentUserId);

    // Invalidate cache for all members
    for (const uid of members) {
      await deleteCache(`conversations:${uid}`);
    }
    // Creator is already in members, but just in case:
    await deleteCache(`conversations:${currentUserId}`);

    res.status(201).json({ conversation: convo });
  } finally {
    await client.end();
  }
});

// GET /api/conversations/:id
export const getConversationDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const convo = await fetchAndFormatConversation(client, id, currentUserId);
    if (!convo) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ conversation: convo });
  } finally {
    await client.end();
  }
});

// PATCH /api/conversations/:id
export const updateConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, avatarUrl } = req.body;
  const currentUserId = req.user.id;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Verify creator or admin role
    const adminCheck = await client.query(
      "SELECT role FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2",
      [id, currentUserId]
    );
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      res.status(403).json({ error: 'Only admins can update group details' });
      return;
    }

    await client.query(
      `UPDATE public.conversations 
       SET name = COALESCE($1, name), description = COALESCE($2, description), avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4`,
      [name, description, avatarUrl, id]
    );

    const convo = await fetchAndFormatConversation(client, id, currentUserId);

    // Get all members to invalidate caches
    const memRes = await client.query('SELECT user_id FROM public.conversation_members WHERE conversation_id = $1', [id]);
    for (const m of memRes.rows) {
      await deleteCache(`conversations:${m.user_id}`);
    }

    res.json({ conversation: convo });
  } finally {
    await client.end();
  }
});

// DELETE /api/conversations/:id/leave
export const leaveGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query(
      "DELETE FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2",
      [id, currentUserId]
    );

    // Get all members to invalidate caches
    const memRes = await client.query('SELECT user_id FROM public.conversation_members WHERE conversation_id = $1', [id]);
    for (const m of memRes.rows) {
      await deleteCache(`conversations:${m.user_id}`);
    }
    await deleteCache(`conversations:${currentUserId}`);

    res.json({ success: true });
  } finally {
    await client.end();
  }
});

// POST /api/conversations/:id/members
export const addMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { members = [] } = req.body;
  const currentUserId = req.user.id;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Verify membership
    const memberCheck = await client.query(
      "SELECT role FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2",
      [id, currentUserId]
    );
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    for (const userId of members) {
      await client.query(
        "INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING",
        [id, userId]
      );
    }

    const convo = await fetchAndFormatConversation(client, id, currentUserId);

    // Get all members to invalidate caches
    const memRes = await client.query('SELECT user_id FROM public.conversation_members WHERE conversation_id = $1', [id]);
    for (const m of memRes.rows) {
      await deleteCache(`conversations:${m.user_id}`);
    }

    res.json({ conversation: convo });
  } finally {
    await client.end();
  }
});

// DELETE /api/conversations/:id/members/:userId
export const removeMember = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const currentUserId = req.user.id;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Verify admin
    const adminCheck = await client.query(
      "SELECT role FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2",
      [id, currentUserId]
    );
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      res.status(403).json({ error: 'Only admins can remove members' });
      return;
    }

    await client.query(
      "DELETE FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2",
      [id, userId]
    );

    const convo = await fetchAndFormatConversation(client, id, currentUserId);

    // Get all members to invalidate caches
    const memRes = await client.query('SELECT user_id FROM public.conversation_members WHERE conversation_id = $1', [id]);
    for (const m of memRes.rows) {
      await deleteCache(`conversations:${m.user_id}`);
    }
    await deleteCache(`conversations:${userId}`);

    res.json({ conversation: convo });
  } finally {
    await client.end();
  }
});

// PATCH /api/conversations/:id/members/me
export const updateMembership = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isMuted, isPinned, isArchived } = req.body;
  const currentUserId = req.user.id;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(
      `UPDATE public.conversation_members 
       SET is_muted = COALESCE($1, is_muted), is_pinned = COALESCE($2, is_pinned), is_archived = COALESCE($3, is_archived)
       WHERE conversation_id = $4 AND user_id = $5`,
      [isMuted, isPinned, isArchived, id, currentUserId]
    );

    const convo = await fetchAndFormatConversation(client, id, currentUserId);
    await deleteCache(`conversations:${currentUserId}`);
    res.json({ conversation: convo });
  } finally {
    await client.end();
  }
});

// POST /api/conversations/:id/invite-link/reset
export const resetInviteLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Verify admin
    const adminCheck = await client.query(
      "SELECT role FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2",
      [id, currentUserId]
    );
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      res.status(403).json({ error: 'Only admins can reset invite link' });
      return;
    }

    const newLink = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await client.query(
      "UPDATE public.conversations SET invite_link = $1 WHERE id = $2",
      [newLink, id]
    );

    res.json({ inviteLink: newLink });
  } finally {
    await client.end();
  }
});

// POST /api/conversations/join/:inviteLink
export const joinViaInvite = asyncHandler(async (req, res) => {
  const { inviteLink } = req.params;
  const currentUserId = req.user.id;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const convRes = await client.query(
      "SELECT id FROM public.conversations WHERE invite_link = $1",
      [inviteLink]
    );
    if (convRes.rows.length === 0) {
      res.status(404).json({ error: 'Invalid invite link' });
      return;
    }
    const conversationId = convRes.rows[0].id;

    await client.query(
      "INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING",
      [conversationId, currentUserId]
    );

    const convo = await fetchAndFormatConversation(client, conversationId, currentUserId);

    // Get all members to invalidate caches
    const memRes = await client.query('SELECT user_id FROM public.conversation_members WHERE conversation_id = $1', [conversationId]);
    for (const m of memRes.rows) {
      await deleteCache(`conversations:${m.user_id}`);
    }

    res.json({ conversation: convo });
  } finally {
    await client.end();
  }
});
