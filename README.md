# 🏦 Finan@sys - Sistema de Gerenciamento Financeiro

Sistema completo de gerenciamento financeiro baseado no "Finan@sys" original, implementado com tecnologias modernas para **desconto de cheques** e **integração de dados**.

## 🚀 Características Principais

- **Desconto de Cheques**: Sistema completo para gerenciamento de operações de desconto
- **Integração de Dados**: Suporte para formulários, diskettes, web e planilhas Excel
- **Validações Automáticas**: CPF/CNPJ, taxas, limites e documentos
- **Interface Moderna**: Design responsivo com Bootstrap 5
- **API RESTful**: Backend robusto com Node.js e Express
- **Banco NoSQL**: MongoDB para flexibilidade e performance
- **Docker**: Containerização completa para fácil deploy

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** 18+
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **Multer** - Upload de arquivos
- **XLSX** - Processamento de planilhas Excel

### Frontend
- **Bootstrap 5** - Framework CSS
- **Bootstrap Icons** - Ícones
- **JavaScript ES6+** - Lógica da aplicação
- **HTML5** - Estrutura semântica

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração de serviços
- **MongoDB Express** - Interface web para MongoDB

## 📋 Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Node.js** 18+ (para desenvolvimento local)
- **Git** para clonar o repositório

## 🚀 Instalação e Execução

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd finan-sys
```

### 2. Execução com Docker (Recomendado)

```bash
# Construir e iniciar todos os serviços
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f app

# Parar serviços
docker-compose down
```

### 3. Execução Local (Desenvolvimento)

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp config.env .env
# Editar .env com suas configurações

# Iniciar MongoDB localmente ou usar Docker
docker run -d -p 27017:27017 --name mongo mongo:7.0

# Iniciar aplicação
npm run dev
```

## 🌐 Acessos

- **Aplicação Principal**: http://localhost:3000
- **MongoDB Express**: http://localhost:8081 (admin/admin123)
- **API REST**: http://localhost:3000/api

## 📊 Estrutura do Projeto

```
finan-sys/
├── models/                 # Modelos MongoDB
│   ├── Cliente.js         # Modelo de Cliente
│   ├── Ordem.js           # Modelo de Ordem
│   ├── Cheque.js          # Modelo de Cheque
│   └── Operacao.js        # Modelo de Operação
├── routes/                 # Rotas da API
│   ├── clientes.js        # API de Clientes
│   ├── ordens.js          # API de Ordens
│   ├── cheques.js         # API de Cheques
│   ├── operacoes.js       # API de Operações
│   └── upload.js          # API de Upload
├── public/                 # Frontend
│   ├── index.html         # Página principal
│   ├── styles.css         # Estilos CSS
│   └── app.js             # JavaScript da aplicação
├── uploads/                # Diretório de uploads
├── server.js               # Servidor principal
├── docker-compose.yml      # Configuração Docker
├── Dockerfile              # Imagem Docker
└── package.json            # Dependências Node.js
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://admin:admin123@localhost:27017/finan_sys?authSource=admin
JWT_SECRET=finan_sys_secret_key_2025
JWT_EXPIRE=24h
```

### Configuração do MongoDB

O sistema está configurado para usar MongoDB com autenticação:
- **Usuário**: admin
- **Senha**: admin123
- **Database**: finan_sys

## 📱 Funcionalidades

### Dashboard
- **Estatísticas**: Total de ordens, integradas, pendentes e clientes
- **Ações Rápidas**: Integrar por ordem, upload Excel, nova ordem, novo cliente
- **Ordens Recentes**: Lista das últimas 5 ordens criadas

### Gestão de Ordens
- **Criar Ordem**: Formulário completo para nova ordem
- **Integrar Ordem**: Processo de integração automática
- **Filtros**: Por status, cliente e origem
- **Paginação**: Navegação entre páginas de resultados

### Gestão de Clientes
- **Cadastro**: Dados pessoais, tipo (Física/Jurídica), CPF/CNPJ
- **Validação**: Verificação automática de documentos
- **Sucursais**: Associação com filiais
- **Status**: Ativo, bloqueado ou inativo

### Gestão de Cheques
- **Validação**: CPF/CNPJ, datas, valores
- **Aprovação**: Fluxo de aprovação/rejeição
- **Associação**: Vinculação com ordens e clientes

### Upload de Planilhas
- **Formatos**: Excel (.xlsx, .xls) e CSV
- **Template**: Download de modelo padrão
- **Validação**: Verificação automática de dados
- **Processamento**: Integração em lote

## 🔌 API Endpoints

### Ordens
- `GET /api/ordens` - Listar ordens
- `GET /api/ordens/:numero` - Buscar ordem por número
- `POST /api/ordens` - Criar nova ordem
- `PUT /api/ordens/:numero` - Atualizar ordem
- `POST /api/ordens/:numero/integrar` - Integrar ordem
- `DELETE /api/ordens/:numero` - Cancelar ordem

### Clientes
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/:codigo` - Buscar cliente por código
- `POST /api/clientes` - Criar novo cliente
- `PUT /api/clientes/:codigo` - Atualizar cliente
- `DELETE /api/clientes/:codigo` - Desativar cliente
- `GET /api/clientes/:codigo/validar` - Validar cliente

### Cheques
- `GET /api/cheques` - Listar cheques
- `POST /api/cheques` - Criar novo cheque
- `POST /api/cheques/:id/validar` - Validar cheque
- `POST /api/cheques/:id/aprovar` - Aprovar cheque
- `POST /api/cheques/:id/rejeitar` - Rejeitar cheque

### Upload
- `POST /api/upload/excel` - Upload de planilha Excel
- `GET /api/upload/template` - Download do template

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage
```

## 📦 Deploy

### Produção com Docker

```bash
# Build da imagem de produção
docker build -t finan-sys:prod .

# Executar container
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://admin:admin123@mongo:27017/finan_sys?authSource=admin \
  --name finan-sys-prod \
  finan-sys:prod
```

### Variáveis de Produção

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://admin:admin123@mongo:27017/finan_sys?authSource=admin
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRE=24h
```

## 🔒 Segurança

- **Helmet.js**: Headers de segurança
- **CORS**: Configuração de origens permitidas
- **Validação**: Sanitização de inputs
- **Rate Limiting**: Proteção contra ataques
- **JWT**: Autenticação stateless

## 📈 Monitoramento

- **Morgan**: Logs de requisições HTTP
- **Health Checks**: Verificação de saúde da aplicação
- **Error Handling**: Tratamento centralizado de erros

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Entre em contato com a equipe de desenvolvimento

## 🔄 Changelog

### v1.0.0 (2025-01-15)
- ✅ Sistema base completo
- ✅ API RESTful para todas as entidades
- ✅ Interface web responsiva
- ✅ Upload e processamento de planilhas Excel
- ✅ Validações automáticas
- ✅ Containerização Docker
- ✅ Documentação completa

---

**Finan@sys** - Transformando a gestão financeira com tecnologia moderna! 🚀
