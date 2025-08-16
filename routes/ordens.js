const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Ordem = require('../models/Ordem');
const Cliente = require('../models/Cliente');
const Cheque = require('../models/Cheque');
const Operacao = require('../models/Operacao');

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

// GET /api/ordens - Listar todas as ordens
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, cliente, origem } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (cliente) query['cliente.codigo'] = parseInt(cliente);
    if (origem) query.origem = origem;
    
    // Buscar ordens sem populate para evitar erros
    const ordens = await Ordem.find(query)
      .sort({ dataCriacao: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean() // Usar lean() para melhor performance
      .exec();
    
    const total = await Ordem.countDocuments(query);
    
    res.json({
      success: true,
      data: ordens,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar ordens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/ordens/:numero - Buscar ordem por número
router.get('/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    
    const ordem = await Ordem.findOne({ numero: parseInt(numero) })
      .lean() // Usar lean() para melhor performance
      .exec();
    
    if (!ordem) {
      return res.status(404).json({
        success: false,
        message: 'Ordem não encontrada'
      });
    }
    
    res.json({
      success: true,
      data: ordem
    });
  } catch (error) {
    console.error('Erro ao buscar ordem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/ordens - Criar nova ordem
router.post('/', [
  body('numero').isInt().withMessage('Número da ordem deve ser um inteiro'),
  body('cliente.codigo').isInt().withMessage('Código do cliente deve ser um inteiro'),
  body('taxa').isFloat({ min: 0, max: 100 }).withMessage('Taxa deve estar entre 0 e 100'),
  body('gastos.total').isFloat({ min: 0 }).withMessage('Total de gastos deve ser positivo'),
  body('sector').isIn(['PERSONAL', 'COMERCIAL']).withMessage('Setor deve ser PERSONAL ou COMERCIAL'),
  body('linhaAfectada').isIn(['LIBRADOR', 'ENDOSANTE']).withMessage('Linha afetada deve ser LIBRADOR ou ENDOSANTE')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      numero,
      cliente,
      sucursal,
      aplicacao,
      taxa,
      sector,
      atividade,
      gastos,
      seguro,
      linhaAfectada,
      creditoConta,
      origem
    } = req.body;
    
    // Verificar se a ordem já existe
    const ordemExistente = await Ordem.findOne({ numero });
    if (ordemExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ordem já existe'
      });
    }
    
    // Verificar se o cliente existe
    const clienteExistente = await Cliente.findOne({ codigo: cliente.codigo });
    if (!clienteExistente) {
      return res.status(400).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }
    
    // Criar nova ordem
    const novaOrdem = new Ordem({
      numero,
      cliente: {
        codigo: cliente.codigo,
        nome: cliente.nome || clienteExistente.nome
      },
      sucursal,
      aplicacao,
      taxa,
      sector,
      atividade,
      gastos,
      seguro,
      linhaAfectada,
      creditoConta,
      origem: origem || 'FORMULARIO',
      usuario: req.user?.id || 'SISTEMA'
    });
    
    await novaOrdem.save();
    
    res.status(201).json({
      success: true,
      message: 'Ordem criada com sucesso',
      data: novaOrdem
    });
  } catch (error) {
    console.error('Erro ao criar ordem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/ordens/:numero - Atualizar ordem
router.put('/:numero', [
  body('taxa').optional().isFloat({ min: 0, max: 100 }).withMessage('Taxa deve estar entre 0 e 100'),
  body('gastos.total').optional().isFloat({ min: 0 }).withMessage('Total de gastos deve ser positivo')
], handleValidationErrors, async (req, res) => {
  try {
    const { numero } = req.params;
    const atualizacoes = req.body;
    
    const ordem = await Ordem.findOne({ numero: parseInt(numero) });
    if (!ordem) {
      return res.status(404).json({
        success: false,
        message: 'Ordem não encontrada'
      });
    }
    
    // Verificar se a ordem pode ser editada
    if (ordem.status === 'INTEGRADA') {
      return res.status(400).json({
        success: false,
        message: 'Ordem já integrada não pode ser editada'
      });
    }
    
    // Atualizar ordem
    Object.assign(ordem, atualizacoes);
    ordem.dataAtualizacao = new Date();
    
    await ordem.save();
    
    res.json({
      success: true,
      message: 'Ordem atualizada com sucesso',
      data: ordem
    });
  } catch (error) {
    console.error('Erro ao atualizar ordem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/ordens/:numero/integrar - Integrar ordem
router.post('/:numero/integrar', async (req, res) => {
  try {
    const { numero } = req.params;
    
    const ordem = await Ordem.findOne({ numero: parseInt(numero) })
      .populate('cliente')
      .populate('cheques');
    
    if (!ordem) {
      return res.status(404).json({
        success: false,
        message: 'Ordem não encontrada'
      });
    }
    
    if (ordem.status === 'INTEGRADA') {
      return res.status(400).json({
        success: false,
        message: 'Ordem já integrada'
      });
    }
    
    // Validar ordem antes da integração
    const validacoes = await validarOrdemIntegracao(ordem);
    
    if (!validacoes.valida) {
      return res.status(400).json({
        success: false,
        message: 'Ordem não pode ser integrada',
        validacoes: validacoes
      });
    }
    
    // Processar integração
    ordem.status = 'EM_PROCESSAMENTO';
    await ordem.save();
    
    // Simular processo de integração
    setTimeout(async () => {
      try {
        ordem.status = 'INTEGRADA';
        ordem.dataIntegracao = new Date();
        ordem.operacao = {
          numero: `OP${Date.now()}`,
          dataIntegracao: new Date()
        };
        await ordem.save();
        
        console.log(`Ordem ${numero} integrada com sucesso`);
      } catch (error) {
        console.error(`Erro ao integrar ordem ${numero}:`, error);
        ordem.status = 'ERRO';
        ordem.mensagens.push('Erro na integração');
        await ordem.save();
      }
    }, 2000);
    
    res.json({
      success: true,
      message: 'Integração iniciada',
      data: {
        numero: ordem.numero,
        status: ordem.status,
        validacoes: validacoes
      }
    });
  } catch (error) {
    console.error('Erro ao integrar ordem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Função para validar ordem antes da integração
async function validarOrdemIntegracao(ordem) {
  const validacoes = {
    valida: true,
    erros: []
  };
  
  // Validar cliente
  if (!ordem.cliente) {
    validacoes.valida = false;
    validacoes.erros.push('Cliente não informado');
  }
  
  // Validar taxa
  if (ordem.taxa <= 0 || ordem.taxa > 100) {
    validacoes.valida = false;
    validacoes.erros.push('Taxa inválida');
  }
  
  // Validar gastos
  if (ordem.gastos.total <= 0) {
    validacoes.valida = false;
    validacoes.erros.push('Gastos devem ser maiores que zero');
  }
  
  // Validar cheques se existirem
  if (ordem.cheques && ordem.cheques.length > 0) {
    for (const cheque of ordem.cheques) {
      if (!cheque.validacoes.documentoValido) {
        validacoes.valida = false;
        validacoes.erros.push(`Cheque ${cheque.numero} com documento inválido`);
      }
    }
  }
  
  return validacoes;
}

// DELETE /api/ordens/:numero - Cancelar ordem
router.delete('/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    
    const ordem = await Ordem.findOne({ numero: parseInt(numero) });
    if (!ordem) {
      return res.status(404).json({
        success: false,
        message: 'Ordem não encontrada'
      });
    }
    
    if (ordem.status === 'INTEGRADA') {
      return res.status(400).json({
        success: false,
        message: 'Ordem integrada não pode ser cancelada'
      });
    }
    
    ordem.status = 'CANCELADA';
    await ordem.save();
    
    res.json({
      success: true,
      message: 'Ordem cancelada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar ordem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
