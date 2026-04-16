const express = require('express');
const cors = require('cors');

const materiaPrimaRoutes = require('./routes/materiaPrima');
const stocksRoutes = require('./routes/stocks');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/materia-prima', materiaPrimaRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
