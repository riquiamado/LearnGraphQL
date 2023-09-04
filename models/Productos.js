const mongoose = require("mongoose");

const ProductoSchema = mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  existencia: {
    type: Number,
    required: true,
  },
  precio: {
    type: Number,
    required: true,
    trim: true,
  },
  imagen: {
    type: String,

    trim: true,
  },
 
  creado: {
    type: Date,
    default: Date.now(),
  },
});

ProductoSchema.index({ nombre: "text" });

module.exports = mongoose.model("Producto", ProductoSchema);
