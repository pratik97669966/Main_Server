// models/Sequence.js
const mongoose = require('mongoose');

const sequenceSchema = new mongoose.Schema({
  prefix: {
    type: String,
    required: true
  },
  sequence: {
    type: Number,
    required: true
  }
});

const Sequence = mongoose.model('Sequence', sequenceSchema);

module.exports = Sequence;