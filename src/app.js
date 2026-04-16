const express = require('express');
const cors = require('cors');

const materiaPrimaRoutes = require('./routes/materiaPrima');
const stocksRoutes = require('./routes/stocks');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors({
  origin: [
    'https://kaizenappfrontend-production-d464.up.railway.app',
    'http://localhost:5173',
  ],
  credentials: true,
}));
app.use(express.json());

app.use('/api/materia-prima', materiaPrimaRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
