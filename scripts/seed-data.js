// Finan@sys - Script de População do Banco de Dados
// Este script cria dados de exemplo para desenvolvimento e testes

// Carregar variáveis de ambiente
require('dotenv').config({ path: './config.env' });

// Importar dependências
const mongoose = require('mongoose');

// Importar modelos
const Cliente = require('../models/Cliente');
const Ordem = require('../models/Ordem');
const Cheque = require('../models/Cheque');
const Operacao = require('../models/Operacao');

// Dados de exemplo
const clientesExemplo = [
    {
        codigo: 754051,
        nome: "JOÃO SILVA SANTOS",
        tipoPessoa: "FISICA",
        cpfCnpj: "12345678901",
        atividade: {
            codigo: 749905,
            descricao: "OUTROS SERVIÇOS PRESTADOS A EMPRESA NÃO"
        },
        sucursal: {
            codigo: "01",
            nome: "FERNANDO DE LA MORA"
        },
        aplicacao: {
            codigo: "A1",
            descricao: "CHEQUES DESCONTADOS VISTA (DESC. D)"
        },
        linhaCredito: {
            librador: { valor: 500000, utilizada: 0 },
            endosante: { valor: 1000000, utilizada: 0 }
        },
        contaBancaria: {
            numero: "012363903001",
            banco: "BANCO CENTRAL",
            agencia: "0001"
        },
        seguro: {
            habilitado: true,
            seguradora: "PATRIA S.A. SEG.Y REASEGUROS"
        },
        status: "ATIVO"
    },
    {
        codigo: 754052,
        nome: "EMPRESA ABC LTDA",
        tipoPessoa: "JURIDICA",
        cpfCnpj: "12345678000195",
        atividade: {
            codigo: 749906,
            descricao: "SERVIÇOS DE CONSULTORIA EMPRESARIAL"
        },
        sucursal: {
            codigo: "02",
            nome: "ASUNCIÓN CENTRO"
        },
        aplicacao: {
            codigo: "A2",
            descricao: "CREDITO EMPRESARIAL"
        },
        linhaCredito: {
            librador: { valor: 2000000, utilizada: 0 },
            endosante: { valor: 5000000, utilizada: 0 }
        },
        contaBancaria: {
            numero: "012363903002",
            banco: "BANCO CENTRAL",
            agencia: "0002"
        },
        seguro: {
            habilitado: false,
            seguradora: null
        },
        status: "ATIVO"
    },
    {
        codigo: 754053,
        nome: "MARIA OLIVEIRA COSTA",
        tipoPessoa: "FISICA",
        cpfCnpj: "98765432100",
        atividade: {
            codigo: 749907,
            descricao: "SERVIÇOS DE ASSESSORIA FINANCEIRA"
        },
        sucursal: {
            codigo: "01",
            nome: "FERNANDO DE LA MORA"
        },
        aplicacao: {
            codigo: "A1",
            descricao: "CHEQUES DESCONTADOS VISTA (DESC. D)"
        },
        linhaCredito: {
            librador: { valor: 300000, utilizada: 0 },
            endosante: { valor: 800000, utilizada: 0 }
        },
        contaBancaria: {
            numero: "012363903003",
            banco: "BANCO CENTRAL",
            agencia: "0001"
        },
        seguro: {
            habilitado: true,
            seguradora: "PATRIA S.A. SEG.Y REASEGUROS"
        },
        status: "ATIVO"
    }
];

const ordensExemplo = [
    {
        numero: 41823,
        cliente: {
            codigo: 754051,
            nome: "JOÃO SILVA SANTOS"
        },
        sucursal: {
            codigo: "01",
            nome: "FERNANDO DE LA MORA"
        },
        aplicacao: {
            codigo: "A1",
            descricao: "CHEQUES DESCONTADOS VISTA (DESC. D)"
        },
        taxa: 5.00,
        sector: "PERSONAL",
        atividade: {
            codigo: 749905,
            descricao: "OUTROS SERVIÇOS PRESTADOS A EMPRESA NÃO"
        },
        gastos: {
            total: 100718.00,
            operacao1: 22931.00,
            operacao2: 77787.00
        },
        seguro: {
            cobrar: true,
            seguradora: "PATRIA S.A. SEG.Y REASEGUROS"
        },
        linhaAfectada: "ENDOSANTE",
        creditoConta: {
            numero: "012363903001",
            descricao: "Conta Corrente João Silva"
        },
        status: "PENDENTE",
        origem: "FORMULARIO"
    },
    {
        numero: 41824,
        cliente: {
            codigo: 754052,
            nome: "EMPRESA ABC LTDA"
        },
        sucursal: {
            codigo: "02",
            nome: "ASUNCIÓN CENTRO"
        },
        aplicacao: {
            codigo: "A2",
            descricao: "CREDITO EMPRESARIAL"
        },
        taxa: 4.50,
        sector: "COMERCIAL",
        atividade: {
            codigo: 749906,
            descricao: "SERVIÇOS DE CONSULTORIA EMPRESARIAL"
        },
        gastos: {
            total: 500000.00,
            operacao1: 250000.00,
            operacao2: 250000.00
        },
        seguro: {
            cobrar: false,
            seguradora: null
        },
        linhaAfectada: "LIBRADOR",
        creditoConta: {
            numero: "012363903002",
            descricao: "Conta Corrente Empresa ABC"
        },
        status: "PENDENTE",
        origem: "EXCEL"
    },
    {
        numero: 41825,
        cliente: {
            codigo: 754053,
            nome: "MARIA OLIVEIRA COSTA"
        },
        sucursal: {
            codigo: "01",
            nome: "FERNANDO DE LA MORA"
        },
        aplicacao: {
            codigo: "A1",
            descricao: "CHEQUES DESCONTADOS VISTA (DESC. D)"
        },
        taxa: 5.25,
        sector: "PERSONAL",
        atividade: {
            codigo: 749907,
            descricao: "SERVIÇOS DE ASSESSORIA FINANCEIRA"
        },
        gastos: {
            total: 75000.00,
            operacao1: 40000.00,
            operacao2: 35000.00
        },
        seguro: {
            cobrar: true,
            seguradora: "PATRIA S.A. SEG.Y REASEGUROS"
        },
        linhaAfectada: "ENDOSANTE",
        creditoConta: {
            numero: "012363903003",
            descricao: "Conta Corrente Maria Costa"
        },
        status: "INTEGRADA",
        origem: "FORMULARIO",
        operacao: {
            numero: "OP1705123456789",
            dataIntegracao: new Date()
        }
    }
];

const chequesExemplo = [
    {
        numero: "001234",
        banco: {
            codigo: "001",
            nome: "BANCO DO BRASIL"
        },
        agencia: "1234",
        conta: "12345-6",
        valor: 22931.00,
        dataEmissao: new Date("2025-01-10"),
        dataVencimento: new Date("2025-02-10"),
        librador: {
            nome: "EMPRESA FORNECEDORA LTDA",
            cpfCnpj: "12345678000101",
            tipoPessoa: "JURIDICA"
        },
        endosante: {
            nome: "JOÃO SILVA SANTOS",
            cpfCnpj: "12345678901",
            tipoPessoa: "FISICA"
        },
        status: "PENDENTE"
    },
    {
        numero: "001235",
        banco: {
            codigo: "001",
            nome: "BANCO DO BRASIL"
        },
        agencia: "1234",
        conta: "12345-6",
        valor: 77787.00,
        dataEmissao: new Date("2025-01-12"),
        dataVencimento: new Date("2025-02-12"),
        librador: {
            nome: "SERVIÇOS GERAIS S/A",
            cpfCnpj: "12345678000102",
            tipoPessoa: "JURIDICA"
        },
        endosante: {
            nome: "JOÃO SILVA SANTOS",
            cpfCnpj: "12345678901",
            tipoPessoa: "FISICA"
        },
        status: "PENDENTE"
    }
];

// Função para conectar ao MongoDB
async function conectarMongoDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
}

// Função para limpar o banco
async function limparBanco() {
    try {
        await Promise.all([
            Cliente.deleteMany({}),
            Ordem.deleteMany({}),
            Cheque.deleteMany({}),
            Operacao.deleteMany({})
        ]);
        console.log('🗑️  Banco limpo com sucesso');
    } catch (error) {
        console.error('❌ Erro ao limpar banco:', error);
    }
}

// Função para inserir clientes
async function inserirClientes() {
    try {
        const clientes = await Cliente.insertMany(clientesExemplo);
        console.log(`✅ ${clientes.length} clientes inseridos`);
        return clientes;
    } catch (error) {
        console.error('❌ Erro ao inserir clientes:', error);
        return [];
    }
}

// Função para inserir ordens
async function inserirOrdens(clientes) {
    try {
        // Associar clientes às ordens
        const ordensComClientes = ordensExemplo.map(ordem => {
            const cliente = clientes.find(c => c.codigo === ordem.cliente.codigo);
            if (!cliente) {
                console.warn(`⚠️  Cliente com código ${ordem.cliente.codigo} não encontrado para ordem ${ordem.numero}`);
                return null;
            }
            return {
                ...ordem,
                cliente: {
                    codigo: cliente.codigo,
                    nome: cliente.nome
                }
            };
        }).filter(ordem => ordem !== null);

        if (ordensComClientes.length === 0) {
            console.log('⚠️  Nenhuma ordem válida para inserir');
            return [];
        }

        const ordens = await Ordem.insertMany(ordensComClientes);
        console.log(`✅ ${ordens.length} ordens inseridas`);
        return ordens;
    } catch (error) {
        console.error('❌ Erro ao inserir ordens:', error);
        return [];
    }
}

// Função para inserir cheques
async function inserirCheques(ordens, clientes) {
    try {
        if (ordens.length === 0) {
            console.log('⚠️  Nenhuma ordem disponível para associar cheques');
            return [];
        }

        // Associar cheques à primeira ordem
        const primeiraOrdem = ordens[0];
        const primeiroCliente = clientes.find(c => c.codigo === primeiraOrdem.cliente.codigo);

        if (!primeiroCliente) {
            console.log('⚠️  Cliente não encontrado para associar cheques');
            return [];
        }

        const chequesComOrdem = chequesExemplo.map(cheque => ({
            ...cheque,
            ordem: primeiraOrdem._id,
            cliente: primeiroCliente._id
        }));

        const cheques = await Cheque.insertMany(chequesComOrdem);
        console.log(`✅ ${cheques.length} cheques inseridos`);

        // Atualizar ordem com os cheques
        await Ordem.findByIdAndUpdate(primeiraOrdem._id, {
            $push: { cheques: { $each: cheques.map(c => c._id) } }
        });

        return cheques;
    } catch (error) {
        console.error('❌ Erro ao inserir cheques:', error);
        return [];
    }
}

// Função para inserir operações
async function inserirOperacoes(ordens, clientes) {
    try {
        if (ordens.length === 0) {
            console.log('⚠️  Nenhuma ordem disponível para criar operações');
            return [];
        }

        // Criar operação para a primeira ordem
        const primeiraOrdem = ordens[0];
        const primeiroCliente = clientes.find(c => c.codigo === primeiraOrdem.cliente.codigo);

        if (!primeiroCliente) {
            console.log('⚠️  Cliente não encontrado para criar operação');
            return [];
        }

        const operacao = new Operacao({
            numero: `OP${primeiraOrdem.numero}`,
            ordem: primeiraOrdem._id,
            cliente: primeiroCliente._id,
            tipo: 'DESCONTO_CHEQUE',
            capital: {
                principal: primeiraOrdem.gastos.total,
                gastos: 0,
                total: primeiraOrdem.gastos.total
            },
            taxa: {
                nominal: primeiraOrdem.taxa,
                efetiva: primeiraOrdem.taxa
            },
            prazo: {
                dias: 30,
                dataInicio: new Date(),
                dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            seguro: {
                cobrar: primeiraOrdem.seguro.cobrar,
                seguradora: primeiraOrdem.seguro.seguradora,
                valor: primeiraOrdem.seguro.cobrar ? primeiraOrdem.gastos.total * 0.01 : 0
            },
            linhaAfectada: primeiraOrdem.linhaAfectada,
            status: 'PENDENTE',
            dataCriacao: new Date()
        });

        await operacao.save();
        console.log('✅ 1 operação inserida');
    } catch (error) {
        console.error('❌ Erro ao inserir operações:', error);
    }
}

// Função principal
async function main() {
    try {
        console.log('🚀 Iniciando população do banco de dados...\n');

        // Conectar ao MongoDB
        await conectarMongoDB();

        // Limpar banco
        await limparBanco();

        // Inserir dados
        const clientes = await inserirClientes();
        const ordens = await inserirOrdens(clientes);
        const cheques = await inserirCheques(ordens, clientes);
        await inserirOperacoes(ordens, clientes);

        console.log('\n🎉 Banco de dados populado com sucesso!');
        console.log(`📊 Resumo:`);
        console.log(`   - Clientes: ${clientes.length}`);
        console.log(`   - Ordens: ${ordens.length}`);
        console.log(`   - Cheques: ${cheques.length}`);
        console.log(`   - Operações: 1`);

    } catch (error) {
        console.error('❌ Erro durante a população do banco:', error);
    } finally {
        // Fechar conexão
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
        process.exit(0);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { main };
