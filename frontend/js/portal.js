document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('form-container')) return;

    const totalSteps = 4;
    let currentStep = 1;

    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnSubmit = document.getElementById('btn-submit');
    const stepIndicators = document.querySelectorAll('.step');
    const uploadZones = document.querySelectorAll('.upload-zone');
    const progressValue = document.querySelector('.progress-value');
    const progressText = document.querySelector('.text-muted.text-sm');

    const totalDocs = 8;
    const mandatoryFiles = {};
    const additionalFiles = [];

    function setFieldError(inputId, errorId, message) {
        const input = document.getElementById(inputId);
        const error = document.getElementById(errorId);

        if (input) {
            input.style.borderColor = 'var(--danger)';
        }

        if (error) {
            error.innerText = message;
            error.style.display = 'block';
        }
    }

    function clearFieldError(inputId, errorId) {
        const input = document.getElementById(inputId);
        const error = document.getElementById(errorId);

        if (input) {
            input.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }

        if (error) {
            error.innerText = '';
            error.style.display = 'none';
        }
    }

    // --- Máscara de CNPJ ---
    const cnpjInput = document.getElementById('cnpj');
    if (cnpjInput) {
        cnpjInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 14) v = v.slice(0, 14);
            if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})$/, "$1.$2.$3/$4-$5");
            else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})$/, "$1.$2.$3/$4");
            else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{1,3})$/, "$1.$2.$3");
            else if (v.length > 2) v = v.replace(/^(\d{2})(\d{1,3})$/, "$1.$2");
            e.target.value = v;
            clearFieldError('cnpj', 'error-cnpj');
        });
    }

    const razaoInput = document.getElementById('razao_social');
    if (razaoInput) {
        razaoInput.addEventListener('input', () => clearFieldError('razao_social', 'error-razao'));
    }

    const tipoEstabelecimento = document.getElementById('tipo_estabelecimento');
    if (tipoEstabelecimento) {
        tipoEstabelecimento.addEventListener('change', () => clearFieldError('tipo_estabelecimento', 'error-tipo'));
    }

    // --- Navegação de Passos ---
    function updateSteps() {
        document.querySelectorAll('.step-content').forEach(s => s.style.display = 'none');
        document.getElementById(`step-${currentStep}`).style.display = 'block';

        stepIndicators.forEach((ind, i) => {
            ind.classList.toggle('active', i < currentStep);
            ind.classList.toggle('completed', i < currentStep - 1);

            // Troca o ícone se completado
            const stepNumEl = ind.querySelector('.step-number');
            if (stepNumEl) {
                if (i < currentStep - 1) {
                    stepNumEl.innerHTML = '<i class="fa-solid fa-check"></i>';
                } else {
                    stepNumEl.innerText = i + 1;
                }
            }
        });

        btnPrev.style.visibility = currentStep === 1 ? 'hidden' : 'visible';

        if (currentStep === totalSteps) {
            btnNext.style.display = 'none';
            btnSubmit.style.display = 'flex';
            updateReviewSection();
        } else {
            btnNext.style.display = 'flex';
            btnSubmit.style.display = 'none';
        }
    }

    btnNext.addEventListener('click', () => {
        if (currentStep === 1 && !validateStep1()) return;
        if (currentStep === 2 && !validateStep2()) {
            alert('Por favor, envie pelo menos 1 documento obrigatório para avançar.');
            return;
        }
        if (currentStep < totalSteps) {
            currentStep++;
            updateSteps();
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateSteps();
        }
    });

    function validateStep1() {
        let valid = true;

        if (!razaoInput || !razaoInput.value.trim()) {
            setFieldError('razao_social', 'error-razao', 'A Razão Social é obrigatória');
            valid = false;
        } else if (razaoInput.value.trim().length < 3) {
            setFieldError('razao_social', 'error-razao', 'A Razão Social deve ter pelo menos 3 caracteres');
            valid = false;
        } else {
            clearFieldError('razao_social', 'error-razao');
        }

        if (!cnpjInput || !cnpjInput.value.trim()) {
            setFieldError('cnpj', 'error-cnpj', 'O CNPJ é obrigatório');
            valid = false;
        } else if (cnpjInput.value.replace(/\D/g, '').length < 14) {
            setFieldError('cnpj', 'error-cnpj', 'O CNPJ deve ter pelo menos 14 dígitos');
            valid = false;
        } else {
            clearFieldError('cnpj', 'error-cnpj');
        }

        if (!tipoEstabelecimento || !tipoEstabelecimento.value) {
            setFieldError('tipo_estabelecimento', 'error-tipo', 'Selecione o tipo de estabelecimento');
            valid = false;
        } else {
            clearFieldError('tipo_estabelecimento', 'error-tipo');
        }

        return valid;
    }

    function validateStep2() {
        // Exige pelo menos 1 documento para avançar
        return Object.keys(mandatoryFiles).length > 0;
    }

    // --- Upload de Documentos com Integração com IA ---
    uploadZones.forEach(zone => {
        if (zone.id === 'upload-adicional') return;
        const input = zone.querySelector('.file-input');
        const docType = zone.getAttribute('data-doc');

        zone.addEventListener('click', (e) => {
            // Se clicou no botão de remover
            if (e.target.classList.contains('btn-remove-file')) {
                e.stopPropagation();
                removeDocument(zone, docType);
                return;
            }
            // Se clicou no link de ver OCR
            if (e.target.classList.contains('ai-details-link') || e.target.closest('.ai-details-link')) {
                e.stopPropagation();
                const preview = zone.querySelector('.ocr-preview-container');
                if (preview) {
                    preview.style.display = preview.style.display === 'none' ? 'block' : 'none';
                }
                return;
            }
            if (input) input.click();
        });

        if (input) {
            input.addEventListener('change', async function () {
                const file = this.files[0];
                if (file) {
                    await processDocumentUpload(zone, docType, file);
                }
            });
        }
    });

    async function processDocumentUpload(zone, docType, file) {
        // Reset classes
        zone.classList.remove('uploaded', 'divergent');
        zone.classList.add('analyzing');

        const zoneDefault = zone.querySelector('.zone-default');
        const zoneUploaded = zone.querySelector('.zone-uploaded');

        zoneDefault.style.display = 'none';
        zoneUploaded.style.display = 'block';

        // Exibe feedback visual de progresso/análise
        zoneUploaded.innerHTML = `
            <div style="padding: 1rem 0;">
                <div class="spinner"></div>
                <p class="font-weight-600 mt-2 text-sm" style="color: var(--info);">Analisando documento...</p>
                <p class="text-xs text-muted mt-1">IA extraindo texto e checando normas...</p>
            </div>
        `;

        try {
            let resultado;
            // Se estiver rodando como página estática sem servidor backend
            if (window.location.protocol === 'file:' || window.location.hostname === '') {
                console.warn("Ambiente local/estático detectado. Simulando análise de IA.");
                resultado = await simularAnaliseIA(file.name, docType);
            } else {
                // Chamada real ao FastAPI
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/documentos/analisar', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error("Erro na comunicação com o servidor de IA");
                }

                resultado = await response.json();
            }

            // Armazena informações do documento
            mandatoryFiles[docType] = {
                file: file,
                texto: resultado.texto,
                status: resultado.status, // "Conforme" ou "Divergente"
                score: resultado.analise_detalhada ? Math.round(resultado.analise_detalhada.score * 100) : 85
            };

            // Renderiza zona com resultados
            renderUploadedZone(zone, docType, file, mandatoryFiles[docType]);

            // Marca o checklist lateral
            const checkItem = document.querySelector(`.checklist-item[data-check="${docType}"]`);
            if (checkItem) {
                checkItem.classList.add('checked');
            }

            updateProgress();

        } catch (error) {
            console.error(error);
            // Fallback de erro
            zone.classList.remove('analyzing');
            zoneDefault.style.display = 'block';
            zoneUploaded.style.display = 'none';
            alert(`Falha ao analisar ${docType}: ${error.message}. Tente novamente.`);
        }
    }

    function renderUploadedZone(zone, docType, file, docData) {
        zone.classList.remove('analyzing');

        const isConforme = docData.status === "Conforme";
        if (isConforme) {
            zone.classList.add('uploaded');
        } else {
            zone.classList.add('divergent');
        }

        const badgeClass = isConforme ? 'ai-badge-success' : 'ai-badge-warning';
        const statusLabel = isConforme ? 'Conforme' : 'Divergente';
        const iconShield = isConforme ? 'fa-shield-check' : 'fa-triangle-exclamation';

        zone.querySelector('.zone-uploaded').innerHTML = `
            <div class="ai-badge ${badgeClass}">
                <i class="fa-solid ${iconShield}"></i> IA: ${statusLabel} (${docData.score}%)
            </div>
            <i class="fa-solid fa-file-pdf" style="color: ${isConforme ? 'var(--success)' : 'var(--warning)'}; font-size: 32px; margin-bottom: 8px;"></i>
            <p class="font-weight-600 text-sm mt-1 filename-display" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${file.name}</p>
            <p class="text-xs text-muted">${window.formatBytes(file.size)}</p>
            
            <div>
                <button type="button" class="ai-details-link">Visualizar OCR (Texto Lido)</button>
            </div>
            
            <div class="ocr-preview-container" style="display: none;">
                <div class="ocr-preview-title">
                    <span>Texto Extraído</span>
                    <span style="color: var(--primary-light);">Confiança: ${docData.score}%</span>
                </div>
                <div class="ocr-preview-text">${docData.texto}</div>
            </div>
            
            <button type="button" class="btn-remove-file mt-3" style="background: none; border: none; color: var(--danger); font-size: 11px; font-weight: 600; cursor: pointer; text-decoration: underline;">Remover Arquivo</button>
        `;
    }

    function removeDocument(zone, docType) {
        delete mandatoryFiles[docType];

        zone.classList.remove('uploaded', 'divergent', 'analyzing');

        const defaultZone = zone.querySelector('.zone-default');
        const uploadedZone = zone.querySelector('.zone-uploaded');

        defaultZone.style.display = 'block';
        uploadedZone.style.display = 'none';

        const input = zone.querySelector('.file-input');
        if (input) input.value = ''; // Limpa o input file

        // Desmarca o checklist lateral
        const checkItem = document.querySelector(`.checklist-item[data-check="${docType}"]`);
        if (checkItem) {
            checkItem.classList.remove('checked');
        }

        updateProgress();
    }

    function updateProgress() {
        const count = Object.keys(mandatoryFiles).length;
        const perc = Math.round((count / totalDocs) * 100);
        progressValue.innerText = `${perc}%`;
        if (progressText) progressText.innerText = `${count} de 8 documentos enviados`;
        const circle = document.querySelector('.circular-progress');
        if (circle) {
            circle.style.background = `conic-gradient(var(--primary-color) ${perc * 3.6}deg, rgba(255, 255, 255, 0.05) 0deg)`;
        }
    }

    // --- Upload de Documentos Adicionais ---
    const uploadAdicional = document.getElementById('upload-adicional');
    const adicFileInput = document.getElementById('additional-file-input');
    const adicionaisList = document.getElementById('adicionais-list');

    if (uploadAdicional && adicFileInput) {
        uploadAdicional.addEventListener('click', () => adicFileInput.click());
        adicFileInput.addEventListener('change', function () {
            Array.from(this.files).forEach(file => {
                additionalFiles.push(file);
                renderAdicionalFile(file);
            });
            updateReviewSection();
        });
    }

    function renderAdicionalFile(file) {
        const div = document.createElement('div');
        div.className = 'review-item';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fa-regular fa-file" style="color: var(--text-muted);"></i>
                <span style="font-size: 13px;">${file.name}</span>
            </div>
            <button type="button" class="btn-remove-adic" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size: 11px;">Remover</button>
        `;
        div.querySelector('.btn-remove-adic').addEventListener('click', () => {
            const idx = additionalFiles.indexOf(file);
            if (idx > -1) {
                additionalFiles.splice(idx, 1);
            }
            div.remove();
            updateReviewSection();
        });
        adicionaisList.appendChild(div);
    }

    // --- Atualização da Revisão (Passo 4) ---
    function updateReviewSection() {
        document.getElementById('rev-razao').innerText = document.getElementById('razao_social').value || 'Não informado';
        document.getElementById('rev-cnpj').innerText = document.getElementById('cnpj').value || 'Não informado';

        const tipoEst = document.getElementById('tipo_estabelecimento');
        document.getElementById('rev-tipo').innerText = tipoEst.options[tipoEst.selectedIndex].text || 'Não informado';

        const countObrig = Object.keys(mandatoryFiles).length;
        const revObrig = document.getElementById('rev-obrig');
        revObrig.innerText = `${countObrig} de 8 enviados`;
        if (countObrig === 8) {
            revObrig.className = 'review-item-value text-success';
        } else {
            revObrig.className = 'review-item-value text-warning';
        }

        // Renderiza lista detalhada dos obrigatórios
        const listContainer = document.getElementById('rev-obrig-list-container');
        const list = document.getElementById('rev-obrig-list');
        list.innerHTML = '';

        if (countObrig > 0) {
            listContainer.style.display = 'block';
            Object.keys(mandatoryFiles).forEach(key => {
                const doc = mandatoryFiles[key];
                const li = document.createElement('li');
                li.style.margin = '4px 0';
                li.innerHTML = `
                    <strong>${key}</strong>: ${doc.file.name} - 
                    <span style="color: ${doc.status === 'Conforme' ? 'var(--success)' : 'var(--warning)'}; font-weight:600;">
                        ${doc.status} (${doc.score}%)
                    </span>
                `;
                list.appendChild(li);
            });
        } else {
            listContainer.style.display = 'none';
        }

        // Adicionais
        const countAdic = additionalFiles.length;
        document.getElementById('rev-adic').innerText = `${countAdic} enviado(s)`;

        const adicContainer = document.getElementById('rev-adic-list-container');
        const adicList = document.getElementById('rev-adic-list');
        adicList.innerHTML = '';

        if (countAdic > 0) {
            adicContainer.style.display = 'block';
            additionalFiles.forEach(file => {
                const li = document.createElement('li');
                li.innerText = file.name;
                adicList.appendChild(li);
            });
        } else {
            adicContainer.style.display = 'none';
        }
    }

    // --- Simulação de Inteligência Artificial ---
    async function simularAnaliseIA(filename, docType) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Gera conformidade semi-randômica para fins de teste
                // Laudo Técnico e Contrato Social costumam vir com alertas randômicos para testar o painel
                const rand = Math.random();
                const isConforme = rand > 0.35; // 65% chance de vir conforme

                let texto = "";
                if (docType === "Contrato Social") {
                    texto = `CONTRATO SOCIAL DE CONSTITUIÇÃO DA EMPRESA LTDA\nCláusula 1ª - Razão Social: Bella Vita Estética Ltda\nCláusula 2ª - Objeto Social: Serviços de beleza, estética, depilação e procedimentos não cirúrgicos.\nCláusula 3ª - Capital Social de R$ 100.000,00 divididos em quotas.\nResponsável técnico médico ou esteticista habilitado nos termos das resoluções sanitárias vigentes do município de Londrina.`;
                } else if (docType === "Alvará Sanitário") {
                    texto = `PREFEITURA MUNICIPAL DE LONDRINA\nSECRETARIA DE SAÚDE - VIGILÂNCIA SANITÁRIA\nALVARÁ SANITÁRIO Nº 99827-A\nValidade: 31/12/2026\nEstabelecimento autorizado a funcionar segundo as normas de higiene e vigilância em vigor.`;
                } else {
                    texto = `${docType.toUpperCase()} - DOCUMENTO ANALISADO POR IA\n\nExtração automática realizada pelo Tesseract OCR do Windows.\nResultado de validação com alta probabilidade.\nEste texto reflete o conteúdo lido no arquivo ${filename}.\nContém assinaturas digitais, dados cadastrais e declarações necessárias sob as normas locais.`;
                }

                if (!isConforme) {
                    texto += `\n[ALERTA DE INCONFORMIDADE]: Foi detectada a ausência de assinatura digital obrigatória do engenheiro responsável técnico ou carimbo de validação anual.`;
                }

                resolve({
                    texto: texto,
                    status: isConforme ? "Conforme" : "Divergente",
                    analise_detalhada: {
                        score: Math.round((isConforme ? 0.8 + rand * 0.2 : 0.4 + rand * 0.3) * 100) / 100,
                        label: isConforme ? "CONFORME" : "ALERTA_NORMATIVA"
                    }
                });
            }, 2000); // 2 segundos de atraso
        });
    }

    // --- Submissão e Persistência via API ---
    btnSubmit.addEventListener('click', async () => {
        if (!document.getElementById('declaracao').checked) {
            alert('Confirme a declaração de veracidade das informações apresentadas.');
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<div class="spinner" style="width:14px; height:14px; border-width:2px; margin-right:8px;"></div> Enviando...';

        try {
            const razaoSocial = document.getElementById('razao_social').value;
            const cnpj = document.getElementById('cnpj').value;
            const tipo = document.getElementById('tipo_estabelecimento');
            const tipoText = tipo.options[tipo.selectedIndex].text;
            const tipoVal = tipo.value;

            // Primeiro cria o processo via API
            const formData = new FormData();
            formData.append('razao_social', razaoSocial);
            formData.append('cnpj', cnpj);
            formData.append('tipo_estabelecimento', tipoText);

            const responseProcesso = await fetch('/api/processos/criar', {
                method: 'POST',
                body: formData
            });

            if (!responseProcesso.ok) {
                throw new Error('Erro ao criar processo');
            }

            const dataProcesso = await responseProcesso.json();
            const processoId = dataProcesso.processo_id;
            const processoNumero = dataProcesso.processo_numero;

            // Calcula o número de divergências para dar um risco realista
            let divergentCount = 0;
            const docsList = [];

            Object.keys(mandatoryFiles).forEach(key => {
                const doc = mandatoryFiles[key];
                if (doc.status === "Divergente") {
                    divergentCount++;
                }
                docsList.push({
                    tipo: key,
                    nome_arquivo: doc.file.name,
                    status: doc.status,
                    texto: doc.texto,
                    score: doc.score
                });
            });

            // Adiciona adicionais
            additionalFiles.forEach(file => {
                docsList.push({
                    tipo: "Documento Adicional",
                    nome_arquivo: file.name,
                    status: "Enviado",
                    texto: "Documento anexo complementar.",
                    score: 100
                });
            });

            // Calcula risco
            let risco = "Risco Baixo (12)";
            let riscoClass = "low";
            if (divergentCount >= 2) {
                risco = `Crítico (${Math.round(85 + Math.random() * 10)})`;
                riscoClass = "critical";
            } else if (divergentCount === 1) {
                risco = `Risco Alto (${Math.round(70 + Math.random() * 10)})`;
                riscoClass = "high";
            } else if (tipoVal === 'saude' || tipoVal === 'farmaceutico') {
                risco = `Risco Médio (${Math.round(40 + Math.random() * 10)})`;
                riscoClass = "medium";
            }

            const novoProcesso = {
                id: processoNumero,
                nome: razaoSocial,
                cnpj: cnpj,
                tipo: tipoText,
                status: divergentCount > 0 ? "Diligência" : "Em Análise",
                risco: risco,
                risco_class: riscoClass,
                data: new Date().toLocaleDateString('pt-BR'),
                completude: Math.round((Object.keys(mandatoryFiles).length / 8) * 100),
                documentos: docsList
            };

            // Também salva no localStorage para compatibilidade
            const processosExistem = localStorage.getItem('visa_processos');
            let listaProcessos = [];
            if (processosExistem) {
                listaProcessos = JSON.parse(processosExistem);
            }

            listaProcessos.unshift(novoProcesso);
            localStorage.setItem('visa_processos', JSON.stringify(listaProcessos));

            alert('Processo enviado com sucesso! Redirecionando para o painel.');
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Erro ao enviar processo:', error);
            alert('Falha ao enviar processo. Tente novamente.');
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Enviar Processo';
        }
    });
});