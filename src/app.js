const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const errorHandler = require('./middlewares/errorMiddleware');
const profileRoutes = require('./routes/profileRoutes');


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/profile', profileRoutes);

app.use(errorHandler);

module.exports = app;
