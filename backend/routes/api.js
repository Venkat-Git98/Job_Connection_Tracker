const express = require('express');
const router = express.Router();

// Import route modules
router.use('/ingest', require('./ingest'));
router.use('/generate', require('./generate'));
router.use('/rewrite', require('./rewrite'));
router.use('/jobs', require('./jobs'));
router.use('/connections', require('./connections'));
router.use('/outreach', require('./outreach'));
router.use('/email', require('./email'));
router.use('/analytics', require('./analytics'));

module.exports = router;