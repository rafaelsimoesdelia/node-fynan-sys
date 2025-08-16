const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Cheque = require('../models/Cheque');
const Ordem = require('../models/Ordem');
const Cliente = require('../models/Cliente');

// Middleware para validar erros
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/cheques - Listar todos os cheques
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, ordem, cliente } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (ordem) query.ordem = ordem;
    if (cliente) query.cliente = cliente;
    
    const cheques = await Cheque.find(query)
      .populate('ordem', 'numero cliente')
      .populate('cliente', 'codigo nome')
      .sort({ dataCriacao: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Cheque.countDocuments(query);
    
    res.json({
      success: true,
      data: cheques,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar cheques:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/cheques/:id - Buscar cheque por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const cheque = await Cheque.findById(id)
      .populate('ordem')
      .populate('cliente');
    
    if (!cheque) {
      return res.status(404).json({
        success: false,
        message: 'Cheque não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: cheque
    });
  } catch (error) {
    console.error('Erro ao buscar cheque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/cheques - Criar novo cheque
router.post('/', [
  body('numero').notEmpty().withMessage('Número do cheque é obrigatório'),
  body('banco.codigo').notEmpty().withMessage('Código do banco é obrigatório'),
  body('banco.nome').notEmpty().withMessage('Nome do banco é obrigatório'),
  body('valor').isFloat({ min: 0 }).withMessage('Valor deve ser positivo'),
  body('ordem').isMongoId().withMessage('ID da ordem é obrigatório'),
  body('cliente').isMongoId().withMessage('ID do cliente é obrigatório'),
  body('librador.nome').notEmpty().withMessage('Nome do librador é obrigatório'),
  body('librador.cpfCnpj').notEmpty().withMessage('CPF/CNPJ do librador é obrigatório'),
  body('librador.tipoPessoa').isIn(['FISICA', 'JURIDICA']).withMessage('Tipo de pessoa deve ser FISICA ou JURIDICA')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      numero,
      banco,
      agencia,
      conta,
      valor,
      dataEmissao,
      dataVencimento,
      librador,
      endosante,
      ordem,
      cliente
    } = req.body;
    
    // Verificar se a ordem existe
    const ordemExistente = await Ordem.findById(ordem);
    if (!ordemExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ordem não encontrada'
      });
    }
    
    // Verificar se o cliente existe
    const clienteExistente = await Cliente.findById(cliente);
    if (!clienteExistente) {
      return res.status(400).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }
    
    // Verificar se o cheque já existe
    const chequeExistente = await Cheque.findOne({ numero, banco: banco.codigo });
    if (chequeExistente) {
      return res.status(400).json({
        success: false,
        message: 'Cheque já existe'
      });
    }
    
    // Criar novo cheque
    const novoCheque = new Cheque({
      numero,
      banco,
      agencia,
      conta,
      valor,
      dataEmissao: dataEmissao ? new Date(dataEmissao) : undefined,
      dataVencimento: dataVencimento ? new Date(dataVencimento) : undefined,
      librador,
      endosante,
      ordem,
      cliente,
      usuario: req.user?.id || 'SISTEMA'
    });
    
    await novoCheque.save();
    
    // Atualizar ordem com o cheque
    ordemExistente.cheques = ordemExistente.cheques || [];
    ordemExistente.cheques.push(novoCheque._id);
    await ordemExistente.save();
    
    res.status(201).json({
      success: true,
      message: 'Cheque criado com sucesso',
      data: novoCheque
    });
  } catch (error) {
    console.error('Erro ao criar cheque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/cheques/:id - Atualizar cheque
router.put('/:id', [
  body('valor').optional().isFloat({ min: 0 }).withMessage('Valor deve ser positivo'),
  body('librador.nome').optional().notEmpty().withMessage('Nome do librador não pode ser vazio'),
  body('librador.cpfCnpj').optional().notEmpty().withMessage('CPF/CNPJ do librador não pode ser vazio')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const atualizacoes = req.body;
    
    const cheque = await Cheque.findById(id);
    if (!cheque) {
      return res.status(404).json({
        success: false,
        message: 'Cheque não encontrado'
      });
    }
    
    // Verificar se o cheque pode ser editado
    if (cheque.status === 'INTEGRADO') {
      return res.status(400).json({
        success: false,
        message: 'Cheque integrado não pode ser editado'
      });
    }
    
    // Atualizar cheque
    Object.assign(cheque, atualizacoes);
    await cheque.save();
    
    res.json({
      success: true,
      message: 'Cheque atualizado com sucesso',
      data: cheque
    });
  } catch (error) {
    console.error('Erro ao atualizar cheque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/cheques/:id/validar - Validar cheque
router.post('/:id/validar', async (req, res) => {
  try {
    const { id } = req.params;
    
    const cheque = await Cheque.findById(id);
    if (!cheque) {
      return res.status(404).json({
        success: false,
        message: 'Cheque não encontrado'
      });
    }
    
    // Executar validações
    const validacoes = {
      documentoValido: cheque.validacoes.documentoValido,
      dataVencimentoValida: true,
      valorPermitido: true,
      libradorValido: true,
      endosanteValido: true,
      erros: []
    };
    
    // Validar data de vencimento
    if (cheque.dataVencimento) {
      const hoje = new Date();
      if (cheque.dataVencimento < hoje) {
        validacoes.dataVencimentoValida = false;
        validacoes.erros.push('Data de vencimento expirada');
      }
    }
    
    // Validar valor
    if (cheque.valor <= 0) {
      validacoes.valorPermitido = false;
      validacoes.erros.push('Valor deve ser maior que zero');
    }
    
    // Validar librador
    if (!cheque.librador.nome || !cheque.librador.cpfCnpj) {
      validacoes.libradorValido = false;
      validacoes.erros.push('Dados do librador incompletos');
    }
    
    // Validar endosante se existir
    if (cheque.endosante && (!cheque.endosante.nome || !cheque.endosante.cpfCnpj)) {
      validacoes.endosanteValido = false;
      validacoes.erros.push('Dados do endosante incompletos');
    }
    
    // Atualizar validações no cheque
    cheque.validacoes = validacoes;
    await cheque.save();
    
    res.json({
      success: true,
      data: {
        cheque,
        validacoes
      }
    });
  } catch (error) {
    console.error('Erro ao validar cheque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/cheques/:id/aprovar - Aprovar cheque
router.post('/:id/aprovar', async (req, res) => {
  try {
    const { id } = req.params;
    
    const cheque = await Cheque.findById(id);
    if (!cheque) {
      return res.status(404).json({
        success: false,
        message: 'Cheque não encontrado'
      });
    }
    
    if (cheque.status !== 'PENDENTE') {
      return res.status(400).json({
        success: false,
        message: 'Cheque não está pendente para aprovação'
      });
    }
    
    // Verificar se todas as validações passaram
    if (!cheque.validacoes.documentoValido || 
        !cheque.validacoes.dataVencimentoValida || 
        !cheque.validacoes.valorPermitido) {
      return res.status(400).json({
        success: false,
        message: 'Cheque não pode ser aprovado - validações falharam',
        validacoes: cheque.validacoes
      });
    }
    
    cheque.status = 'APROVADO';
    cheque.dataProcessamento = new Date();
    await cheque.save();
    
    res.json({
      success: true,
      message: 'Cheque aprovado com sucesso',
      data: cheque
    });
  } catch (error) {
    console.error('Erro ao aprovar cheque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/cheques/:id/rejeitar - Rejeitar cheque
router.post('/:id/rejeitar', [
  body('motivo').notEmpty().withMessage('Motivo da rejeição é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    const cheque = await Cheque.findById(id);
    if (!cheque) {
      return res.status(404).json({
        success: false,
        message: 'Cheque não encontrado'
      });
    }
    
    if (cheque.status === 'INTEGRADO') {
      return res.status(400).json({
        success: false,
        message: 'Cheque integrado não pode ser rejeitado'
      });
    }
    
    cheque.status = 'REJEITADO';
    cheque.mensagens.push(`Rejeitado: ${motivo}`);
    cheque.dataProcessamento = new Date();
    await cheque.save();
    
    res.json({
      success: true,
      message: 'Cheque rejeitado com sucesso',
      data: cheque
    });
  } catch (error) {
    console.error('Erro ao rejeitar cheque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/cheques/:id - Cancelar cheque
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const cheque = await Cheque.findById(id);
    if (!cheque) {
      return res.status(404).json({
        success: false,
        message: 'Cheque não encontrado'
      });
    }
    
    if (cheque.status === 'INTEGRADO') {
      return res.status(400).json({
        success: false,
        message: 'Cheque integrado não pode ser cancelado'
      });
    }
    
    cheque.status = 'CANCELADO';
    await cheque.save();
    
    res.json({
      success: true,
      message: 'Cheque cancelado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar cheque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/cheques/ordem/:ordemId - Buscar cheques por ordem
router.get('/ordem/:ordemId', async (req, res) => {
  try {
    const { ordemId } = req.params;
    
    const cheques = await Cheque.find({ ordem: ordemId })
      .populate('cliente', 'codigo nome')
      .sort({ dataCriacao: 1 });
    
    res.json({
      success: true,
      data: cheques
    });
  } catch (error) {
    console.error('Erro ao buscar cheques da ordem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
