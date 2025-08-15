const pool = require('../config/database');

/**
 * User context middleware that extracts and validates user ID from requests
 * Adds user context to req.user for use in route handlers
 */
const userContextMiddleware = async (req, res, next) => {
  try {
    // Skip user context for user management endpoints and health checks
    const skipPaths = ['/users', '/health'];
    const isSkipPath = skipPaths.some(path => req.path.startsWith(path));
    
    if (isSkipPath) {
      return next();
    }

    // Extract user ID from headers or query parameters
    const userId = req.headers['x-user-id'] || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        error: 'USER_CONTEXT_REQUIRED',
        message: 'Please select a user profile to continue',
        code: 'MISSING_USER_ID'
      });
    }

    // Validate user ID format
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt) || userIdInt <= 0) {
      return res.status(400).json({
        error: 'INVALID_USER_ID',
        message: 'Invalid user ID format',
        code: 'INVALID_FORMAT'
      });
    }

    // Verify user exists and is active
    const userResult = await pool.query(
      'SELECT id, username, display_name, preferences FROM users WHERE id = $1',
      [userIdInt]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'INVALID_USER',
        message: 'User not found or access denied',
        code: 'USER_NOT_FOUND'
      });
    }

    // Add user context to request
    req.user = {
      id: userResult.rows[0].id,
      username: userResult.rows[0].username,
      displayName: userResult.rows[0].display_name,
      preferences: userResult.rows[0].preferences
    };

    // Update user's last active timestamp (async, don't wait)
    pool.query(
      'UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userIdInt]
    ).catch(err => {
      console.warn('Failed to update user last active timestamp:', err);
    });

    next();

  } catch (error) {
    console.error('User context middleware error:', error);
    res.status(500).json({
      error: 'USER_CONTEXT_ERROR',
      message: 'Failed to validate user context',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Helper function to add user filtering to database queries
 * @param {string} baseQuery - The base SQL query
 * @param {Array} baseParams - The base query parameters
 * @param {number} userId - The user ID to filter by
 * @param {string} tableAlias - The table alias for the user_id column (optional)
 * @returns {Object} - Object with query and params
 */
const addUserFilter = (baseQuery, baseParams, userId, tableAlias = '') => {
  const userColumn = tableAlias ? `${tableAlias}.user_id` : 'user_id';
  
  // Check if WHERE clause already exists
  const hasWhere = baseQuery.toLowerCase().includes('where');
  const connector = hasWhere ? 'AND' : 'WHERE';
  
  const filteredQuery = `${baseQuery} ${connector} ${userColumn} = $${baseParams.length + 1}`;
  const filteredParams = [...baseParams, userId];
  
  return {
    query: filteredQuery,
    params: filteredParams
  };
};

/**
 * Helper function to validate user ownership of a resource
 * @param {string} table - The table name
 * @param {string} idColumn - The ID column name
 * @param {number} resourceId - The resource ID
 * @param {number} userId - The user ID
 * @returns {Promise<boolean>} - True if user owns the resource
 */
const validateUserOwnership = async (table, idColumn, resourceId, userId) => {
  try {
    const result = await pool.query(
      `SELECT id FROM ${table} WHERE ${idColumn} = $1 AND user_id = $2`,
      [resourceId, userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('User ownership validation error:', error);
    return false;
  }
};

/**
 * Middleware to ensure user owns a specific resource
 * @param {string} table - The table name
 * @param {string} paramName - The request parameter name containing the resource ID
 * @param {string} idColumn - The ID column name (defaults to 'id')
 */
const requireResourceOwnership = (table, paramName, idColumn = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'USER_CONTEXT_REQUIRED',
          message: 'User context required for resource access'
        });
      }

      const resourceId = req.params[paramName];
      if (!resourceId) {
        return res.status(400).json({
          error: 'MISSING_RESOURCE_ID',
          message: `Missing ${paramName} parameter`
        });
      }

      const hasAccess = await validateUserOwnership(table, idColumn, resourceId, req.user.id);
      
      if (!hasAccess) {
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'You do not have access to this resource'
        });
      }

      next();
    } catch (error) {
      console.error('Resource ownership middleware error:', error);
      res.status(500).json({
        error: 'OWNERSHIP_CHECK_ERROR',
        message: 'Failed to validate resource ownership'
      });
    }
  };
};

module.exports = {
  userContextMiddleware,
  addUserFilter,
  validateUserOwnership,
  requireResourceOwnership
};