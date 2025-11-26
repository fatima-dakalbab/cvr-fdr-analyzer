const express = require('express');
const {
  listCases,
  findCaseByNumber,
  createCase,
  updateCase,
  deleteCase,
} = require('../services/cases');
const { analyzeFdrForCase } = require('../services/anomaly');
const { validateCasePayload } = require('../utils/validate-case');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const data = await listCases();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/:caseNumber/fdr/analyze', async (req, res, next) => {
  try {
    const parameters = Array.isArray(req.body?.parameters)
      ? req.body.parameters
      : undefined;
    const { algorithm } = req.body || {};

    const result = await analyzeFdrForCase(req.params.caseNumber, { parameters, algorithm });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:caseNumber', async (req, res, next) => {
  try {
    const caseData = await findCaseByNumber(req.params.caseNumber);
    if (!caseData) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    res.json(caseData);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = validateCasePayload(req.body);
    const created = await createCase(payload);
    res.status(201).json(created);
  } catch (error) {
    if (error.code === '23505') {
      error.status = 409;
      error.message = 'A case with this case number already exists.';
    }

    next(error);
  }
});

router.put('/:caseNumber', async (req, res, next) => {
  try {
    const payload = validateCasePayload({ ...req.body, caseNumber: req.params.caseNumber });
    const updated = await updateCase(req.params.caseNumber, payload);
    if (!updated) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:caseNumber', async (req, res, next) => {
  try {
    const removed = await deleteCase(req.params.caseNumber);
    if (!removed) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
