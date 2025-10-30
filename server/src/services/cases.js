const pool = require('../db/pool');
const { mapToDbCase, mapFromDbCase } = require('../utils/case-mapper');

const listCases = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM cases ORDER BY last_updated DESC NULLS LAST, created_at DESC`,
  );
  return rows.map(mapFromDbCase);
};

const findCaseByNumber = async (caseNumber) => {
  const { rows } = await pool.query('SELECT * FROM cases WHERE case_number = $1', [caseNumber]);
  if (rows.length === 0) {
    return null;
  }

  return mapFromDbCase(rows[0]);
};

const createCase = async (payload) => {
  const data = mapToDbCase(payload);

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
      attachments
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16
    )
    RETURNING *
  `;

  const values = [
    data.case_number,
    data.case_name,
    data.module,
    data.status,
    data.owner,
    data.organization,
    data.examiner,
    data.aircraft_type,
    data.location,
    data.summary,
    data.last_updated,
    data.occurrence_date,
    data.tags,
    data.analyses,
    data.timeline,
    data.attachments,
  ];

  const { rows } = await pool.query(query, values);
  return mapFromDbCase(rows[0]);
};

const updateCase = async (caseNumber, payload) => {
  const data = mapToDbCase(payload);

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
      analyses = $13,
      timeline = $14,
      attachments = $15
    WHERE case_number = $16
    RETURNING *
  `;

  const values = [
    data.case_name,
    data.module,
    data.status,
    data.owner,
    data.organization,
    data.examiner,
    data.aircraft_type,
    data.location,
    data.summary,
    data.last_updated,
    data.occurrence_date,
    data.tags,
    data.analyses,
    data.timeline,
    data.attachments,
    caseNumber,
  ];

  const { rows } = await pool.query(query, values);
  if (rows.length === 0) {
    return null;
  }

  return mapFromDbCase(rows[0]);
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
