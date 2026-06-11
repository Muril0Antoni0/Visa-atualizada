document.addEventListener('DOMContentLoaded', () => {
    const processesContainer = document.getElementById('processes-container');
    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');
    const filterTipo = document.getElementById('filter-tipo');
    const filterPrioridade = document.getElementById('filter-prioridade');

    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statPendentes = document.getElementById('stat-pendentes');
    const statAnalise = document.getElementById('stat-analise');
    const statCriticos = document.getElementById('stat-críticos');

    // Modal Elements
    const detailsModal = document.getElementById('details-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const modalProcessTitle = document.getElementById('modal-process-title');
    const modalProcessId = document.getElementById('modal-process-id');
    const modalCnpj = document.getElementById('modal-cnpj');
    const modalTipo = document.getElementById('modal-tipo');
    const modalStatus = document.getElementById('modal-status');
    const modalRisco = document.getElementById('modal-risco');
    const modalDocList = document.getElementById('modal-doc-list');

    // Modal Document View & Tabs
    const tabOcr = document.getElementById('tab-ocr');
    const tabReport = document.getElementById('tab-report');
    const panelOcr = document.getElementById('panel-ocr');
    const panelReport = document.getElementById('panel-report');
    const panelDocType = document.getElementById('panel-doc-type');
    const panelDocStatus = document.getElementById('panel-doc-status');
    const panelOcrText = document.getElementById('panel-ocr-text');
    const reportContent = document.getElementById('report-content');
    const btnPrintReport = document.getElementById('btn-print-report');

    // Document Auditor Action Buttons
    const btnDocApprove = document.getElementById('btn-doc-approve');
    const btnDocReject = document.getElementById('btn-doc-reject');

    // Process Auditor Action Buttons
    const btnProcessApprove = document.getElementById('btn-process-approve');
    const btnProcessDiligence = document.getElementById('btn-process-diligence');

    // State Variables
    let processos = [];
    let activeProcess = null;
    let activeDocumentIndex = null;

    // --- 1. MOCK DATA PADRÃO (Baseado na especificação original) ---
    const defaultProcessos = [
        {
            id: "VISA-R2T5W9",
            nome: "Clínica Estética Bella Vita",
            cnpj: "42.188.752/0001-92",
            tipo: "Estético",
            status: "Diligência",
            risco: "Crítico (94)",
            risco_class: "critical",
            data: "27/04/2026",
            completude: 37,
            documentos: [
                { tipo: "Contrato Social", nome_arquivo: "contrato_social_bellavita.pdf", status: "Conforme", score: 94, texto: "CONTRATO SOCIAL DE CONSTITUIÇÃO\nBella Vita Estética e Saúde Ltda\nObjeto Social: Serviços de beleza, estética, depilação e procedimentos invasivos leves.\nSede: Rua Pará, 150 - Centro, Londrina - PR.\nResponsável Técnico: Dra. Roberta Silva (Esteticista)." },
                { tipo: "Alvará Sanitário", nome_arquivo: "alvara_antigo_bella_vita.pdf", status: "Divergente", score: 32, texto: "ESTADO DO PARANÁ - PREFEITURA DE LONDRINA\nALVARÁ SANITÁRIO Nº 11202/2023\nValidade: 31/12/2023\n[ALERTA DE INCONFORMIDADE]: O documento apresentado está expirado. Validade expirou em 2023. O estabelecimento deve apresentar alvará provisório ou comprovante de petição de renovação anual." },
                { tipo: "Laudo Técnico", nome_arquivo: "laudo_radiacoes.pdf", status: "Conforme", score: 88, texto: "LAUDO DE AVALIAÇÃO TÉCNICA E RADIAÇÃO\nEquipamento de Luz Pulsada e Laser de Diodo.\nLaudo conclui que as blindagens da sala de procedimentos e os óculos de proteção cumprem integralmente as exigências normativas da ANVISA." }
            ]
        },
        {
            id: "VISA-M4XBK2",
            nome: "Restaurante Sabor do Norte",
            cnpj: "15.632.122/0001-44",
            tipo: "Alimentício",
            status: "Pendente",
            risco: "Risco Alto (82)",
            risco_class: "high",
            data: "27/04/2026",
            completude: 62,
            documentos: [
                { tipo: "Contrato Social", nome_arquivo: "contrato_sabor_norte.pdf", status: "Conforme", score: 91, texto: "CONTRATO DE SOCIEDADE LIMITADA\nRestaurante Sabor do Norte Ltda.\nAtividade: Restaurantes e similares, comércio de bebidas e buffet.\nRua Sergipe, 840 - Londrina." },
                { tipo: "Manual de Boas Práticas", nome_arquivo: "manual_higiene_v1.pdf", status: "Divergente", score: 48, texto: "MANUAL DE BOAS PRÁTICAS DE FABRICAÇÃO E MANIPULAÇÃO DE ALIMENTOS\nEstabelecimento: Restaurante Sabor do Norte\n[ALERTA DE INCONFORMIDADE]: A inteligência artificial detectou a ausência das planilhas de controle de temperatura diária dos refrigeradores e freezer de estocagem de pescados, o que viola a RDC 216/04." },
                { tipo: "Comprovante de Endereço", nome_arquivo: "copel_restaurante.pdf", status: "Conforme", score: 99, texto: "FATURA COPEL - COMPANHIA PARANAENSE DE ENERGIA\nCliente: Restaurante Sabor do Norte\nEndereço: Rua Sergipe, 840 - Centro, Londrina - PR." },
                { tipo: "Certificado dos Bombeiros", nome_arquivo: "bombeiros_sabor.pdf", status: "Conforme", score: 87, texto: "CORPO DE BOMBEIROS DA POLÍCIA MILITAR DO PARANÁ\nCERTIFICADO DE LICENCIAMENTO DO CORPO DE BOMBEIROS (CLCB)\nValidade: 10/11/2026\nSistemas contra incêndio aprovados." }
            ]
        },
        {
            id: "VISA-F3G7B2",
            nome: "Hospital São Lucas",
            cnpj: "78.431.990/0001-03",
            tipo: "Saúde",
            status: "Em Análise",
            risco: "Risco Alto (78)",
            risco_class: "high",
            data: "27/04/2026",
            completude: 100,
            documentos: [
                { tipo: "Contrato Social", nome_arquivo: "estatuto_sao_lucas.pdf", status: "Conforme", score: 95, texto: "ESTATUTO SOCIAL DO HOSPITAL SÃO LUCAS DE LONDRINA\nPrestação de serviços médico-hospitalares, pronto-atendimento, cirurgias e UTI." },
                { tipo: "Alvará Sanitário", nome_arquivo: "alvara_2025_hosp.pdf", status: "Conforme", score: 90, texto: "ALVARÁ SANITÁRIO VIGENTE - Validade: 31/12/2025." },
                { tipo: "Laudo Técnico", nome_arquivo: "laudo_radioprotecao.pdf", status: "Conforme", score: 85, texto: "LAUDO TÉCNICO DE RADIOPROTEÇÃO DA SALA DE TOMOGRAFIA." },
                { tipo: "Planta Baixa", nome_arquivo: "planta_arquitetura_hosp.pdf", status: "Conforme", score: 80, texto: "Planta arquitetônica aprovada pelo departamento de engenharia sanitária da prefeitura." },
                { tipo: "Manual de Boas Práticas", nome_arquivo: "manual_esterilizacao_cme.pdf", status: "Conforme", score: 92, texto: "Manual de Boas Práticas do Centro de Material e Esterilização." },
                { tipo: "Comprovante de Endereço", nome_arquivo: "agua_san_lucas.pdf", status: "Conforme", score: 97, texto: "FATURA SANEPAR - COMPANHIA DE SANEAMENTO DO PARANÁ." },
                { tipo: "Licença Ambiental", nome_arquivo: "licenca_iap_hosp.pdf", status: "Divergente", score: 55, texto: "LICENÇA AMBIENTAL SIMPLIFICADA - IAP\n[ALERTA DE INCONFORMIDADE]: Foi identificada divergência no CNPJ da empresa licenciada na folha 2 do documento com o CNPJ cadastrado na Receita Federal para este processo." },
                { tipo: "Certificado dos Bombeiros", nome_arquivo: "vistoria_bombeiros.pdf", status: "Conforme", score: 89, texto: "Certificado de Vistoria do Corpo de Bombeiros em vigor." }
            ]
        },
        {
            id: "VISA-N7P3Q1",
            nome: "Farmácia Vida & Saúde",
            cnpj: "09.112.564/0001-11",
            tipo: "Farmacêutico",
            status: "Em Análise",
            risco: "Risco Médio (45)",
            risco_class: "medium",
            data: "27/04/2026",
            completude: 100,
            documentos: [
                { tipo: "Contrato Social", nome_arquivo: "contrato_farmacia.pdf", status: "Conforme", score: 98, texto: "Contrato de constituição da Farmácia Vida & Saúde Ltda." },
                { tipo: "Alvará Sanitário", nome_arquivo: "alvara_farm.pdf", status: "Conforme", score: 96, texto: "Alvará sanitário da Vigilância de Londrina vigente." },
                { tipo: "Laudo Técnico", nome_arquivo: "laudo_farmaceutico.pdf", status: "Conforme", score: 89, texto: "Laudo técnico de controle de temperatura e armazenamento de termolábeis." },
                { tipo: "Planta Baixa", nome_arquivo: "planta_layout_farmacia.pdf", status: "Conforme", score: 91, texto: "Planta baixa mostrando sala de aplicação de injetáveis e dispensação." },
                { tipo: "Manual de Boas Práticas", nome_arquivo: "boas_praticas_dispensacao.pdf", status: "Conforme", score: 94, texto: "Manual de boas práticas de dispensação de medicamentos e controle de portaria 344/98." },
                { tipo: "Comprovante de Endereço", nome_arquivo: "luz_farmacia.pdf", status: "Conforme", score: 99, texto: "Comprovante de endereço Copel em conformidade." },
                { tipo: "Licença Ambiental", nome_arquivo: "licenca_residuos.pdf", status: "Conforme", score: 88, texto: "Plano de gerenciamento de resíduos de serviços de saúde (PGRSS) homologado." },
                { tipo: "Certificado dos Bombeiros", nome_arquivo: "certificado_bombeiro_farm.pdf", status: "Conforme", score: 90, texto: "Certificado de licenciamento dos Bombeiros ativo." }
            ]
        },
        {
            id: "VISA-J6H4D8",
            nome: "Pet Shop Animal Care",
            cnpj: "31.258.991/0001-08",
            tipo: "Veterinário",
            status: "Pendente",
            risco: "Risco Médio (55)",
            risco_class: "medium",
            data: "27/04/2026",
            completude: 100,
            documentos: [
                { tipo: "Contrato Social", nome_arquivo: "animal_care_contrato.pdf", status: "Conforme", score: 94, texto: "Contrato social de serviços veterinários, banho e tosa." },
                { tipo: "Alvará Sanitário", nome_arquivo: "alvara_vet.pdf", status: "Conforme", score: 86, texto: "Alvará sanitário em renovação." },
                { tipo: "Laudo Técnico", nome_arquivo: "laudo_residuos_pet.pdf", status: "Divergente", score: 58, texto: "DECLARAÇÃO DE DESCARTE DE RESÍDUOS SÓLIDOS DE CLÍNICA VET\n[ALERTA DE INCONFORMIDADE]: Falta assinatura do médico veterinário responsável na folha de encerramento do laudo técnico." },
                { tipo: "Planta Baixa", nome_arquivo: "planta_pet.pdf", status: "Conforme", score: 89, texto: "Planta indicando área de isolamento cirúrgico e recepção separada." },
                { tipo: "Manual de Boas Práticas", nome_arquivo: "manual_banho_tosa.pdf", status: "Conforme", score: 92, texto: "Manual de boas práticas de higiene e desinfecção de gaiolas." },
                { tipo: "Comprovante de Endereço", nome_arquivo: "copel_pet.pdf", status: "Conforme", score: 97, texto: "Fatura de luz Copel." },
                { tipo: "Licença Ambiental", nome_arquivo: "licenca_iap_pet.pdf", status: "Conforme", score: 85, texto: "Dispensa de licença ambiental estadual emitida." },
                { tipo: "Certificado dos Bombeiros", nome_arquivo: "bombeiros_pet.pdf", status: "Conforme", score: 90, texto: "Laudo técnico de vistoria dos bombeiros ativo." }
            ]
        },
        {
            id: "VISA-K8L1M5",
            nome: "Padaria Pão de Ouro",
            cnpj: "21.654.987/0001-50",
            tipo: "Alimentício",
            status: "Aprovado",
            risco: "Risco Baixo (12)",
            risco_class: "low",
            data: "27/04/2026",
            completude: 100,
            documentos: [
                { tipo: "Contrato Social", nome_arquivo: "contrato_padaria.pdf", status: "Conforme", score: 97, texto: "Constituição da Panificadora Pão de Ouro Ltda." },
                { tipo: "Alvará Sanitário", nome_arquivo: "alvara_padaria.pdf", status: "Conforme", score: 95, texto: "Alvará sanitário municipal vigente." },
                { tipo: "Laudo Técnico", nome_arquivo: "laudo_limpeza_caixa.pdf", status: "Conforme", score: 98, texto: "Laudo técnico de limpeza e desinfecção periódica do reservatório de água." },
                { tipo: "Planta Baixa", nome_arquivo: "planta_producao_padaria.pdf", status: "Conforme", score: 86, texto: "Planta da área de panificação e atendimento." },
                { tipo: "Manual de Boas Práticas", nome_arquivo: "manual_manipuladores.pdf", status: "Conforme", score: 93, texto: "Manual de controle higiênico-sanitário para manipuladores de alimentos." },
                { tipo: "Comprovante de Endereço", nome_arquivo: "sanepar_padaria.pdf", status: "Conforme", score: 98, texto: "Fatura Sanepar." },
                { tipo: "Licença Ambiental", nome_arquivo: "licenca_padaria.pdf", status: "Conforme", score: 92, texto: "Licença ambiental simplificada." },
                { tipo: "Certificado dos Bombeiros", nome_arquivo: "bombeiros_padaria.pdf", status: "Conforme", score: 91, texto: "Certificado de licenciamento dos Bombeiros vigente." }
            ]
        }
    ];

    // --- 2. CARREGAR E INICIALIZAR PROCESSOS ---
    async function inicializarProcessos() {
        try {
            // Tenta carregar da API
            const response = await fetch('/api/processos');
            if (response.ok) {
                const data = await response.json();
                processos = data.processos || [];
            } else {
                // Se a API falhar, tenta do localStorage
                const salvos = localStorage.getItem('visa_processos');
                if (salvos) {
                    processos = JSON.parse(salvos);
                } else {
                    processos = defaultProcessos;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar processos da API:', error);
            // Fallback para localStorage
            const salvos = localStorage.getItem('visa_processos');
            if (salvos) {
                processos = JSON.parse(salvos);
            } else {
                processos = defaultProcessos;
            }
        }
        
        renderizarGrid();
        renderizarEstatisticas();
    }

    // --- 3. RENDERIZAR INDICADORES ---
    function renderizarEstatisticas() {
        statTotal.innerText = processos.length;
        
        const pendentes = processos.filter(p => p.status === 'Diligência').length;
        statPendentes.innerText = pendentes;
        
        const analise = processos.filter(p => p.status === 'Em Análise' || p.status === 'Pendente').length;
        statAnalise.innerText = analise;
        
        const criticos = processos.filter(p => p.risco_class === 'critical' || p.risco_class === 'high').length;
        statCriticos.innerText = criticos;
    }

    // --- 4. RENDERIZAR GRID DE PROCESSOS ---
    function renderizarGrid() {
        processesContainer.innerHTML = '';

        // Filtros ativos
        const query = searchInput.value.toLowerCase().trim();
        const statusVal = filterStatus.value;
        const tipoVal = filterTipo.value;
        const prioridadeVal = filterPrioridade.value; // prioridade mapeia com risco_class

        const processosFiltrados = processos.filter(p => {
            const matchesQuery = p.nome.toLowerCase().includes(query) || p.id.toLowerCase().includes(query);
            const matchesStatus = statusVal === "" || p.status === statusVal;
            const matchesTipo = tipoVal === "" || p.tipo === tipoVal;
            const matchesPrioridade = prioridadeVal === "" || p.risco_class === prioridadeVal;

            return matchesQuery && matchesStatus && matchesTipo && matchesPrioridade;
        });

        if (processosFiltrados.length === 0) {
            processesContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fa-regular fa-folder-open"></i>
                    <h4>Nenhum processo localizado</h4>
                    <p>Experimente alterar os termos de busca ou remover os filtros aplicados.</p>
                </div>
            `;
            return;
        }

        processosFiltrados.forEach(p => {
            const card = document.createElement('div');
            card.className = 'process-card animate-slide';
            
            // Determina as classes e ícones dos badges
            let statusBadgeClass = 'badge-light-outline';
            let statusIcon = 'fa-clock';
            if (p.status === 'Em Análise') {
                statusBadgeClass = 'badge-primary-outline';
                statusIcon = 'fa-circle-play';
            } else if (p.status === 'Diligência') {
                statusBadgeClass = 'badge-warning-outline';
                statusIcon = 'fa-clock-rotate-left';
            } else if (p.status === 'Aprovado') {
                statusBadgeClass = 'badge-success-outline';
                statusIcon = 'fa-circle-check';
            }

            let riscoBadgeClass = 'badge-light-outline';
            let riscoIcon = 'fa-shield';
            if (p.risco_class === 'critical') {
                riscoBadgeClass = 'badge-danger-outline';
                riscoIcon = 'fa-triangle-exclamation';
            } else if (p.risco_class === 'high') {
                riscoBadgeClass = 'badge-warning-outline';
                riscoIcon = 'fa-triangle-exclamation';
            } else if (p.risco_class === 'medium') {
                riscoBadgeClass = 'badge-primary-outline';
                riscoIcon = 'fa-shield-halved';
            } else if (p.risco_class === 'low') {
                riscoBadgeClass = 'badge-success-outline';
                riscoIcon = 'fa-shield-check';
            }

            card.innerHTML = `
                <div>
                    <div class="process-header">
                        <div class="process-icon-box">
                            <i class="fa-solid fa-building"></i>
                        </div>
                        <div class="process-title-area">
                            <h4>${p.nome}</h4>
                            <span class="process-id">${p.id}</span>
                        </div>
                    </div>
                    
                    <div class="process-badges">
                        <span class="badge ${statusBadgeClass}"><i class="fa-regular ${statusIcon} mr-1"></i> ${p.status}</span>
                        <span class="badge ${riscoBadgeClass}"><i class="fa-solid ${riscoIcon} mr-1"></i> ${p.risco}</span>
                    </div>
                </div>

                <div>
                    <div class="process-meta">
                        <div class="meta-item"><i class="fa-regular fa-file-lines"></i><span>${p.tipo}</span></div>
                        <div class="meta-item"><i class="fa-regular fa-calendar"></i><span>${p.data}</span></div>
                    </div>
                    
                    <div class="process-progress">
                        <div class="progress-header">
                            <span class="font-weight-500 text-sm">Completude</span>
                            <span class="font-weight-600 text-sm">${p.completude}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${p.completude}%;"></div>
                        </div>
                    </div>
                </div>
            `;

            // Clique abre o modal
            card.addEventListener('click', () => abrirModal(p));
            processesContainer.appendChild(card);
        });
    }

    // --- 5. DETALHES DO MODAL E INTERAÇÕES ---
    function abrirModal(p) {
        activeProcess = p;
        
        modalProcessTitle.innerText = p.nome;
        modalProcessId.innerText = p.id;
        modalCnpj.innerText = p.cnpj || 'Não informado';
        modalTipo.innerText = p.tipo;
        modalStatus.innerText = p.status;
        modalRisco.innerText = p.risco;
        
        // Estiliza a cor do status no modal
        modalStatus.className = 'font-weight-600 text-sm';
        if (p.status === 'Aprovado') modalStatus.style.color = 'var(--success)';
        else if (p.status === 'Diligência') modalStatus.style.color = 'var(--warning)';
        else modalStatus.style.color = 'var(--primary-light)';

        renderModalDocumentos();
        
        // Exibe modal e reseta para a aba OCR padrão
        detailsModal.style.display = 'flex';
        ativarAbaOcr();
        
        // Seleciona o primeiro documento por padrão se houver
        if (p.documentos && p.documentos.length > 0) {
            selecionarDocumento(0);
        } else {
            panelDocType.innerText = "Nenhum documento anexado";
            panelDocStatus.style.display = 'none';
            panelOcrText.value = "Nenhum documento foi enviado por esta empresa.";
            btnDocApprove.disabled = true;
            btnDocReject.disabled = true;
        }
    }

    function renderModalDocumentos() {
        modalDocList.innerHTML = '';
        
        activeProcess.documentos.forEach((doc, idx) => {
            const li = document.createElement('li');
            li.className = `doc-item-modal ${idx === activeDocumentIndex ? 'active' : ''}`;
            
            const isConforme = doc.status === 'Conforme' || doc.status === 'Aprovado';
            const icon = isConforme ? 'fa-circle-check' : 'fa-circle-exclamation';
            const color = isConforme ? 'var(--success)' : 'var(--warning)';
            
            li.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fa-solid ${icon}" style="color: ${color};"></i>
                    <div>
                        <strong style="color:white; font-size:13px; display:block;">${doc.tipo}</strong>
                        <span style="color:var(--text-muted); font-size:11px;">${doc.nome_arquivo}</span>
                    </div>
                </div>
                <span class="badge ${isConforme ? 'badge-success-outline' : 'badge-warning-outline'}" style="font-size: 9px; padding: 2px 6px;">
                    ${doc.status}
                </span>
            `;
            
            li.addEventListener('click', () => selecionarDocumento(idx));
            modalDocList.appendChild(li);
        });
    }

    function selecionarDocumento(idx) {
        activeDocumentIndex = idx;
        
        // Atualiza a seleção visual
        document.querySelectorAll('.doc-item-modal').forEach((li, i) => {
            li.classList.toggle('active', i === idx);
        });

        const doc = activeProcess.documentos[idx];
        
        panelDocType.innerText = doc.tipo;
        panelDocStatus.style.display = 'inline-flex';
        panelDocStatus.innerText = doc.status;
        
        const isConforme = doc.status === 'Conforme' || doc.status === 'Aprovado';
        panelDocStatus.className = `badge ${isConforme ? 'badge-success-outline' : 'badge-warning-outline'}`;
        
        panelOcrText.value = doc.texto || "Nenhum texto pôde ser lido pela IA para este documento.";
        
        btnDocApprove.disabled = false;
        btnDocReject.disabled = false;
    }

    // Ações dos botões de auditoria de documento individual
    btnDocApprove.addEventListener('click', () => {
        if (activeProcess && activeDocumentIndex !== null) {
            activeProcess.documentos[activeDocumentIndex].status = "Aprovado";
            salvarAlteracoesProcesso();
            renderModalDocumentos();
            selecionarDocumento(activeDocumentIndex);
        }
    });

    btnDocReject.addEventListener('click', () => {
        if (activeProcess && activeDocumentIndex !== null) {
            activeProcess.documentos[activeDocumentIndex].status = "Recusado";
            salvarAlteracoesProcesso();
            renderModalDocumentos();
            selecionarDocumento(activeDocumentIndex);
        }
    });

    // Ações de alteração de status do processo geral
    btnProcessApprove.addEventListener('click', () => {
        if (activeProcess) {
            activeProcess.status = "Aprovado";
            activeProcess.risco = "Risco Baixo (0)";
            activeProcess.risco_class = "low";
            modalStatus.innerText = "Aprovado";
            modalStatus.style.color = 'var(--success)';
            modalRisco.innerText = "Risco Baixo (0)";
            
            salvarAlteracoesProcesso();
            inicializarProcessos(); // Recarrega estatísticas e grids
        }
    });

    btnProcessDiligence.addEventListener('click', () => {
        if (activeProcess) {
            activeProcess.status = "Diligência";
            modalStatus.innerText = "Diligência";
            modalStatus.style.color = 'var(--warning)';
            
            salvarAlteracoesProcesso();
            inicializarProcessos();
        }
    });

    function salvarAlteracoesProcesso() {
        const index = processos.findIndex(p => p.id === activeProcess.id);
        if (index > -1) {
            processos[index] = activeProcess;
            localStorage.setItem('visa_processos', JSON.stringify(processos));
        }
    }

    // --- 6. GERAÇÃO DO PRÉ-RELATÓRIO DE IA ---
    function gerarPreRelatorio() {
        if (!activeProcess) return;

        const dataEmissao = new Date().toLocaleDateString('pt-BR');
        let docsHTML = "";
        let alertasHTML = "";
        let inconformidadesCount = 0;

        activeProcess.documentos.forEach(doc => {
            const isRecusado = doc.status === 'Recusado' || doc.status === 'Divergente';
            if (isRecusado) {
                inconformidadesCount++;
                alertasHTML += `
                    <div style="background-color: #fef2f2; border-left: 4px solid var(--danger); padding: 12px; margin-bottom: 10px; border-radius: 4px;">
                        <strong>⚠️ Inconformidade no ${doc.tipo}:</strong><br>
                        O arquivo <em>${doc.nome_arquivo}</em> foi marcado como divergente pela IA ou recusado pelo analista.<br>
                        <strong>Evidências detectadas:</strong> O texto de conformidade de alvará/laudos contém alertas de expiração de validade, falta de dados de CNPJ ou assinaturas ausentes.
                    </div>
                `;
            }

            docsHTML += `
                <div style="border-bottom: 1px solid #e2e8f0; padding: 8px 0;">
                    <strong>Documento:</strong> ${doc.tipo} <br>
                    <strong>Arquivo:</strong> <em>${doc.nome_arquivo}</em><br>
                    <strong>Validação IA:</strong> 
                    <span style="color: ${isRecusado ? 'red' : 'green'}; font-weight: bold;">
                        ${doc.status} (${doc.score}% de confiança)
                    </span>
                </div>
            `;
        });

        let parecerRecomendacao = "";
        if (inconformidadesCount > 0) {
            parecerRecomendacao = `
                <p style="color: #991b1b; font-weight: bold; background-color: #fef2f2; padding: 12px; border-radius:6px; border: 1px solid #fca5a5;">
                    ⚠️ PARECER: REPROVADO PROVISORIAMENTE / SOLICITAÇÃO DE DILIGÊNCIA<br>
                    Foram identificadas ${inconformidadesCount} pendências documentais críticas. Recomenda-se a emissão de notificação de diligência sanitária com prazo de 15 dias para adequação da empresa antes de uma nova auditoria automática.
                </p>
            `;
        } else {
            parecerRecomendacao = `
                <p style="color: #065f46; font-weight: bold; background-color: #ecfdf5; padding: 12px; border-radius:6px; border: 1px solid #a7f3d0;">
                    ✅ PARECER: DEFERIDO / APTO PARA ALVARÁ SANITÁRIO<br>
                    Todos os documentos obrigatórios foram analisados pelo motor de IA e homologados pela auditoria humana, estando em plena conformidade com as diretrizes vigentes do município de Londrina.
                </p>
            `;
        }

        reportContent.innerHTML = `
            <div class="report-header-print">
                <h3>PREFEITURA DO MUNICÍPIO DE LONDRINA</h3>
                <h4>Secretaria Municipal de Saúde — Vigilância Sanitária</h4>
                <p style="font-size:11px; color:#64748b; margin-top:2px;">RELATÓRIO AUTOMÁTICO DE AUDITORIA NORMATIVA — IA VISA</p>
            </div>
            
            <div class="report-section">
                <h4>1. Identificação do Estabelecimento</h4>
                <p><strong>Razão Social:</strong> ${activeProcess.nome}</p>
                <p><strong>CNPJ:</strong> ${activeProcess.cnpj}</p>
                <p><strong>Processo Administrativo:</strong> ${activeProcess.id}</p>
                <p><strong>Atividade Principal:</strong> Licenciamento Sanitário (${activeProcess.tipo})</p>
                <p><strong>Data de Análise:</strong> ${dataEmissao}</p>
            </div>
            
            <div class="report-section">
                <h4>2. Auditoria Documental da IA</h4>
                ${docsHTML}
            </div>
            
            <div class="report-section">
                <h4>3. Alertas e Divergências Identificadas</h4>
                ${alertasHTML || "<p style='color:green;'>Nenhum alerta de inconformidade foi gerado para este processo.</p>"}
            </div>
            
            <div class="report-section">
                <h4>4. Conclusão e Recomendação</h4>
                ${parecerRecomendacao}
            </div>
            
            <div style="margin-top: 40px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 20px; font-size:11px; color:#64748b;">
                <p>Documento assinado e carimbado digitalmente pela Inteligência Artificial da VISA Londrina.</p>
                <p>Londrina, ${dataEmissao}</p>
            </div>
        `;
    }

    // --- 7. CONTROLES DAS ABAS DO MODAL ---
    function ativarAbaOcr() {
        tabOcr.style.backgroundColor = 'var(--primary-color)';
        tabReport.style.backgroundColor = 'transparent';
        panelOcr.style.display = 'flex';
        panelReport.style.display = 'none';
    }

    function ativarAbaReport() {
        tabReport.style.backgroundColor = 'var(--primary-color)';
        tabOcr.style.backgroundColor = 'transparent';
        panelReport.style.display = 'flex';
        panelOcr.style.display = 'none';
        gerarPreRelatorio();
    }

    tabOcr.addEventListener('click', ativarAbaOcr);
    tabReport.addEventListener('click', ativarAbaReport);

    btnPrintReport.addEventListener('click', () => {
        window.print();
    });

    // --- 8. CONTROLES DE FECHAR MODAL ---
    function fecharModal() {
        detailsModal.style.display = 'none';
        activeProcess = null;
        activeDocumentIndex = null;
        inicializarProcessos(); // Garante recarga dos dados alterados
    }

    closeModalBtn.addEventListener('click', fecharModal);
    btnCloseModal.addEventListener('click', fecharModal);
    
    // Fecha clicando fora da caixa do modal
    detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
            fecharModal();
        }
    });

    // --- 9. EVENTOS DE FILTROS E BUSCA ---
    searchInput.addEventListener('input', renderizarGrid);
    filterStatus.addEventListener('change', renderizarGrid);
    filterTipo.addEventListener('change', renderizarGrid);
    filterPrioridade.addEventListener('change', renderizarGrid);

    // Ajuda Toast
    const floatingHelp = document.querySelector('.floating-btn');
    if (floatingHelp) {
        floatingHelp.addEventListener('click', () => {
            alert('VISA Londrina — Canal de Atendimento:\nPara suporte técnico, ligue (43) 3372-9400 ou envie e-mail para vigilanciasanitaria@londrina.pr.gov.br.');
        });
    }

    // --- 10. INICIALIZAÇÃO ---
    inicializarProcessos();
});
