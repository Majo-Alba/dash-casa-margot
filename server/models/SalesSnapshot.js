const mongoose = require('mongoose');

const SalesSnapshotSchema = new mongoose.Schema({
  source: { type: String, default: 'google_sheet' },
  payload: Object,
}, { timestamps: true });

module.exports = mongoose.model('SalesSnapshot', SalesSnapshotSchema);
