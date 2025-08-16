const mongoose = require('mongoose');

const chequeSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true
  },
  banco: {
    codigo: String,
    nome: String
  },
  agencia: String,
  conta: String,
  valor: {
    type: Number,
    required: true,
    min: 0
  },
  dataEmissao: Date,
  dataVencimento: Date,
  librador: {
    nome: String,
    cpfCnpj: String,
    tipoPessoa: {
      type: String,
      enum: ['FISICA', 'JURIDICA']
    }
  },
  endosante: {
    nome: String,
    cpfCnpj: String,
    tipoPessoa: {
      type: String,
      enum: ['FISICA', 'JURIDICA']
    }
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
  status: {
    type: String,
    enum: ['PENDENTE', 'APROVADO', 'REJEITADO', 'INTEGRADO', 'CANCELADO'],
    default: 'PENDENTE'
  },
  validacoes: {
    documentoValido: Boolean,
    dataVencimentoValida: Boolean,
    valorPermitido: Boolean,
    libradorValido: Boolean,
    endosanteValido: Boolean
  },
  mensagens: [String],
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  dataProcessamento: Date,
  usuario: String
}, {
  timestamps: true
});

// Índices para otimização
chequeSchema.index({ numero: 1 });
chequeSchema.index({ ordem: 1 });
chequeSchema.index({ cliente: 1 });
chequeSchema.index({ status: 1 });
chequeSchema.index({ 'librador.cpfCnpj': 1 });
chequeSchema.index({ 'endosante.cpfCnpj': 1 });

// Middleware para validar documento
chequeSchema.pre('save', function(next) {
  // Validar se o documento é válido baseado no tipo de pessoa
  if (this.librador.tipoPessoa === 'FISICA') {
    this.validacoes.documentoValido = this.validarCPF(this.librador.cpfCnpj);
  } else {
    this.validacoes.documentoValido = this.validarCNPJ(this.librador.cpfCnpj);
  }
  next();
});

// Método para validar CPF
chequeSchema.methods.validarCPF = function(cpf) {
  if (!cpf) return false;
  
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let dv1 = resto < 2 ? 0 : resto;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let dv2 = resto < 2 ? 0 : resto;
  
  return cpf.charAt(9) == dv1 && cpf.charAt(10) == dv2;
};

// Método para validar CNPJ
chequeSchema.methods.validarCNPJ = function(cnpj) {
  if (!cnpj) return false;
  
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cnpj.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  let peso = 2;
  for (let i = 11; i >= 0; i--) {
    soma += parseInt(cnpj.charAt(i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  let resto = soma % 11;
  let dv1 = resto < 2 ? 0 : 11 - resto;
  
  // Validação do segundo dígito verificador
  soma = 0;
  peso = 2;
  for (let i = 12; i >= 0; i--) {
    soma += parseInt(cnpj.charAt(i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  resto = soma % 11;
  let dv2 = resto < 2 ? 0 : 11 - resto;
  
  return cnpj.charAt(12) == dv1 && cnpj.charAt(13) == dv2;
};

module.exports = mongoose.model('Cheque', chequeSchema);
