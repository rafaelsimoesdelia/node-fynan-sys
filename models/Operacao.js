const mongoose = require('mongoose');

const operacaoSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    unique: true
  },
  ordem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ordem',
    required: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  tipo: {
    type: String,
    enum: ['DESCONTO_CHEQUE', 'CREDITO_CONTA', 'OUTROS'],
    default: 'DESCONTO_CHEQUE'
  },
  capital: {
    principal: {
      type: Number,
      required: true,
      min: 0
    },
    gastos: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  taxa: {
    nominal: {
      type: Number,
      required: true
    },
    efetiva: Number
  },
  prazo: {
    dias: Number,
    dataInicio: Date,
    dataVencimento: Date
  },
  juros: {
    valor: Number,
    calculado: Boolean
  },
  seguro: {
    cobrar: Boolean,
    seguradora: String,
    valor: Number
  },
  linhaAfectada: {
    type: String,
    enum: ['LIBRADOR', 'ENDOSANTE'],
    default: 'ENDOSANTE'
  },
  contaCredito: {
    numero: String,
    banco: String,
    agencia: String
  },
  cheques: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cheque'
  }],
  status: {
    type: String,
    enum: ['PENDENTE', 'APROVADA', 'REJEITADA', 'INTEGRADA', 'CANCELADA'],
    default: 'PENDENTE'
  },
  validacoes: {
    taxaEfetiva: Boolean,
    limiteExcedido: Boolean,
    linhaCreditoSuficiente: Boolean,
    clienteValido: Boolean,
    documentosValidos: Boolean
  },
  mensagens: [String],
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  dataIntegracao: Date,
  usuario: String,
  logOperacoes: [{
    acao: String,
    data: {
      type: Date,
      default: Date.now
    },
    usuario: String,
    detalhes: String
  }]
}, {
  timestamps: true
});

// Índices para otimização
operacaoSchema.index({ numero: 1 });
operacaoSchema.index({ ordem: 1 });
operacaoSchema.index({ cliente: 1 });
operacaoSchema.index({ status: 1 });
operacaoSchema.index({ tipo: 1 });
operacaoSchema.index({ dataCriacao: -1 });

// Middleware para calcular valores
operacaoSchema.pre('save', function(next) {
  // Calcular capital total
  this.capital.total = this.capital.principal + this.capital.gastos;
  
  // Calcular juros se necessário
  if (this.prazo.dias && this.capital.principal && this.taxa.nominal) {
    this.juros.valor = (this.capital.principal * this.taxa.nominal * this.prazo.dias) / (100 * 365);
    this.juros.calculado = true;
  }
  
  next();
});

// Método para calcular taxa efetiva
operacaoSchema.methods.calcularTaxaEfetiva = function() {
  if (!this.prazo.dias || !this.capital.principal) return 0;
  
  const taxaNominal = this.taxa.nominal / 100;
  const prazoAno = this.prazo.dias / 365;
  
  // Fórmula para taxa efetiva anual
  const taxaEfetiva = Math.pow(1 + taxaNominal * prazoAno, 1 / prazoAno) - 1;
  
  return taxaEfetiva * 100;
};

// Método para validar limites
operacaoSchema.methods.validarLimites = function(limiteMaximo) {
  if (this.capital.total > limiteMaximo) {
    this.validacoes.limiteExcedido = true;
    this.mensagens.push(`Limite máximo excedido: ${limiteMaximo}`);
    return false;
  }
  
  this.validacoes.limiteExcedido = false;
  return true;
};

// Método para adicionar log
operacaoSchema.methods.adicionarLog = function(acao, usuario, detalhes) {
  this.logOperacoes.push({
    acao,
    usuario,
    detalhes
  });
};

module.exports = mongoose.model('Operacao', operacaoSchema);
