const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Operacao = require('../models/Operacao');
const Ordem = require('../models/Ordem');
const Cliente = require('../models/Cliente');
const Cheque = require('../models/Cheque');

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

// GET /api/operacoes - Listar todas as operações
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, tipo, cliente } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (tipo) query.tipo = tipo;
    if (cliente) query.cliente = cliente;
    
    const operacoes = await Operacao.find(query)
      .populate('ordem', 'numero cliente')
      .populate('cliente', 'codigo nome')
      .populate('cheques')
      .sort({ dataCriacao: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Operacao.countDocuments(query);
    
    res.json({
      success: true,
      data: operacoes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar operações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/operacoes/:id - Buscar operação por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const operacao = await Operacao.findById(id)
      .populate('ordem')
      .populate('cliente')
      .populate('cheques');
    
    if (!operacao) {
      return res.status(404).json({
        success: false,
        message: 'Operação não encontrada'
      });
    }
    
    res.json({
      success: true,
      data: operacao
    });
  } catch (error) {
    console.error('Erro ao buscar operação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/operacoes - Criar nova operação
router.post('/', [
  body('ordem').isMongoId().withMessage('ID da ordem é obrigatório'),
  body('cliente').isMongoId().withMessage('ID do cliente é obrigatório'),
  body('capital.principal').isFloat({ min: 0 }).withMessage('Capital principal deve ser positivo'),
  body('taxa.nominal').isFloat({ min: 0, max: 100 }).withMessage('Taxa nominal deve estar entre 0 e 100'),
  body('tipo').isIn(['DESCONTO_CHEQUE', 'CREDITO_CONTA', 'OUTROS']).withMessage('Tipo de operação inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      ordem,
      cliente,
      tipo,
      capital,
      taxa,
      prazo,
      seguro,
      linhaAfectada,
      contaCredito,
      cheques
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
    
    // Gerar número único da operação
    const numero = `OP${Date.now()}`;
    
    // Criar nova operação
    const novaOperacao = new Operacao({
      numero,
      ordem,
      cliente,
      tipo,
      capital,
      taxa,
      prazo,
      seguro,
      linhaAfectada,
      contaCredito,
      cheques: cheques || [],
      usuario: req.user?.id || 'SISTEMA'
    });
    
    await novaOperacao.save();
    
    // Atualizar ordem com a operação
    ordemExistente.operacao = {
      numero: novaOperacao.numero,
      dataIntegracao: new Date()
    };
    await ordemExistente.save();
    
    res.status(201).json({
      success: true,
      message: 'Operação criada com sucesso',
      data: novaOperacao
    });
  } catch (error) {
    console.error('Erro ao criar operação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/operacoes/:id - Atualizar operação
router.put('/:id', [
  body('capital.principal').optional().isFloat({ min: 0 }).withMessage('Capital principal deve ser positivo'),
  body('taxa.nominal').optional().isFloat({ min: 0, max: 100 }).withMessage('Taxa nominal deve estar entre 0 e 100')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const atualizacoes = req.body;
    
    const operacao = await Operacao.findById(id);
    if (!operacao) {
      return res.status(404).json({
        success: false,
        message: 'Operação não encontrada'
      });
    }
    
    // Verificar se a operação pode ser editada
    if (operacao.status === 'INTEGRADA') {
      return res.status(400).json({
        success: false,
        message: 'Operação integrada não pode ser editada'
      });
    }
    
    // Atualizar operação
    Object.assign(operacao, atualizacoes);
    await operacao.save();
    
    res.json({
      success: true,
      message: 'Operação atualizada com sucesso',
      data: operacao
    });
  } catch (error) {
    console.error('Erro ao atualizar operação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/operacoes/:id/calcular-taxa-efetiva - Calcular taxa efetiva
router.post('/:id/calcular-taxa-efetiva', async (req, res) => {
  try {
    const { id } = req.params;
    
    const operacao = await Operacao.findById(id);
    if (!operacao) {
      return res.status(404).json({
        success: false,
        message: 'Operação não encontrada'
      });
    }
    
    // Calcular taxa efetiva
    const taxaEfetiva = operacao.calcularTaxaEfetiva();
    
    // Atualizar operação
    operacao.taxa.efetiva = taxaEfetiva;
    await operacao.save();
    
    res.json({
      success: true,
      data: {
        taxaNominal: operacao.taxa.nominal,
        taxaEfetiva: taxaEfetiva,
        diferenca: taxaEfetiva - operacao.taxa.nominal
      }
    });
  } catch (error) {
    console.error('Erro ao calcular taxa efetiva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/operacoes/:id/validar-limites - Validar limites da operação
router.post('/:id/validar-limites', [
  body('limiteMaximo').isFloat({ min: 0 }).withMessage('Limite máximo deve ser positivo')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { limiteMaximo } = req.body;
    
    const operacao = await Operacao.findById(id);
    if (!operacao) {
      return res.status(404).json({
        success: false,
        message: 'Operação não encontrada'
      });
    }
    
    // Validar limites
    const limiteValido = operacao.validarLimites(limiteMaximo);
    
    res.json({
      success: true,
      data: {
        limiteValido,
        capitalTotal: operacao.capital.total,
        limiteMaximo,
        excedido: operacao.capital.total > limiteMaximo
      }
    });
  } catch (error) {
    console.error('Erro ao validar limites:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/operacoes/:id/aprovar - Aprovar operação
router.post('/:id/aprovar', async (req, res) => {
  try {
    const { id } = req.params;
    
    const operacao = await Operacao.findById(id);
    if (!operacao) {
      return res.status(404).json({
        success: false,
        message: 'Operação não encontrada'
      });
    }
    
    if (operacao.status !== 'PENDENTE') {
      return res.status(400).json({
        success: false,
        message: 'Operação não está pendente para aprovação'
      });
    }
    
    // Verificar se todas as validações passaram
    if (operacao.validacoes.limiteExcedido) {
      return res.status(400).json({
        success: false,
        message: 'Operação não pode ser aprovada - limite excedido',
        validacoes: operacao.validacoes
      });
    }
    
    operacao.status = 'APROVADA';
    operacao.adicionarLog('APROVADA', req.user?.id || 'SISTEMA', 'Operação aprovada pelo usuário');
    await operacao.save();
    
    res.json({
      success: true,
      message: 'Operação aprovada com sucesso',
      data: operacao
    });
  } catch (error) {
    console.error('Erro ao aprovar operação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/operacoes/:id/rejeitar - Rejeitar operação
router.post('/:id/rejeitar', [
  body('motivo').notEmpty().withMessage('Motivo da rejeição é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    const operacao = await Operacao.findById(id);
    if (!operacao) {
      return res.status(404).json({
        success: false,
        message: 'Operação não encontrada'
      });
    }
    
    if (operacao.status === 'INTEGRADA') {
      return res.status(400).json({
        success: false,
        message: 'Operação integrada não pode ser rejeitada'
      });
    }
    
    operacao.status = 'REJEITADA';
    operacao.mensagens.push(`Rejeitada: ${motivo}`);
    operacao.adicionarLog('REJEITADA', req.user?.id || 'SISTEMA', `Rejeitada: ${motivo}`);
    await operacao.save();
    
    res.json({
      success: true,
      message: 'Operação rejeitada com sucesso',
      data: operacao
    });
  } catch (error) {
    console.error('Erro ao rejeitar operação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/operacoes/:id/integrar - Integrar operação
router.post('/:id/integrar', async (req, res) => {
  try {
    const { id } = req.params;
    
    const operacao = await Operacao.findById(id)
      .populate('ordem')
      .populate('cliente')
      .populate('cheques');
    
    if (!operacao) {
      return res.status(404).json({
        success: false,
        message: 'Operação não encontrada'
      });
    }
    
    if (operacao.status !== 'APROVADA') {
      return res.status(400).json({
        success: false,
        message: 'Operação deve estar aprovada para integração'
      });
    }
    
    // Simular processo de integração
    operacao.status = 'EM_PROCESSAMENTO';
    await operacao.save();
    
    // Processar integração em background
    setTimeout(async () => {
      try {
        operacao.status = 'INTEGRADA';
        operacao.dataIntegracao = new Date();
        operacao.adicionarLog('INTEGRADA', 'SISTEMA', 'Integração concluída com sucesso');
        await operacao.save();
        
        console.log(`Operação ${operacao.numero} integrada com sucesso`);
      } catch (error) {
        console.error(`Erro ao integrar operação ${operacao.numero}:`, error);
        operacao.status = 'ERRO';
        operacao.mensagens.push('Erro na integração');
        await operacao.save();
      }
    }, 3000);
    
    res.json({
      success: true,
      message: 'Integração iniciada',
      data: {
        numero: operacao.numero,
        status: operacao.status
      }
    });
  } catch (error) {
    console.error('Erro ao integrar operação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/operacoes/cliente/:clienteId - Buscar operações por cliente
router.get('/cliente/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { cliente: clienteId };
    if (status) query.status = status;
    
    const operacoes = await Operacao.find(query)
      .populate('ordem', 'numero')
      .populate('cheques')
      .sort({ dataCriacao: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Operacao.countDocuments(query);
    
    res.json({
      success: true,
      data: operacoes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar operações do cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/operacoes/ordem/:ordemId - Buscar operações por ordem
router.get('/ordem/:ordemId', async (req, res) => {
  try {
    const { ordemId } = req.params;
    
    const operacoes = await Operacao.find({ ordem: ordemId })
      .populate('cliente', 'codigo nome')
      .populate('cheques')
      .sort({ dataCriacao: 1 });
    
    res.json({
      success: true,
      data: operacoes
    });
  } catch (error) {
    console.error('Erro ao buscar operações da ordem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
