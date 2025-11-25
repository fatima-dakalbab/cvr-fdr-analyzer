const express = require('express');

const { createPresignedUpload, createPresignedDownload } = require('../services/storage');
const { validatePresignPayload, validateDownloadPayload } = require('../utils/validate-upload');

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

router.post('/download', async (req, res, next) => {
  try {
    const options = validateDownloadPayload(req.body);
    const result = await createPresignedDownload(options);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;