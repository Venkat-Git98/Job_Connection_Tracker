const express = require('express');
const router = express.Router();
const Joi = require('joi');
const pool = require('../config/database');

// Validation schemas
const createUserSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.alphanum': 'Username can only contain letters and numbers',
      'string.min': 'Username must be at least 2 characters long',
      'string.max': 'Username cannot exceed 50 characters',
      'any.required': 'Username is required'
    }),
  displayName: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Display name cannot be empty',
      'string.max': 'Display name cannot exceed 255 characters',
      'any.required': 'Display name is required'
    }),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark').default('dark'),
    notifications: Joi.boolean().default(true),
    ai_personality: Joi.object().default({})
  }).default({
    theme: 'dark',
    notifications: true,
    ai_personality: {}
  })
});

const updateUserSchema = Joi.object({
  displayName: Joi.string().min(1).max(255),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark'),
    notifications: Joi.boolean(),
    ai_personality: Joi.object()
  })
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { username, displayName, preferences } = value;

    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'USERNAME_EXISTS',
        message: 'This username is already taken'
      });
    }

    // Create new user
    const result = await pool.query(`
      INSERT INTO users (username, display_name, preferences, last_active_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING id, username, display_name, preferences, created_at, last_active_at
    `, [username, displayName, JSON.stringify(preferences)]);

    const newUser = result.rows[0];

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.display_name,
        preferences: newUser.preferences,
        createdAt: newUser.created_at,
        lastActiveAt: newUser.last_active_at
      },
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Failed to create user',
      message: error.message
    });
  }
});

// GET /api/users - List all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, display_name, preferences, created_at, last_active_at,
             (SELECT COUNT(*) FROM profiles WHERE user_id = users.id) as profile_count,
             (SELECT COUNT(*) FROM jobs WHERE user_id = users.id) as job_count
      FROM users 
      ORDER BY last_active_at DESC, created_at DESC
    `);

    const users = result.rows.map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      preferences: user.preferences,
      createdAt: user.created_at,
      lastActiveAt: user.last_active_at,
      stats: {
        profiles: parseInt(user.profile_count),
        jobs: parseInt(user.job_count)
      }
    }));

    res.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to retrieve users',
      message: error.message
    });
  }
});

// GET /api/users/:id - Get user details
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    const result = await pool.query(`
      SELECT id, username, display_name, preferences, created_at, last_active_at
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'INVALID_USER',
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Get user statistics
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM profiles WHERE user_id = $1) as profile_count,
        (SELECT COUNT(*) FROM jobs WHERE user_id = $1) as job_count,
        (SELECT COUNT(*) FROM outreach WHERE user_id = $1) as outreach_count
    `, [userId]);

    const stats = statsResult.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        preferences: user.preferences,
        createdAt: user.created_at,
        lastActiveAt: user.last_active_at,
        stats: {
          profiles: parseInt(stats.profile_count),
          jobs: parseInt(stats.job_count),
          outreach: parseInt(stats.outreach_count)
        }
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user',
      message: error.message
    });
  }
});

// PUT /api/users/:id - Update user preferences
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    const { error, value } = updateUserSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    // Check if user exists
    const userExists = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        error: 'INVALID_USER',
        message: 'User not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (value.displayName) {
      updates.push(`display_name = $${paramCount}`);
      values.push(value.displayName);
      paramCount++;
    }

    if (value.preferences) {
      updates.push(`preferences = $${paramCount}`);
      values.push(JSON.stringify(value.preferences));
      paramCount++;
    }

    updates.push(`last_active_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, display_name, preferences, created_at, last_active_at
    `;

    const result = await pool.query(query, values);
    const updatedUser = result.rows[0];

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.display_name,
        preferences: updatedUser.preferences,
        createdAt: updatedUser.created_at,
        lastActiveAt: updatedUser.last_active_at
      },
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// POST /api/users/:id/activity - Update user last active timestamp
router.post('/:id/activity', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    await pool.query(
      'UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'User activity updated'
    });

  } catch (error) {
    console.error('Update user activity error:', error);
    res.status(500).json({
      error: 'Failed to update user activity',
      message: error.message
    });
  }
});

// DELETE /api/users/:id - Delete user (optional, for cleanup)
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    // Check if user exists
    const userExists = await pool.query(
      'SELECT id, username FROM users WHERE id = $1',
      [userId]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        error: 'INVALID_USER',
        message: 'User not found'
      });
    }

    const user = userExists.rows[0];

    // Delete user (CASCADE will handle related records)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      message: `User '${user.username}' deleted successfully`
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

module.exports = router;