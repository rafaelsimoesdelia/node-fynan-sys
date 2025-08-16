# 🚀 Guia de Início Rápido - Finan@sys

## ⚡ Execução Super Rápida

### 1. Clone e Execute
```bash
git clone <url-do-repositorio>
cd finan-sys
docker-compose up -d
```

### 2. Acesse a Aplicação
- 🌐 **Sistema**: http://localhost:3000
- 🗄️ **MongoDB Admin**: http://localhost:8081 (admin/admin123)

### 3. Popule o Banco (Opcional)
```bash
npm run seed
```

## 🎯 Funcionalidades Principais

### 📊 Dashboard
- Estatísticas em tempo real
- Ações rápidas
- Ordens recentes

### 📋 Gestão de Ordens
- Criar nova ordem
- Integrar por número
- Filtros e paginação

### 👥 Gestão de Clientes
- Cadastro completo
- Validação automática
- Tipos: Física/Jurídica

### 💰 Gestão de Cheques
- Validação CPF/CNPJ
- Aprovação/rejeição
- Associação com ordens

### 📤 Upload Excel
- Processamento automático
- Template para download
- Validação em lote

## 🔧 Comandos Úteis

```bash
# Iniciar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Parar serviços
docker-compose down

# Rebuild da aplicação
docker-compose up -d --build

# Executar seed
npm run seed

# Desenvolvimento local
npm install
npm run dev
```

## 📱 Primeiros Passos

1. **Acesse** http://localhost:3000
2. **Clique** em "Integrar por Nro. de ORDEN"
3. **Digite** o número: 41823
4. **Pressione** ENTER
5. **Explore** as outras funcionalidades!

## 🆘 Problemas Comuns

### Porta 3000 em uso
```bash
# Mude a porta no docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 em vez de 3000
```

### MongoDB não conecta
```bash
# Verifique se o container está rodando
docker-compose ps

# Reinicie o MongoDB
docker-compose restart mongo
```

### Erro de permissão
```bash
# No Windows, execute como administrador
# No Linux/Mac, use sudo se necessário
```

## 📚 Próximos Passos

- 📖 Leia o [README.md](README.md) completo
- 🔍 Explore a [API](http://localhost:3000/api)
- 🧪 Teste as funcionalidades
- 🚀 Personalize para suas necessidades

---

**🎉 Pronto! Seu Finan@sys está rodando!**
