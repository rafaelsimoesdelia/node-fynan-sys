# 📋 Casos de Uso - Sistema Finan@sys

## 🎯 **Visão Geral do Sistema**

O **Finan@sys** é um sistema de gerenciamento financeiro especializado em desconto de cheques, que permite o controle completo de operações financeiras, clientes, ordens e cheques através de uma interface web moderna e APIs robustas.

---

## 🏗️ **Arquitetura do Sistema**

### **Tecnologias Utilizadas**
- **Backend:** Node.js + Express.js
- **Banco de Dados:** MongoDB
- **Frontend:** HTML5, CSS3, JavaScript
- **Containerização:** Docker + Docker Compose
- **Upload de Arquivos:** Multer + XLSX

### **Módulos Principais**
1. **Gestão de Clientes** - Cadastro e controle de clientes
2. **Gestão de Ordens** - Controle de ordens de desconto
3. **Gestão de Cheques** - Processamento e validação de cheques
4. **Gestão de Operações** - Controle de operações financeiras
5. **Upload de Planilhas** - Importação em lote via Excel/CSV

---

## 👥 **Atores do Sistema**

### **Usuário Sistema**
- Funcionário autorizado a operar o sistema
- Acesso completo a todas as funcionalidades
- Responsável pela gestão de operações financeiras

### **Cliente**
- Pessoa física ou jurídica que utiliza os serviços
- Pode ser librador ou endosante de cheques
- Possui linha de crédito e restrições

---

## 🔄 **Casos de Uso Principais**

### **1. Gestão de Clientes**

#### **UC-001: Cadastrar Novo Cliente**
**Descrição:** Usuário cadastra um novo cliente no sistema
**Ator Principal:** Usuário Sistema
**Pré-condições:** Usuário autenticado no sistema
**Fluxo Principal:**
1. Usuário acessa a seção "Clientes"
2. Clica no botão "Novo Cliente"
3. Preenche formulário com dados do cliente:
   - Código único
   - Nome completo
   - Tipo de pessoa (Física/Jurídica)
   - CPF/CNPJ
   - Sucursal
   - Aplicação
   - Linha de crédito
4. Sistema valida dados
5. Sistema salva cliente no banco
6. Sistema confirma cadastro

**Pós-condições:** Cliente cadastrado e disponível para operações
**Exceções:** CPF/CNPJ duplicado, dados obrigatórios não preenchidos

#### **UC-002: Consultar Cliente**
**Descrição:** Usuário busca informações de um cliente específico
**Ator Principal:** Usuário Sistema
**Pré-condições:** Cliente existente no sistema
**Fluxo Principal:**
1. Usuário acessa seção "Clientes"
2. Utiliza filtros de busca (código, CPF/CNPJ, nome)
3. Sistema retorna lista de clientes
4. Usuário seleciona cliente desejado
5. Sistema exibe detalhes completos do cliente

**Pós-condições:** Informações do cliente exibidas
**Exceções:** Cliente não encontrado

#### **UC-003: Atualizar Dados do Cliente**
**Descrição:** Usuário modifica informações de um cliente existente
**Ator Principal:** Usuário Sistema
**Pré-condições:** Cliente existente no sistema
**Fluxo Principal:**
1. Usuário localiza cliente
2. Clica em "Editar"
3. Modifica dados necessários
4. Sistema valida alterações
5. Sistema atualiza informações
6. Sistema registra data de atualização

**Pós-condições:** Dados do cliente atualizados
**Exceções:** Dados inválidos, CPF/CNPJ duplicado

---

### **2. Gestão de Ordens**

#### **UC-004: Criar Nova Ordem**
**Descrição:** Usuário cria uma nova ordem de desconto
**Ator Principal:** Usuário Sistema
**Pré-condições:** Cliente existente, dados da operação definidos
**Fluxo Principal:**
1. Usuário acessa seção "Ordens"
2. Clica em "Nova Ordem"
3. Preenche dados da ordem:
   - Número único
   - Cliente (código)
   - Sucursal
   - Taxa de desconto
   - Gastos operacionais
   - Setor (Personal/Comercial)
   - Atividade
   - Seguro
   - Linha afetada
4. Sistema valida dados
5. Sistema verifica disponibilidade de crédito
6. Sistema cria ordem com status "PENDENTE"
7. Sistema confirma criação

**Pós-condições:** Ordem criada e disponível para processamento
**Exceções:** Cliente não encontrado, limite de crédito excedido

#### **UC-005: Consultar Ordens**
**Descrição:** Usuário busca e filtra ordens no sistema
**Ator Principal:** Usuário Sistema
**Pré-condições:** Ordens existentes no sistema
**Fluxo Principal:**
1. Usuário acessa seção "Ordens"
2. Utiliza filtros disponíveis:
   - Status
   - Cliente
   - Origem
3. Sistema aplica filtros
4. Sistema retorna lista paginada
5. Usuário navega pelos resultados

**Pós-condições:** Lista de ordens filtrada exibida
**Exceções:** Nenhuma ordem encontrada

#### **UC-006: Atualizar Status da Ordem**
**Descrição:** Usuário altera o status de uma ordem
**Ator Principal:** Usuário Sistema
**Pré-condições:** Ordem existente no sistema
**Fluxo Principal:**
1. Usuário localiza ordem
2. Seleciona novo status:
   - PENDENTE
   - EM_PROCESSAMENTO
   - INTEGRADA
   - ERRO
   - CANCELADA
3. Sistema valida transição de status
4. Sistema atualiza ordem
5. Sistema registra alteração

**Pós-condições:** Status da ordem atualizado
**Exceções:** Transição de status inválida

---

### **3. Gestão de Cheques**

#### **UC-007: Cadastrar Cheque**
**Descrição:** Usuário registra um novo cheque no sistema
**Ator Principal:** Usuário Sistema
**Pré-condições:** Ordem existente, dados do cheque disponíveis
**Fluxo Principal:**
1. Usuário acessa seção "Cheques"
2. Clica em "Novo Cheque"
3. Preenche dados do cheque:
   - Número
   - Banco
   - Agência
   - Conta
   - Valor
   - Data de emissão
   - Data de vencimento
   - Librador
   - Endosante
   - Ordem associada
4. Sistema valida dados
5. Sistema valida CPF/CNPJ do librador/endosante
6. Sistema cria cheque com status "PENDENTE"
7. Sistema confirma cadastro

**Pós-condições:** Cheque cadastrado e associado à ordem
**Exceções:** CPF/CNPJ inválido, ordem não encontrada

#### **UC-008: Validar Cheque**
**Descrição:** Sistema valida automaticamente dados do cheque
**Ator Principal:** Sistema
**Pré-condições:** Cheque cadastrado
**Fluxo Principal:**
1. Sistema executa validações:
   - Documento válido (CPF/CNPJ)
   - Data de vencimento válida
   - Valor permitido
   - Librador válido
   - Endosante válido
2. Sistema atualiza campo de validações
3. Sistema registra mensagens de erro (se houver)
4. Sistema atualiza status do cheque

**Pós-condições:** Validações executadas e resultados registrados
**Exceções:** Dados inválidos detectados

#### **UC-009: Processar Cheque**
**Descrição:** Usuário processa cheque para aprovação/rejeição
**Ator Principal:** Usuário Sistema
**Pré-condições:** Cheque validado
**Fluxo Principal:**
1. Usuário seleciona cheque para processamento
2. Sistema exibe validações e mensagens
3. Usuário analisa informações
4. Usuário define ação:
   - APROVAR
   - REJEITAR
   - INTEGRAR
   - CANCELAR
5. Sistema atualiza status
6. Sistema registra ação no log

**Pós-condições:** Status do cheque atualizado
**Exceções:** Cheque não validado

---

### **4. Gestão de Operações**

#### **UC-010: Criar Operação**
**Descrição:** Usuário cria nova operação financeira
**Ator Principal:** Usuário Sistema
**Pré-condições:** Ordem e cheques existentes
**Fluxo Principal:**
1. Usuário acessa seção "Operações"
2. Clica em "Nova Operação"
3. Preenche dados da operação:
   - Número único
   - Ordem associada
   - Cliente
   - Tipo (Desconto de Cheque, Crédito em Conta, Outros)
   - Capital (principal, gastos)
   - Taxa (nominal, efetiva)
   - Prazo
   - Seguro
   - Linha afetada
4. Sistema valida dados
5. Sistema calcula valores automaticamente
6. Sistema cria operação com status "PENDENTE"
7. Sistema confirma criação

**Pós-condições:** Operação criada e disponível para processamento
**Exceções:** Ordem não encontrada, dados inválidos

#### **UC-011: Calcular Taxa Efetiva**
**Descrição:** Sistema calcula taxa efetiva da operação
**Ator Principal:** Sistema
**Pré-condições:** Operação com dados de prazo e capital
**Fluxo Principal:**
1. Sistema identifica operação com dados completos
2. Sistema aplica fórmula de taxa efetiva
3. Sistema atualiza campo taxa.efetiva
4. Sistema marca validação como concluída

**Pós-condições:** Taxa efetiva calculada e registrada
**Exceções:** Dados insuficientes para cálculo

#### **UC-012: Validar Limites de Crédito**
**Descrição:** Sistema verifica se operação está dentro dos limites
**Ator Principal:** Sistema
**Pré-condições:** Operação com capital definido
**Fluxo Principal:**
1. Sistema obtém limite máximo do cliente
2. Sistema compara capital total com limite
3. Sistema atualiza validação limiteExcedido
4. Sistema adiciona mensagem se limite excedido
5. Sistema registra validação

**Pós-condições:** Validação de limites executada
**Exceções:** Limite não definido para cliente

---

### **5. Upload de Planilhas**

#### **UC-013: Upload de Planilha Excel**
**Descrição:** Usuário importa ordens em lote via planilha Excel
**Ator Principal:** Usuário Sistema
**Pré-condições:** Arquivo Excel com formato correto
**Fluxo Principal:**
1. Usuário acessa seção "Upload"
2. Seleciona arquivo Excel (.xlsx, .xls) ou CSV
3. Sistema valida tipo de arquivo
4. Sistema processa planilha:
   - Extrai cabeçalhos
   - Mapeia colunas
   - Valida dados obrigatórios
   - Processa cada linha
5. Sistema valida dados:
   - Número da ordem único
   - Cliente existente
   - Taxa válida
   - Gastos válidos
6. Sistema cria ordens válidas
7. Sistema retorna relatório de processamento

**Pós-condições:** Ordens criadas em lote, relatório disponível
**Exceções:** Arquivo inválido, dados incorretos, cliente não encontrado

#### **UC-014: Validar Dados Antes do Upload**
**Descrição:** Usuário valida dados antes de processar planilha
**Ator Principal:** Usuário Sistema
**Pré-condições:** Dados extraídos da planilha
**Fluxo Principal:**
1. Usuário solicita validação
2. Sistema executa validações:
   - Formato dos dados
   - Regras de negócio
   - Integridade referencial
3. Sistema retorna relatório de validação
4. Usuário analisa resultados
5. Usuário decide prosseguir ou corrigir

**Pós-condições:** Relatório de validação disponível
**Exceções:** Dados malformados

#### **UC-015: Download de Template**
**Descrição:** Usuário baixa template para preenchimento
**Ator Principal:** Usuário Sistema
**Pré-condições:** Usuário autenticado
**Fluxo Principal:**
1. Usuário acessa seção "Upload"
2. Clica em "Download Template"
3. Sistema gera arquivo Excel com:
   - Cabeçalhos corretos
   - Exemplos de dados
   - Formatação adequada
4. Sistema disponibiliza download
5. Usuário baixa arquivo

**Pós-condições:** Template disponível para uso
**Exceções:** Erro na geração do arquivo

---

## 🧪 **Cenários de Teste**

### **Testes de Funcionalidade**

#### **TF-001: Cadastro de Cliente**
- **Cenário:** Cadastrar cliente pessoa física
- **Dados de Teste:** CPF válido, dados completos
- **Resultado Esperado:** Cliente criado com sucesso

#### **TF-002: Validação de CPF/CNPJ**
- **Cenário:** Inserir CPF inválido
- **Dados de Teste:** CPF com dígitos incorretos
- **Resultado Esperado:** Erro de validação retornado

#### **TF-003: Criação de Ordem**
- **Cenário:** Criar ordem com cliente existente
- **Dados de Teste:** Dados válidos de ordem
- **Resultado Esperado:** Ordem criada com status "PENDENTE"

#### **TF-004: Upload de Planilha**
- **Cenário:** Importar planilha com dados válidos
- **Dados de Teste:** Excel com formato correto
- **Resultado Esperado:** Ordens criadas em lote

### **Testes de Integração**

#### **TI-001: Fluxo Completo de Operação**
1. Cadastrar cliente
2. Criar ordem
3. Cadastrar cheque
4. Criar operação
5. Validar integridade dos dados

#### **TI-002: Validações Cruzadas**
- Verificar se cliente existe antes de criar ordem
- Validar se ordem existe antes de criar cheque
- Confirmar relacionamentos entre entidades

### **Testes de Performance**

#### **TP-001: Upload de Planilha Grande**
- **Cenário:** Planilha com 1000+ linhas
- **Métrica:** Tempo de processamento < 30 segundos
- **Resultado Esperado:** Processamento eficiente

#### **TP-002: Consultas com Filtros**
- **Cenário:** Buscar ordens com múltiplos filtros
- **Métrica:** Tempo de resposta < 2 segundos
- **Resultado Esperado:** Consultas otimizadas

### **Testes de Segurança**

#### **TS-001: Validação de Entrada**
- **Cenário:** Inserir dados maliciosos
- **Dados de Teste:** Scripts SQL injection, XSS
- **Resultado Esperado:** Dados rejeitados e sanitizados

#### **TS-002: Controle de Acesso**
- **Cenário:** Acesso não autorizado
- **Dados de Teste:** Usuário não autenticado
- **Resultado Esperado:** Acesso negado

---

## 📊 **Métricas de Qualidade**

### **Funcionalidade**
- **Cobertura de Testes:** > 90%
- **Taxa de Sucesso:** > 95%
- **Tempo de Resposta:** < 3 segundos

### **Confiabilidade**
- **Disponibilidade:** > 99.5%
- **Taxa de Erro:** < 1%
- **Recuperação de Falhas:** < 5 minutos

### **Usabilidade**
- **Tempo de Aprendizado:** < 30 minutos
- **Taxa de Erro do Usuário:** < 5%
- **Satisfação do Usuário:** > 4.5/5

---

## 🚀 **Próximos Passos para Testes**

### **1. Preparação do Ambiente**
- [ ] Configurar banco de dados de teste
- [ ] Preparar dados de seed
- [ ] Configurar ferramentas de teste

### **2. Execução de Testes**
- [ ] Testes unitários dos modelos
- [ ] Testes de integração das rotas
- [ ] Testes end-to-end da interface
- [ ] Testes de performance

### **3. Validação de Resultados**
- [ ] Análise de cobertura
- [ ] Relatório de bugs
- [ ] Métricas de qualidade
- [ ] Documentação de melhorias

---

## 📝 **Conclusão**

Este documento de casos de uso fornece uma visão abrangente das funcionalidades do sistema Finan@sys, permitindo o planejamento e execução de testes estruturados que garantam a qualidade e confiabilidade da aplicação.

Os cenários de teste propostos cobrem os principais fluxos de negócio e permitem validar tanto a funcionalidade quanto a performance do sistema em diferentes condições de uso.
