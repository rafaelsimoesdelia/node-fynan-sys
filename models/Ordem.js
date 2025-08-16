const mongoose = require('mongoose');

const ordemSchema = new mongoose.Schema({
  numero: {
    type: Number,
    required: true,
    unique: true
  },
  cliente: {
    codigo: {
      type: Number,
      required: true,
      ref: 'Cliente'
    },
    nome: String
  },
  sucursal: {
    codigo: String,
    nome: String
  },
  aplicacao: {
    codigo: String,
    descricao: String
  },
  taxa: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  sector: {
    type: String,
    enum: ['PERSONAL', 'COMERCIAL'],
    default: 'PERSONAL'
  },
  atividade: {
    codigo: Number,
    descricao: String
  },
  gastos: {
    total: {
      type: Number,
      required: true,
      min: 0
    },
    operacao1: {
      type: Number,
      default: 0
    },
    operacao2: {
      type: Number,
      default: 0
    }
  },
  seguro: {
    cobrar: {
      type: Boolean,
      default: false
    },
    seguradora: String
  },
  linhaAfectada: {
    type: String,
    enum: ['LIBRADOR', 'ENDOSANTE'],
    default: 'ENDOSANTE'
  },
  creditoConta: {
    numero: String,
    descricao: String
  },
  status: {
    type: String,
    enum: ['PENDENTE', 'EM_PROCESSAMENTO', 'INTEGRADA', 'ERRO', 'CANCELADA'],
    default: 'PENDENTE'
  },
  origem: {
    type: String,
    enum: ['FORMULARIO', 'DISKETTE', 'WEB', 'EXCEL'],
    default: 'FORMULARIO'
  },
  operacao: {
    numero: String,
    dataIntegracao: Date
  },
  validacoes: {
    taxaEfetiva: Number,
    limiteExcedido: Boolean,
    clienteValido: Boolean,
    atividadePermitida: Boolean,
    linhaCreditoSuficiente: Boolean
  },
  mensagens: [String],
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  dataIntegracao: Date,
  usuario: String
}, {
  timestamps: true
});

// Índices para otimização
ordemSchema.index({ numero: 1 });
ordemSchema.index({ 'cliente.codigo': 1 });
ordemSchema.index({ status: 1 });
ordemSchema.index({ origem: 1 });
ordemSchema.index({ dataCriacao: -1 });

// Referência virtual para cheques
ordemSchema.virtual('cheques', {
  ref: 'Cheque',
  localField: '_id',
  foreignField: 'ordem'
});

// Configurar para incluir campos virtuais no JSON
ordemSchema.set('toJSON', { virtuals: true });
ordemSchema.set('toObject', { virtuals: true });

// Middleware para calcular gastos totais
ordemSchema.pre('save', function(next) {
  if (this.gastos.operacao1 || this.gastos.operacao2) {
    this.gastos.total = (this.gastos.operacao1 || 0) + (this.gastos.operacao2 || 0);
  }
  next();
});

// Método para validar taxa
ordemSchema.methods.validarTaxa = function(taxaMaxima) {
  return this.taxa <= taxaMaxima;
};

// Método para calcular taxa efetiva
ordemSchema.methods.calcularTaxaEfetiva = function(dias, moeda) {
  // Implementar cálculo da taxa efetiva baseado nos parâmetros
  return this.taxa;
};

module.exports = mongoose.model('Ordem', ordemSchema);
