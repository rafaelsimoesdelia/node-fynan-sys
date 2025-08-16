const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
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

// GET /api/clientes - Listar todos os clientes
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, tipoPessoa, sucursal } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (tipoPessoa) query.tipoPessoa = tipoPessoa;
    if (sucursal) query['sucursal.codigo'] = sucursal;
    
    const clientes = await Cliente.find(query)
      .select('-__v')
      .sort({ codigo: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Cliente.countDocuments(query);
    
    res.json({
      success: true,
      data: clientes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/clientes/:codigo - Buscar cliente por código
router.get('/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const cliente = await Cliente.findOne({ codigo: parseInt(codigo) });
    
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: cliente
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/clientes - Criar novo cliente
router.post('/', [
  body('codigo').isInt().withMessage('Código deve ser um inteiro'),
  body('nome').isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('tipoPessoa').isIn(['FISICA', 'JURIDICA']).withMessage('Tipo de pessoa deve ser FISICA ou JURIDICA'),
  body('cpfCnpj').isLength({ min: 11, max: 18 }).withMessage('CPF/CNPJ deve ter entre 11 e 18 caracteres'),
  body('sucursal.codigo').notEmpty().withMessage('Código da sucursal é obrigatório'),
  body('sucursal.nome').notEmpty().withMessage('Nome da sucursal é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      codigo,
      nome,
      tipoPessoa,
      cpfCnpj,
      atividade,
      sucursal,
      aplicacao,
      linhaCredito,
      contaBancaria,
      seguro
    } = req.body;
    
    // Verificar se o cliente já existe
    const clienteExistente = await Cliente.findOne({
      $or: [
        { codigo },
        { cpfCnpj }
      ]
    });
    
    if (clienteExistente) {
      return res.status(400).json({
        success: false,
        message: 'Cliente já existe com este código ou CPF/CNPJ'
      });
    }
    
    // Criar novo cliente
    const novoCliente = new Cliente({
      codigo,
      nome,
      tipoPessoa,
      cpfCnpj,
      atividade,
      sucursal,
      aplicacao,
      linhaCredito,
      contaBancaria,
      seguro
    });
    
    await novoCliente.save();
    
    res.status(201).json({
      success: true,
      message: 'Cliente criado com sucesso',
      data: novoCliente
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/clientes/:codigo - Atualizar cliente
router.put('/:codigo', [
  body('nome').optional().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('cpfCnpj').optional().isLength({ min: 11, max: 18 }).withMessage('CPF/CNPJ deve ter entre 11 e 18 caracteres')
], handleValidationErrors, async (req, res) => {
  try {
    const { codigo } = req.params;
    const atualizacoes = req.body;
    
    const cliente = await Cliente.findOne({ codigo: parseInt(codigo) });
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }
    
    // Verificar se CPF/CNPJ já existe em outro cliente
    if (atualizacoes.cpfCnpj && atualizacoes.cpfCnpj !== cliente.cpfCnpj) {
      const cpfCnpjExistente = await Cliente.findOne({ cpfCnpj: atualizacoes.cpfCnpj });
      if (cpfCnpjExistente) {
        return res.status(400).json({
          success: false,
          message: 'CPF/CNPJ já existe para outro cliente'
        });
      }
    }
    
    // Atualizar cliente
    Object.assign(cliente, atualizacoes);
    await cliente.save();
    
    res.json({
      success: true,
      message: 'Cliente atualizado com sucesso',
      data: cliente
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/clientes/:codigo - Desativar cliente
router.delete('/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const cliente = await Cliente.findOne({ codigo: parseInt(codigo) });
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }
    
    // Verificar se o cliente tem operações ativas
    // Aqui você pode adicionar lógica para verificar dependências
    
    cliente.status = 'INATIVO';
    await cliente.save();
    
    res.json({
      success: true,
      message: 'Cliente desativado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desativar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/clientes/:codigo/validar - Validar cliente
router.get('/:codigo/validar', async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const cliente = await Cliente.findOne({ codigo: parseInt(codigo) });
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }
    
    // Validar cliente
    const validacoes = {
      clienteValido: true,
      restricoes: [],
      linhaCredito: {
        librador: {
          disponivel: cliente.linhaCredito?.librador?.valor - (cliente.linhaCredito?.librador?.utilizada || 0),
          total: cliente.linhaCredito?.librador?.valor || 0
        },
        endosante: {
          disponivel: cliente.linhaCredito?.endosante?.valor - (cliente.linhaCredito?.endosante?.utilizada || 0),
          total: cliente.linhaCredito?.endosante?.valor || 0
        }
      },
      contaBancaria: !!cliente.contaBancaria?.numero,
      seguro: cliente.seguro?.habilitado || false
    };
    
    // Verificar restrições
    if (cliente.restricoes && cliente.restricoes.length > 0) {
      validacoes.clienteValido = false;
      validacoes.restricoes = cliente.restricoes;
    }
    
    // Verificar status
    if (cliente.status !== 'ATIVO') {
      validacoes.clienteValido = false;
      validacoes.restricoes.push(`Cliente com status: ${cliente.status}`);
    }
    
    res.json({
      success: true,
      data: {
        cliente,
        validacoes
      }
    });
  } catch (error) {
    console.error('Erro ao validar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/clientes/:codigo/atividade - Definir atividade do cliente
router.post('/:codigo/atividade', [
  body('codigo').isInt().withMessage('Código da atividade deve ser um inteiro'),
  body('descricao').notEmpty().withMessage('Descrição da atividade é obrigatória')
], handleValidationErrors, async (req, res) => {
  try {
    const { codigo } = req.params;
    const { codigo: codigoAtividade, descricao } = req.body;
    
    const cliente = await Cliente.findOne({ codigo: parseInt(codigo) });
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }
    
    // Validar se a atividade é permitida para o tipo de pessoa
    if (cliente.tipoPessoa === 'JURIDICA' && codigoAtividade < 100000) {
      return res.status(400).json({
        success: false,
        message: 'Atividade não permitida para pessoa jurídica'
      });
    }
    
    cliente.atividade = {
      codigo: codigoAtividade,
      descricao
    };
    
    await cliente.save();
    
    res.json({
      success: true,
      message: 'Atividade definida com sucesso',
      data: cliente.atividade
    });
  } catch (error) {
    console.error('Erro ao definir atividade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
