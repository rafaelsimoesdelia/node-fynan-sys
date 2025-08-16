const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  codigo: {
    type: Number,
    required: true,
    unique: true
  },
  nome: {
    type: String,
    required: true,
    trim: true
  },
  tipoPessoa: {
    type: String,
    enum: ['FISICA', 'JURIDICA'],
    required: true
  },
  cpfCnpj: {
    type: String,
    required: true,
    unique: true
  },
  atividade: {
    codigo: Number,
    descricao: String
  },
  sucursal: {
    codigo: {
      type: String,
      required: true
    },
    nome: {
      type: String,
      required: true
    }
  },
  aplicacao: {
    codigo: String,
    descricao: String
  },
  linhaCredito: {
    librador: {
      valor: Number,
      utilizada: Number
    },
    endosante: {
      valor: Number,
      utilizada: Number
    }
  },
  contaBancaria: {
    numero: String,
    banco: String,
    agencia: String
  },
  seguro: {
    habilitado: {
      type: Boolean,
      default: false
    },
    seguradora: String
  },
  status: {
    type: String,
    enum: ['ATIVO', 'BLOQUEADO', 'INATIVO'],
    default: 'ATIVO'
  },
  restricoes: [String],
  dataCadastro: {
    type: Date,
    default: Date.now
  },
  dataAtualizacao: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para otimização de consultas
clienteSchema.index({ codigo: 1 });
clienteSchema.index({ cpfCnpj: 1 });
clienteSchema.index({ 'sucursal.codigo': 1 });
clienteSchema.index({ status: 1 });

// Middleware para atualizar dataAtualizacao
clienteSchema.pre('save', function(next) {
  this.dataAtualizacao = new Date();
  next();
});

module.exports = mongoose.model('Cliente', clienteSchema);
