// Finan@sys - Main Application JavaScript

class FinanSysApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboard();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(link.dataset.section);
            });
        });

        // Upload form
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFileUpload();
            });
        }

        // Enter key on order number input
        const ordenNumero = document.getElementById('ordenNumero');
        if (ordenNumero) {
            ordenNumero.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    integrarOrden();
                }
            });
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionName).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        this.currentSection = sectionName;

        // Load section data
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'ordens':
                this.loadOrdens();
                break;
            case 'clientes':
                this.loadClientes();
                break;
            case 'cheques':
                this.loadCheques();
                break;
            case 'operacoes':
                this.loadOperacoes();
                break;
        }
    }

    async loadDashboard() {
        try {
            this.showLoading();
            
            // Load statistics
            const [ordensRes, clientesRes] = await Promise.all([
                fetch('/api/ordens'),
                fetch('/api/clientes')
            ]);

            const ordensData = await ordensRes.json();
            const clientesData = await clientesRes.json();

            if (ordensData.success && clientesData.success) {
                this.updateDashboardStats(ordensData.data, clientesData.data);
                this.loadRecentOrders(ordensData.data);
            }
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            this.showAlert('Erro ao carregar dados do dashboard', 'danger');
        } finally {
            this.hideLoading();
        }
    }

    updateDashboardStats(ordens, clientes) {
        const totalOrdens = ordens.length;
        const ordensIntegradas = ordens.filter(o => o.status === 'INTEGRADA').length;
        const ordensPendentes = ordens.filter(o => o.status === 'PENDENTE').length;
        const totalClientes = clientes.length;

        document.getElementById('totalOrdens').textContent = totalOrdens;
        document.getElementById('ordensIntegradas').textContent = ordensIntegradas;
        document.getElementById('ordensPendentes').textContent = ordensPendentes;
        document.getElementById('totalClientes').textContent = totalClientes;
    }

    loadRecentOrders(ordens) {
        const recentOrders = ordens.slice(0, 5);
        const tbody = document.getElementById('recentOrdersTable');
        
        if (!tbody) return;

        tbody.innerHTML = recentOrders.map(ordem => `
            <tr>
                <td><strong>${ordem.numero}</strong></td>
                <td>${ordem.cliente?.nome || ordem.cliente?.codigo || 'N/A'}</td>
                <td>${ordem.taxa}%</td>
                <td>${this.formatCurrency(ordem.gastos.total)}</td>
                <td>${this.getStatusBadge(ordem.status)}</td>
                <td>${this.formatDate(ordem.dataCriacao)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewOrdem(${ordem.numero})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="integrarOrdem(${ordem.numero})">
                            <i class="bi bi-check-circle"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadOrdens(page = 1) {
        try {
            this.showLoading();
            
            const filters = this.getOrdensFilters();
            const queryParams = new URLSearchParams({
                page: page,
                limit: this.itemsPerPage,
                ...filters
            });

            const response = await fetch(`/api/ordens?${queryParams}`);
            const data = await response.json();

            if (data.success) {
                this.renderOrdensTable(data.data);
                this.renderPagination(data.pagination, 'ordersPagination');
            }
        } catch (error) {
            console.error('Erro ao carregar ordens:', error);
            this.showAlert('Erro ao carregar ordens', 'danger');
        } finally {
            this.hideLoading();
        }
    }

    getOrdensFilters() {
        const filters = {};
        
        const status = document.getElementById('filterStatus')?.value;
        const cliente = document.getElementById('filterCliente')?.value;
        const origem = document.getElementById('filterOrigem')?.value;

        if (status) filters.status = status;
        if (cliente) filters.cliente = cliente;
        if (origem) filters.origem = origem;

        return filters;
    }

    renderOrdensTable(ordens) {
        const tbody = document.getElementById('ordersTable');
        if (!tbody) return;

        tbody.innerHTML = ordens.map(ordem => `
            <tr>
                <td><strong>${ordem.numero}</strong></td>
                <td>${ordem.cliente?.nome || ordem.cliente?.codigo || 'N/A'}</td>
                <td>${ordem.sucursal?.nome || ordem.sucursal?.codigo || 'N/A'}</td>
                <td>${ordem.taxa}%</td>
                <td>${this.formatCurrency(ordem.gastos.total)}</td>
                <td>${this.getStatusBadge(ordem.status)}</td>
                <td>${this.formatDate(ordem.dataCriacao)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewOrdem(${ordem.numero})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="integrarOrdem(${ordem.numero})" ${ordem.status === 'INTEGRADA' ? 'disabled' : ''}>
                            <i class="bi bi-check-circle"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-sm" onclick="editOrdem(${ordem.numero})" ${ordem.status === 'INTEGRADA' ? 'disabled' : ''}>
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="cancelarOrdem(${ordem.numero})" ${ordem.status === 'INTEGRADA' ? 'disabled' : ''}>
                            <i class="bi bi-x-circle"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadClientes() {
        try {
            this.showLoading();
            
            const response = await fetch('/api/clientes');
            const data = await response.json();

            if (data.success) {
                this.renderClientesTable(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            this.showAlert('Erro ao carregar clientes', 'danger');
        } finally {
            this.hideLoading();
        }
    }

    renderClientesTable(clientes) {
        const tbody = document.getElementById('clientsTable');
        if (!tbody) return;

        tbody.innerHTML = clientes.map(cliente => `
            <tr>
                <td><strong>${cliente.codigo}</strong></td>
                <td>${cliente.nome}</td>
                <td>${cliente.tipoPessoa}</td>
                <td>${cliente.cpfCnpj}</td>
                <td>${cliente.sucursal?.nome || cliente.sucursal?.codigo || 'N/A'}</td>
                <td>${this.getStatusBadge(cliente.status)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewCliente(${cliente.codigo})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-sm" onclick="editCliente(${cliente.codigo})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="desativarCliente(${cliente.codigo})">
                            <i class="bi bi-person-x"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadCheques() {
        try {
            this.showLoading();
            
            const response = await fetch('/api/cheques');
            const data = await response.json();

            if (data.success) {
                this.renderChequesTable(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar cheques:', error);
            this.showAlert('Erro ao carregar cheques', 'danger');
        } finally {
            this.hideLoading();
        }
    }

    renderChequesTable(cheques) {
        const tbody = document.getElementById('chequesTable');
        if (!tbody) return;

        tbody.innerHTML = cheques.map(cheque => `
            <tr>
                <td><strong>${cheque.numero}</strong></td>
                <td>${cheque.banco?.nome || cheque.banco?.codigo || 'N/A'}</td>
                <td>${this.formatCurrency(cheque.valor)}</td>
                <td>${cheque.librador?.nome || 'N/A'}</td>
                <td>${this.getStatusBadge(cheque.status)}</td>
                <td>${cheque.ordem?.numero || 'N/A'}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewCheque('${cheque._id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="aprovarCheque('${cheque._id}')" ${cheque.status !== 'PENDENTE' ? 'disabled' : ''}>
                            <i class="bi bi-check-circle"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="rejeitarCheque('${cheque._id}')" ${cheque.status === 'INTEGRADO' ? 'disabled' : ''}>
                            <i class="bi bi-x-circle"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadOperacoes() {
        try {
            this.showLoading();
            
            const response = await fetch('/api/operacoes');
            const data = await response.json();

            if (data.success) {
                this.renderOperacoesTable(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar operações:', error);
            this.showAlert('Erro ao carregar operações', 'danger');
        } finally {
            this.hideLoading();
        }
    }

    renderOperacoesTable(operacoes) {
        const tbody = document.getElementById('operacoesTable');
        if (!tbody) return;

        tbody.innerHTML = operacoes.map(operacao => `
            <tr>
                <td><strong>${operacao.numero}</strong></td>
                <td>${operacao.tipo}</td>
                <td>${this.formatCurrency(operacao.capital.total)}</td>
                <td>${operacao.taxa.nominal}%</td>
                <td>${this.getStatusBadge(operacao.status)}</td>
                <td>${this.formatDate(operacao.dataCriacao)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewOperacao('${operacao._id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="aprovarOperacao('${operacao._id}')" ${operacao.status !== 'PENDENTE' ? 'disabled' : ''}>
                            <i class="bi bi-check-circle"></i>
                        </button>
                        <button class="btn btn-outline-info btn-sm" onclick="integrarOperacao('${operacao._id}')" ${operacao.status !== 'APROVADA' ? 'disabled' : ''}>
                            <i class="bi bi-arrow-right-circle"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination(pagination, elementId) {
        const paginationElement = document.getElementById(elementId);
        if (!paginationElement) return;

        const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'tabindex="-1"' : ''}>
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'tabindex="-1"' : ''}>
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `;

        paginationElement.innerHTML = paginationHTML;
    }

    async handleFileUpload() {
        const fileInput = document.getElementById('planilha');
        const file = fileInput.files[0];

        if (!file) {
            this.showAlert('Por favor, selecione um arquivo', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('planilha', file);

        try {
            this.showLoading();
            
            const response = await fetch('/api/upload/excel', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showUploadResults(data.data);
                this.showAlert('Planilha processada com sucesso!', 'success');
                fileInput.value = '';
            } else {
                this.showAlert(data.message || 'Erro ao processar planilha', 'danger');
            }
        } catch (error) {
            console.error('Erro no upload:', error);
            this.showAlert('Erro ao fazer upload do arquivo', 'danger');
        } finally {
            this.hideLoading();
        }
    }

    showUploadResults(results) {
        const resultsDiv = document.getElementById('uploadResults');
        const contentDiv = document.getElementById('uploadResultsContent');
        
        if (!resultsDiv || !contentDiv) return;

        const { total, processadas, erros, detalhes } = results;

        contentDiv.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h5>Total</h5>
                            <h3>${total}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <h5>Processadas</h5>
                            <h3>${processadas}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-danger text-white">
                        <div class="card-body text-center">
                            <h5>Erros</h5>
                            <h3>${erros}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h5>Taxa Sucesso</h5>
                            <h3>${total > 0 ? Math.round((processadas / total) * 100) : 0}%</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            ${erros > 0 ? `
                <div class="mt-4">
                    <h6>Detalhes dos Erros:</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Linha</th>
                                    <th>Erro</th>
                                    <th>Dados</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${detalhes.filter(d => d.erro).map(d => `
                                    <tr>
                                        <td>${d.linha}</td>
                                        <td><span class="text-danger">${d.erro}</span></td>
                                        <td><small>${JSON.stringify(d.dados)}</small></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
        `;

        resultsDiv.style.display = 'block';
    }

    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    }

    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.querySelector('.container-fluid');
        container.insertBefore(alertDiv, container.firstChild);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    getStatusBadge(status) {
        const statusMap = {
            'PENDENTE': 'warning',
            'EM_PROCESSAMENTO': 'info',
            'INTEGRADA': 'success',
            'APROVADA': 'success',
            'REJEITADA': 'danger',
            'ERRO': 'danger',
            'CANCELADA': 'secondary',
            'ATIVO': 'success',
            'BLOQUEADO': 'danger',
            'INATIVO': 'secondary'
        };

        const badgeClass = statusMap[status] || 'secondary';
        return `<span class="badge bg-${badgeClass}">${status}</span>`;
    }

    formatCurrency(value) {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    loadInitialData() {
        // Load any additional initial data if needed
    }
}

// Global functions for onclick handlers
function showIntegrarOrden() {
    console.log('=== showIntegrarOrden chamado ===');
    console.log('Verificando se Bootstrap está disponível...');
    
    if (typeof bootstrap === 'undefined') {
        console.error('❌ Bootstrap não está disponível!');
        alert('Erro: Bootstrap não foi carregado. Verifique o console para mais detalhes.');
        return;
    }
    
    console.log('✅ Bootstrap está disponível');
    
    try {
        const modalElement = document.getElementById('integrarOrdenModal');
        if (!modalElement) {
            console.error('❌ Modal integrarOrdenModal não encontrado no DOM');
            return;
        }
        console.log('✅ Modal encontrado, abrindo...');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        console.log('✅ Modal aberto com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao abrir modal integrarOrden:', error);
        alert('Erro ao abrir modal: ' + error.message);
    }
}

function showNovaOrdem() {
    console.log('=== showNovaOrdem chamado ===');
    console.log('Verificando se Bootstrap está disponível...');
    
    if (typeof bootstrap === 'undefined') {
        console.error('❌ Bootstrap não está disponível!');
        alert('Erro: Bootstrap não foi carregado. Verifique o console para mais detalhes.');
        return;
    }
    
    console.log('✅ Bootstrap está disponível');
    
    try {
        const modalElement = document.getElementById('novaOrdemModal');
        if (!modalElement) {
            console.error('❌ Modal novaOrdemModal não encontrado no DOM');
            return;
        }
        console.log('✅ Modal encontrado, abrindo...');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        console.log('✅ Modal aberto com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao abrir modal novaOrdem:', error);
        alert('Erro ao abrir modal: ' + error.message);
    }
}

function showNuevoCliente() {
    console.log('=== showNuevoCliente chamado ===');
    console.log('Verificando se Bootstrap está disponível...');
    
    if (typeof bootstrap === 'undefined') {
        console.error('❌ Bootstrap não está disponível!');
        alert('Erro: Bootstrap não foi carregado. Verifique o console para mais detalhes.');
        return;
    }
    
    console.log('✅ Bootstrap está disponível');
    console.log('Bootstrap version:', bootstrap.VERSION || 'versão não detectada');
    
    try {
        console.log('Procurando modal nuevoClienteModal...');
        const modalElement = document.getElementById('nuevoClienteModal');
        
        if (!modalElement) {
            console.error('❌ Modal nuevoClienteModal não encontrado no DOM');
            console.log('Elementos com ID "nuevoClienteModal":', document.querySelectorAll('#nuevoClienteModal'));
            alert('Erro: Modal não encontrado. Verifique o console para mais detalhes.');
            return;
        }
        
        console.log('✅ Modal encontrado:', modalElement);
        console.log('Classes do modal:', modalElement.className);
        console.log('Atributos do modal:', modalElement.attributes);
        
        console.log('Criando instância do modal Bootstrap...');
        const modal = new bootstrap.Modal(modalElement);
        console.log('✅ Instância do modal criada:', modal);
        
        console.log('Abrindo modal...');
        modal.show();
        console.log('✅ Modal aberto com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal nuevoCliente:', error);
        console.error('Stack trace:', error.stack);
        alert('Erro ao abrir modal: ' + error.message);
    }
}

function showUploadExcel() {
    app.showSection('upload');
}

function integrarOrden() {
    const numero = document.getElementById('ordenNumero').value;
    if (!numero) {
        app.showAlert('Por favor, insira o número da ordem', 'warning');
        return;
    }

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('integrarOrdenModal'));
    modal.hide();

    // Show loading and process
    app.showLoading();
    
    // Simulate integration process
    setTimeout(() => {
        app.hideLoading();
        app.showAlert(`Ordem ${numero} integrada com sucesso!`, 'success');
        app.loadDashboard();
    }, 2000);
}

function criarNovaOrdem() {
    console.log('criarNovaOrdem chamado');
    
    try {
        // Obter valores diretamente dos campos
        const numero = parseInt(document.getElementById('ordenNumeroOrdem').value);
        const clienteCodigo = parseInt(document.getElementById('clienteCodigoOrdem').value);
        const taxa = parseFloat(document.getElementById('taxa').value);
        const gastos = parseFloat(document.getElementById('gastos').value);
        const sector = document.getElementById('sector').value;
        const linhaAfectada = document.getElementById('linhaAfectada').value;
        const cobrarSeguro = document.getElementById('cobrarSeguro').checked;
        
        console.log('Valores obtidos:', { numero, clienteCodigo, taxa, gastos, sector, linhaAfectada, cobrarSeguro });
        
        const ordemData = {
            numero: numero,
            cliente: {
                codigo: clienteCodigo
            },
            taxa: taxa,
            gastos: {
                total: gastos
            },
            sector: sector,
            linhaAfectada: linhaAfectada,
            seguro: {
                cobrar: cobrarSeguro
            }
        };

        // Validate required fields
        if (!ordemData.numero || !ordemData.cliente.codigo || !ordemData.taxa || !ordemData.gastos.total) {
            app.showAlert('Por favor, preencha todos os campos obrigatórios', 'warning');
            return;
        }

        // Validação específica para taxa
        if (ordemData.taxa < 0 || ordemData.taxa > 100) {
            app.showAlert('Taxa deve estar entre 0 e 100%', 'warning');
            return;
        }

        console.log('Dados da ordem válidos, enviando para API...');

        // Create order
        fetch('/api/ordens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ordemData)
        })
        .then(response => {
            console.log('Resposta da API:', response);
            return response.json();
        })
        .then(data => {
            console.log('Dados da resposta:', data);
            if (data.success) {
                app.showAlert('Ordem criada com sucesso!', 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('novaOrdemModal'));
                modal.hide();
                
                // Limpar formulário
                document.getElementById('ordenNumeroOrdem').value = '';
                document.getElementById('clienteCodigoOrdem').value = '';
                document.getElementById('taxa').value = '';
                document.getElementById('gastos').value = '';
                document.getElementById('sector').value = 'PERSONAL';
                document.getElementById('linhaAfectada').value = 'ENDOSANTE';
                document.getElementById('cobrarSeguro').checked = false;
                
                app.loadDashboard();
            } else {
                // Exibir mensagem de erro específica da API
                let errorMessage = data.message || 'Erro ao criar ordem';
                
                // Se houver erros específicos, mostrar o primeiro
                if (data.errors && data.errors.length > 0) {
                    const firstError = data.errors[0];
                    errorMessage = `${firstError.msg} (${firstError.path}: ${firstError.value})`;
                }
                
                app.showAlert(errorMessage, 'danger');
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            app.showAlert('Erro ao criar ordem', 'danger');
        });
        
    } catch (error) {
        console.error('Erro na função criarNovaOrdem:', error);
        app.showAlert('Erro interno ao criar ordem', 'danger');
    }
}

function criarNuevoCliente() {
    console.log('criarNuevoCliente chamado');
    
    try {
        // Obter valores diretamente dos campos
        const codigo = parseInt(document.getElementById('clienteCodigoCliente').value);
        const nome = document.getElementById('clienteNome').value;
        const tipoPessoa = document.getElementById('tipoPessoa').value;
        const cpfCnpj = document.getElementById('cpfCnpj').value;
        const sucursalCodigo = document.getElementById('sucursalCodigo').value;
        const sucursalNome = document.getElementById('sucursalNome').value;
        
        console.log('Valores obtidos:', { codigo, nome, tipoPessoa, cpfCnpj, sucursalCodigo, sucursalNome });
        
        const clienteData = {
            codigo: codigo,
            nome: nome,
            tipoPessoa: tipoPessoa,
            cpfCnpj: cpfCnpj,
            sucursal: {
                codigo: sucursalCodigo,
                nome: sucursalNome
            }
        };

        // Validate required fields
        if (!clienteData.codigo || !clienteData.nome || !clienteData.tipoPessoa || !clienteData.cpfCnpj || !clienteData.sucursal.codigo || !clienteData.sucursal.nome) {
            app.showAlert('Por favor, preencha todos os campos obrigatórios', 'warning');
            return;
        }

        console.log('Dados do cliente válidos, enviando para API...');

        // Create client
        fetch('/api/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(clienteData)
        })
        .then(response => {
            console.log('Resposta da API:', response);
            return response.json();
        })
        .then(data => {
            console.log('Dados da resposta:', data);
            if (data.success) {
                app.showAlert('Cliente criado com sucesso!', 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('nuevoClienteModal'));
                modal.hide();
                
                // Limpar formulário
                document.getElementById('clienteCodigoCliente').value = '';
                document.getElementById('clienteNome').value = '';
                document.getElementById('tipoPessoa').value = '';
                document.getElementById('cpfCnpj').value = '';
                document.getElementById('sucursalCodigo').value = '';
                document.getElementById('sucursalNome').value = '';
                
                app.loadClientes(); // Recarregar lista de clientes
            } else {
                // Exibir mensagem de erro específica da API
                let errorMessage = data.message || 'Erro ao criar cliente';
                
                // Se houver erros específicos, mostrar o primeiro
                if (data.errors && data.errors.length > 0) {
                    const firstError = data.errors[0];
                    errorMessage = `${firstError.msg} (${firstError.path}: ${firstError.value})`;
                }
                
                app.showAlert(errorMessage, 'danger');
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            app.showAlert('Erro ao criar cliente', 'danger');
        });
        
    } catch (error) {
        console.error('Erro na função criarNuevoCliente:', error);
        app.showAlert('Erro interno ao criar cliente', 'danger');
    }
}

function filtrarOrdens() {
    app.loadOrdens(1);
}

function changePage(page) {
    if (page < 1) return;
    app.currentPage = page;
    app.loadOrdens(page);
}

// Additional functions for table actions
function viewOrdem(numero) {
    app.showAlert(`Visualizando ordem ${numero}`, 'info');
}

function integrarOrdem(numero) {
    app.showLoading();
    
    fetch(`/api/ordens/${numero}/integrar`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            app.showAlert(`Integração da ordem ${numero} iniciada!`, 'success');
            app.loadOrdens(app.currentPage);
        } else {
            app.showAlert(data.message || 'Erro ao integrar ordem', 'danger');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        app.showAlert('Erro ao integrar ordem', 'danger');
    })
    .finally(() => {
        app.hideLoading();
    });
}

function editOrdem(numero) {
    app.showAlert(`Editando ordem ${numero}`, 'info');
}

function cancelarOrdem(numero) {
    if (confirm(`Tem certeza que deseja cancelar a ordem ${numero}?`)) {
        fetch(`/api/ordens/${numero}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                app.showAlert(`Ordem ${numero} cancelada com sucesso!`, 'success');
                app.loadOrdens(app.currentPage);
            } else {
                app.showAlert(data.message || 'Erro ao cancelar ordem', 'danger');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            app.showAlert('Erro ao cancelar ordem', 'danger');
        });
    }
}

function viewCliente(codigo) {
    app.showAlert(`Visualizando cliente ${codigo}`, 'info');
}

function editCliente(codigo) {
    app.showAlert(`Editando cliente ${codigo}`, 'info');
}

function desativarCliente(codigo) {
    if (confirm(`Tem certeza que deseja desativar o cliente ${codigo}?`)) {
        fetch(`/api/clientes/${codigo}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                app.showAlert(`Cliente ${codigo} desativado com sucesso!`, 'success');
                app.loadClientes();
            } else {
                app.showAlert(data.message || 'Erro ao desativar cliente', 'danger');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            app.showAlert('Erro ao desativar cliente', 'danger');
        });
    }
}

function viewCheque(id) {
    app.showAlert(`Visualizando cheque ${id}`, 'info');
}

function aprovarCheque(id) {
    fetch(`/api/cheques/${id}/aprovar`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            app.showAlert('Cheque aprovado com sucesso!', 'success');
            app.loadCheques();
        } else {
            app.showAlert(data.message || 'Erro ao aprovar cheque', 'danger');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        app.showAlert('Erro ao aprovar cheque', 'danger');
    });
}

function rejeitarCheque(id) {
    const motivo = prompt('Motivo da rejeição:');
    if (motivo) {
        fetch(`/api/cheques/${id}/rejeitar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motivo })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                app.showAlert('Cheque rejeitado com sucesso!', 'success');
                app.loadCheques();
            } else {
                app.showAlert(data.message || 'Erro ao rejeitar cheque', 'danger');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            app.showAlert('Erro ao rejeitar cheque', 'danger');
        });
    }
}

function viewOperacao(id) {
    app.showAlert(`Visualizando operação ${id}`, 'info');
}

function aprovarOperacao(id) {
    fetch(`/api/operacoes/${id}/aprovar`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            app.showAlert('Operação aprovada com sucesso!', 'success');
            app.loadOperacoes();
        } else {
            app.showAlert(data.message || 'Erro ao aprovar operação', 'danger');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        app.showAlert('Erro ao aprovar operação', 'danger');
    });
}

function integrarOperacao(id) {
    app.showLoading();
    
    fetch(`/api/operacoes/${id}/integrar`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            app.showAlert(`Integração da operação iniciada!`, 'success');
            app.loadOperacoes();
        } else {
            app.showAlert(data.message || 'Erro ao integrar operação', 'danger');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        app.showAlert('Erro ao integrar operação', 'danger');
    })
    .finally(() => {
        app.hideLoading();
    });
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM Content Loaded ===');
    
    // Verificar se o Bootstrap está disponível
    if (typeof bootstrap === 'undefined') {
        console.error('❌ Bootstrap não está carregado!');
        console.error('Verifique se o CDN está acessível e se não há bloqueios de CSP');
        alert('Erro: Bootstrap não foi carregado. Verifique a conexão com a internet e o console para mais detalhes.');
        return;
    }
    
    console.log('✅ Bootstrap carregado com sucesso');
    console.log('Bootstrap version:', bootstrap.VERSION || 'versão não detectada');
    console.log('Bootstrap Modal disponível:', typeof bootstrap.Modal !== 'undefined');
    console.log('Bootstrap disponível:', bootstrap);
    
    console.log('Inicializando FinanSysApp...');
    
    try {
        app = new FinanSysApp();
        console.log('✅ FinanSysApp inicializada com sucesso');
        
        // Testar se os modais estão no DOM
        console.log('Verificando modais no DOM...');
        const modais = ['integrarOrdenModal', 'novaOrdemModal', 'nuevoClienteModal'];
        modais.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                console.log(`✅ Modal ${modalId} encontrado`);
            } else {
                console.error(`❌ Modal ${modalId} NÃO encontrado`);
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao inicializar FinanSysApp:', error);
        console.error('Stack trace:', error.stack);
        alert('Erro ao inicializar a aplicação. Verifique o console para mais detalhes.');
    }
});
