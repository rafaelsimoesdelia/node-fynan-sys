const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const Ordem = require('../models/Ordem');
const Cliente = require('../models/Cliente');
const Cheque = require('../models/Cheque');

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas Excel (.xlsx, .xls) e CSV são aceitos.'));
    }
  }
});

// POST /api/upload/excel - Upload e processamento de planilha Excel
router.post('/excel', upload.single('planilha'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converter para JSON
    const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (dados.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Planilha vazia ou sem dados válidos'
      });
    }
    
    // Processar cabeçalhos
    const headers = dados[0];
    const linhas = dados.slice(1);
    
    // Mapear colunas esperadas
    const colunas = {
      ordem: headers.findIndex(h => h && h.toString().toLowerCase().includes('ordem')),
      cliente: headers.findIndex(h => h && h.toString().toLowerCase().includes('cliente')),
      taxa: headers.findIndex(h => h && h.toString().toLowerCase().includes('taxa')),
      gastos: headers.findIndex(h => h && h.toString().toLowerCase().includes('gastos')),
      sector: headers.findIndex(h => h && h.toString().toLowerCase().includes('sector')),
      atividade: headers.findIndex(h => h && h.toString().toLowerCase().includes('atividade')),
      seguro: headers.findIndex(h => h && h.toString().toLowerCase().includes('seguro')),
      linhaAfectada: headers.findIndex(h => h && h.toString().toLowerCase().includes('linha'))
    };
    
    // Verificar se todas as colunas obrigatórias foram encontradas
    const colunasObrigatorias = ['ordem', 'cliente', 'taxa', 'gastos'];
    const colunasFaltando = colunasObrigatorias.filter(col => colunas[col] === -1);
    
    if (colunasFaltando.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Colunas obrigatórias não encontradas: ${colunasFaltando.join(', ')}`,
        headers: headers
      });
    }
    
    // Processar linhas de dados
    const resultados = {
      total: linhas.length,
      processadas: 0,
      erros: 0,
      ordens: [],
      detalhes: []
    };
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const numeroLinha = i + 2; // +2 porque começamos do índice 0 e pulamos o cabeçalho
      
      try {
        // Extrair dados da linha
        const dadosOrdem = {
          numero: parseInt(linha[colunas.ordem]),
          cliente: {
            codigo: parseInt(linha[colunas.cliente])
          },
          taxa: parseFloat(linha[colunas.taxa]) || 0,
          gastos: {
            total: parseFloat(linha[colunas.gastos]) || 0
          },
          sector: linha[colunas.sector] || 'PERSONAL',
          atividade: linha[colunas.atividade] ? {
            codigo: parseInt(linha[colunas.atividade])
          } : undefined,
          seguro: {
            cobrar: linha[colunas.seguro] ? linha[colunas.seguro].toString().toLowerCase().includes('sim') : false
          },
          linhaAfectada: linha[colunas.linhaAfectada] || 'ENDOSANTE',
          origem: 'EXCEL'
        };
        
        // Validar dados básicos
        if (!dadosOrdem.numero || !dadosOrdem.cliente.codigo || dadosOrdem.taxa <= 0 || dadosOrdem.gastos.total <= 0) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: numeroLinha,
            erro: 'Dados inválidos ou incompletos',
            dados: dadosOrdem
          });
          continue;
        }
        
        // Verificar se a ordem já existe
        const ordemExistente = await Ordem.findOne({ numero: dadosOrdem.numero });
        if (ordemExistente) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: numeroLinha,
            erro: 'Ordem já existe',
            dados: dadosOrdem
          });
          continue;
        }
        
        // Verificar se o cliente existe
        const cliente = await Cliente.findOne({ codigo: dadosOrdem.cliente.codigo });
        if (!cliente) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: numeroLinha,
            erro: 'Cliente não encontrado',
            dados: dadosOrdem
          });
          continue;
        }
        
        // Completar dados do cliente
        dadosOrdem.cliente.nome = cliente.nome;
        dadosOrdem.sucursal = cliente.sucursal;
        dadosOrdem.aplicacao = cliente.aplicacao;
        
        // Criar ordem
        const novaOrdem = new Ordem(dadosOrdem);
        await novaOrdem.save();
        
        resultados.processadas++;
        resultados.ordens.push(novaOrdem);
        resultados.detalhes.push({
          linha: numeroLinha,
          status: 'Processada com sucesso',
          dados: novaOrdem
        });
        
      } catch (error) {
        resultados.erros++;
        resultados.detalhes.push({
          linha: numeroLinha,
          erro: error.message,
          dados: linha
        });
      }
    }
    
    // Limpar arquivo temporário
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'Planilha processada com sucesso',
      data: resultados
    });
    
  } catch (error) {
    console.error('Erro ao processar planilha:', error);
    
    // Limpar arquivo temporário em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao processar planilha',
      error: error.message
    });
  }
});

// POST /api/upload/validar - Validar dados antes do upload
router.post('/validar', async (req, res) => {
  try {
    const { dados } = req.body;
    
    if (!Array.isArray(dados)) {
      return res.status(400).json({
        success: false,
        message: 'Dados devem ser um array'
      });
    }
    
    const validacoes = [];
    
    for (const item of dados) {
      const validacao = {
        linha: item.linha,
        valida: true,
        erros: []
      };
      
      // Validar número da ordem
      if (!item.numero || isNaN(item.numero)) {
        validacao.valida = false;
        validacao.erros.push('Número da ordem inválido');
      }
      
      // Validar cliente
      if (!item.cliente || !item.cliente.codigo || isNaN(item.cliente.codigo)) {
        validacao.valida = false;
        validacao.erros.push('Código do cliente inválido');
      }
      
      // Validar taxa
      if (!item.taxa || isNaN(item.taxa) || item.taxa <= 0 || item.taxa > 100) {
        validacao.valida = false;
        validacao.erros.push('Taxa inválida (deve estar entre 0 e 100)');
      }
      
      // Validar gastos
      if (!item.gastos || !item.gastos.total || isNaN(item.gastos.total) || item.gastos.total <= 0) {
        validacao.valida = false;
        validacao.erros.push('Gastos totais inválidos');
      }
      
      // Validar setor
      if (item.sector && !['PERSONAL', 'COMERCIAL'].includes(item.sector)) {
        validacao.valida = false;
        validacao.erros.push('Setor deve ser PERSONAL ou COMERCIAL');
      }
      
      // Validar linha afetada
      if (item.linhaAfectada && !['LIBRADOR', 'ENDOSANTE'].includes(item.linhaAfectada)) {
        validacao.valida = false;
        validacao.erros.push('Linha afetada deve ser LIBRADOR ou ENDOSANTE');
      }
      
      validacoes.push(validacao);
    }
    
    const totalValidas = validacoes.filter(v => v.valida).length;
    const totalInvalidas = validacoes.filter(v => !v.valida).length;
    
    res.json({
      success: true,
      data: {
        validacoes,
        resumo: {
          total: validacoes.length,
          validas: totalValidas,
          invalidas: totalInvalidas
        }
      }
    });
    
  } catch (error) {
    console.error('Erro ao validar dados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/upload/template - Download do template Excel
router.get('/template', (req, res) => {
  try {
    // Criar template básico
    const template = [
      ['ORDEM', 'CLIENTE', 'TAXA', 'GASTOS', 'SECTOR', 'ATIVIDADE', 'SEGURO', 'LINHA_AFECTADA'],
      [41823, 754051, 5.00, 100718.00, 'PERSONAL', 749905, 'SIM', 'ENDOSANTE'],
      [41824, 754052, 4.50, 50000.00, 'COMERCIAL', 749906, 'NAO', 'LIBRADOR']
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(template);
    
    // Aplicar formatação
    worksheet['!cols'] = [
      { width: 10 }, // ORDEM
      { width: 10 }, // CLIENTE
      { width: 8 },  // TAXA
      { width: 12 }, // GASTOS
      { width: 12 }, // SECTOR
      { width: 12 }, // ATIVIDADE
      { width: 8 },  // SEGURO
      { width: 15 }  // LINHA_AFECTADA
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    // Gerar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template_ordens.xlsx');
    res.send(buffer);
    
  } catch (error) {
    console.error('Erro ao gerar template:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar template'
    });
  }
});

module.exports = router;
