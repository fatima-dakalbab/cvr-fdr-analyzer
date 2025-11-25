const pool = require('../db/pool');
const { mapToDbCase, mapFromDbCase } = require('../utils/case-mapper');
const { objectExists } = require('./storage');
const { deriveCaseStatus } = require('../utils/case-status');

const resolveStorageTarget = (attachment) => {
  if (!attachment || typeof attachment !== 'object') {
    return null;
  }

  const storage = attachment.storage;
  if (!storage || typeof storage !== 'object') {
    return null;
  }

  const objectKey = storage.objectKey || storage.key;
  if (!objectKey) {
    return null;
  }

  const bucket = storage.bucket || storage.bucketName || null;
  return { bucket, objectKey };
};

const filterMissingAttachments = async (attachments) => {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return [];
  }

  const results = await Promise.all(
    attachments.map(async (attachment) => {
      if (!attachment || typeof attachment !== 'object') {
        return attachment || null;
      }

      const target = resolveStorageTarget(attachment);
      if (!target) {
        return attachment;
      }

      try {
        const exists = await objectExists(target);
        return exists ? attachment : null;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          'Unable to verify object storage entry for attachment',
          target.bucket,
          target.objectKey,
          error,
        );
        return attachment;
      }
    }),
  );

  return results.filter((item) => Boolean(item));
};

const hydrateCaseRow = async (row) => {
  const mapped = mapFromDbCase(row);
  const attachments = await filterMissingAttachments(mapped.attachments);
  return { ...mapped, attachments };
};

const listCases = async () => {
   const { rows } = await pool.query(
    `SELECT * FROM cases ORDER BY last_updated DESC NULLS LAST, created_at DESC`,
  );
  const safeRows = Array.isArray(rows) ? rows : [];
  return Promise.all(safeRows.map(hydrateCaseRow));
};

const findCaseByNumber = async (caseNumber) => {
  const { rows } = await pool.query('SELECT * FROM cases WHERE case_number = $1', [caseNumber]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return hydrateCaseRow(rows[0]);
};

const toNullIfEmpty = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const coerceJsonValue = (value, fallback) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback;
    }

    try {
      return JSON.parse(trimmed);
    } catch (_error) {
      return fallback;
    }
  }

  if (typeof value === 'object') {
    return value;
  }

  return fallback;
};

const toJsonbParameter = (value, fallback) => JSON.stringify(coerceJsonValue(value, fallback));

const extractRows = (result) => {
  if (!result || !Array.isArray(result.rows)) {
    return [];
  }

  return result.rows;
};

const createCase = async (payload) => {
  const data = mapToDbCase(payload);
  const derivedStatus = deriveCaseStatus(data);

  const query = `
    INSERT INTO cases (
      case_number,
      case_name,
      module,
      status,
      owner,
      organization,
      examiner,
      aircraft_type,
      location,
      summary,
      last_updated,
      occurrence_date,
      tags,
      analyses,
      timeline,
      attachments,
      investigator,
      aircraft
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14::jsonb, $15::jsonb, $16::jsonb,
      $17::jsonb, $18::jsonb
    )
    RETURNING *
  `;

  const values = [
    data.case_number,
    toNullIfEmpty(data.case_name),
    toNullIfEmpty(data.module),
    toNullIfEmpty(derivedStatus),
    toNullIfEmpty(data.owner),
    toNullIfEmpty(data.organization),
    toNullIfEmpty(data.examiner),
    toNullIfEmpty(data.aircraft_type),
    toNullIfEmpty(data.location),
    toNullIfEmpty(data.summary),
    data.last_updated,
    data.occurrence_date,
    data.tags,
    toJsonbParameter(data.analyses, {}),
    toJsonbParameter(data.timeline, []),
    toJsonbParameter(data.attachments, []),
    toJsonbParameter(data.investigator, {}),
    toJsonbParameter(data.aircraft, {}),
  ];

  const { rows } = await pool.query(query, values);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return hydrateCaseRow(rows[0]);
};

const updateCase = async (caseNumber, payload) => {
  const data = mapToDbCase(payload);
  const derivedStatus = deriveCaseStatus(data);

  const query = `
    UPDATE cases
    SET
      case_name = $1,
      module = $2,
      status = $3,
      owner = $4,
      organization = $5,
      examiner = $6,
      aircraft_type = $7,
      location = $8,
      summary = $9,
      last_updated = $10,
      occurrence_date = $11,
      tags = $12,
      analyses = $13::jsonb,
      timeline = $14::jsonb,
      attachments = $15::jsonb,
      investigator = $16::jsonb,
      aircraft = $17::jsonb
    WHERE case_number = $18
    RETURNING *
  `;

  const values = [
    toNullIfEmpty(data.case_name),
    toNullIfEmpty(data.module),
    toNullIfEmpty(derivedStatus),
    toNullIfEmpty(data.owner),
    toNullIfEmpty(data.organization),
    toNullIfEmpty(data.examiner),
    toNullIfEmpty(data.aircraft_type),
    toNullIfEmpty(data.location),
    toNullIfEmpty(data.summary),
    data.last_updated,
    data.occurrence_date,
    data.tags,
    toJsonbParameter(data.analyses, {}),
    toJsonbParameter(data.timeline, []),
    toJsonbParameter(data.attachments, []),
    toJsonbParameter(data.investigator, {}),
    toJsonbParameter(data.aircraft, {}),
    caseNumber,
  ];

  const result = await pool.query(query, values);
  const rows = extractRows(result);
  if (!Array.isArray(rows) || rows.length === 0){
    return null;
  }

  return hydrateCaseRow(rows[0]);
};

const deleteCase = async (caseNumber) => {
  const { rowCount } = await pool.query('DELETE FROM cases WHERE case_number = $1', [caseNumber]);
  return rowCount > 0;
};

module.exports = {
  listCases,
  findCaseByNumber,
  createCase,
  updateCase,
  deleteCase,
};