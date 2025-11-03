const express = require('express');
const cors = require('cors');
const casesRouter = require('./routes/cases');
const authRouter = require('./routes/auth');
const accountRouter = require('./routes/account');
const errorHandler = require('./middleware/error-handler');
const notFound = require('./middleware/not-found');
const requireAuth = require('./middleware/require-auth');
const initializeDatabase = require('./db/init');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/account', requireAuth, accountRouter);
app.use('/api/cases', requireAuth, casesRouter);
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await initializeDatabase();

    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`API server listening on port ${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize database', error);
    process.exit(1);
  }
};

startServer();
