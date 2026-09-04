const mongoose = require('mongoose');

const dummyPresetSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'default_erp_preset'
  },
  data: {
    type: Object,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('DummyPreset', dummyPresetSchema);
