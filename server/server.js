const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gift-database');

app.get('/api', (req, res) => {
  res.json({ message: 'Gift API is running!' });
});

app.listen(PORT, () => {
  console.log(`Gift server running on port ${PORT}`);
});
