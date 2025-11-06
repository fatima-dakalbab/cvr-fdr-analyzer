const express = require('express');

const { createPresignedUpload } = require('../services/storage');
const { validatePresignPayload } = require('../utils/validate-upload');

const router = express.Router();

router.post('/presign', async (req, res, next) => {
  try {
    const options = validatePresignPayload(req.body);
    const result = await createPresignedUpload(options);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;