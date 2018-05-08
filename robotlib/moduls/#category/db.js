var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var attachment = new Schema({
  'name':String, 
  'type':String, 
  'id':String,
  'caption':String,
});

var categorySchema = new Schema({
  name:String,
  parent:String,
  description: String,
  order:Number,
  attachments :[ attachment ],
});

  module.exports.category = mongoose.model('categories', categorySchema);