document.addEventListener('DOMContentLoaded', () => {
    // --- SELEÇÃO DE ELEMENTOS ---
    const loginForm = document.getElementById('loginForm');
    const roleOptions = document.querySelectorAll('input[name="role"]');
    const labelIdentificador = document.getElementById('label-identificador');
    const identificadorInput = document.getElementById('identificador');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const errorIdentificador = document.getElementById('error-identificador');
    const errorPassword = document.getElementById('error-password');
    const btnGovBr = document.querySelector('.btn-gov-br');
    const govDivider = document.querySelector('.divider');

    // --- FUNÇÕES AUXILIARES DE VALIDAÇÃO ---
    // Mantendo o padrão de 8 caracteres e letras/números para consistência com o cadastro
    const isPasswordStrong = (password) => {
        const re = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        return re.test(password);
    };

    // --- FUNÇÕES DE CONTROLE DE ERRO VISUAL ---
    function setFieldError(input, errorElement, message) {
        input.classList.add('input-error');
        input.style.borderColor = '#ef4444'; // Borda vermelha
        errorElement.innerText = message;
        errorElement.style.display = 'block';
    }

    function clearFieldError(input, errorElement) {
        input.classList.remove('input-error');
        input.style.borderColor = ''; // Volta ao normal
        errorElement.style.display = 'none';
    }

    // --- FUNÇÕES DE MÁSCARA (REGEX) ---
    const maskCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
    const maskCNPJ = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');

    function updateGovBrVisibility() {
        const role = document.querySelector('input[name="role"]:checked').value;

        if (btnGovBr) {
            btnGovBr.style.display = role === 'empresa' ? 'flex' : 'none';
        }

        if (govDivider) {
            govDivider.style.display = role === 'empresa' ? 'flex' : 'none';
        }
    }

    // --- EVENTO: TROCA DE PERFIL (EMPRESA / SERVIDOR) ---
    roleOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            identificadorInput.value = '';
            clearFieldError(identificadorInput, errorIdentificador);

            if (e.target.value === 'servidor') {
                labelIdentificador.innerText = 'CPF';
                identificadorInput.placeholder = '000.000.000-00';
            } else {
                labelIdentificador.innerText = 'CNPJ';
                identificadorInput.placeholder = '00.000.000/0000-00';
            }

            updateGovBrVisibility();
        });
    });

    updateGovBrVisibility();

    // --- EVENTO: DIGITAÇÃO (LIMPAR ERROS E APLICAR MÁSCARAS) ---
    identificadorInput.addEventListener('input', (e) => {
        clearFieldError(identificadorInput, errorIdentificador);
        const role = document.querySelector('input[name="role"]:checked').value;
        e.target.value = role === 'servidor' ? maskCPF(e.target.value) : maskCNPJ(e.target.value);
    });

    passwordInput.addEventListener('input', () => clearFieldError(passwordInput, errorPassword));

    // --- EVENTO: MOSTRAR/ESCONDER SENHA (LÓGICA CORRIGIDA) ---
    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

        if (isPassword) {
            // Se estava escondido e vai mostrar
            togglePassword.classList.remove('fa-eye-slash');
            togglePassword.classList.add('fa-eye');
        } else {
            // Se estava mostrando e vai esconder
            togglePassword.classList.remove('fa-eye');
            togglePassword.classList.add('fa-eye-slash');
        }
    });

    // --- EVENTO: SUBMISSÃO DO FORMULÁRIO (LOGIN) ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;

        const role = document.querySelector('input[name="role"]:checked').value;
        const userRawValue = identificadorInput.value.replace(/\D/g, '');
        const passwordValue = passwordInput.value.trim(); // Usando trim para evitar espaços vazios

        // Validação do Identificador (CPF ou CNPJ)
        if (!userRawValue) {
            const msg = (role === 'servidor') ? "O CPF é obrigatório" : "O CNPJ é obrigatório";
            setFieldError(identificadorInput, errorIdentificador, msg);
            isValid = false;
        } else if (role === 'servidor' && userRawValue.length !== 11) {
            setFieldError(identificadorInput, errorIdentificador, "O CPF deve ter pelo menos 11 dígitos");
            isValid = false;
        } else if (role === 'empresa' && userRawValue.length !== 14) {
            setFieldError(identificadorInput, errorIdentificador, "O CNPJ deve ter pelo menos 14 dígitos");
            isValid = false;
        }

        // Validação da Senha
        if (!passwordValue) {
            setFieldError(passwordInput, errorPassword, "A senha é obrigatória");
            isValid = false;
        } else if (!isPasswordStrong(passwordValue)) {
            // Mantendo a exigência de 8 caracteres (letras e números) para maior segurança
            setFieldError(passwordInput, errorPassword, "A senha deve ter no mínimo 8 caracteres (letras e números)");
            isValid = false;
        }

        if (!isValid) return;

        // --- LÓGICA DE SUCESSO NO LOGIN ---
        const loginContent = document.querySelector('.login-content');
        const destination = role === 'servidor' ? 'dashboard_static.html' : 'portal_static.html';
        const saudacao = role === 'servidor' ? 'Bem-vindo, Servidor' : 'Acesso Autorizado';

        // Feedback visual de carregamento no botão antes de sumir com tudo
        const btn = loginForm.querySelector('.btn-primary');
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Autenticando...';
        btn.style.opacity = '0.8';
        btn.disabled = true;

        setTimeout(() => {
            // Efeito de fade out no conteúdo atual
            loginContent.style.opacity = '0';
            loginContent.style.transition = 'opacity 0.4s ease';

            setTimeout(() => {
                // Insere a interface de sucesso
                loginContent.innerHTML = `
                    <div class="success-container" style="text-align:  center; padding: 2rem; animation: fadeIn 0.5s forwards; background: rgba(15, 23, 42, 0.75); border-radius: 18px; box-shadow: 0 20px 50px -18px rgba(0, 0, 0, 0.65);">
                        <div class="success-icon" style="display: inline-flex; align-items: center; justify-content: center; width: 90px; height: 90px; margin-bottom: 1.5rem;">
                            <i class="fa-solid fa-circle-check" style="font-size: 5rem; color: var(--primary-light); filter: drop-shadow(0 0 14px rgba(96, 165, 250, 0.35));"></i>
                        </div>
                        <h3 style="color: var(--text-main); font-size: 1.5rem; margin-bottom: 1rem; font-weight: 700;">${saudacao}</h3>
                        <p style="color: var(--text-muted); margin-bottom: 2rem; line-height: 1.6;">Redirecionando para o portal de serviços...</p>
                        <div class="loading-bar-container" style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 10px; overflow: hidden;">
                            <div class="loading-bar-fill" style="width: 100%; height: 100%; background: linear-gradient(135deg, var(--primary-color), #4f46e5); border-radius: 10px; box-shadow: 0 0 16px rgba(59, 130, 246, 0.35);"></div>
                        </div>
                    </div>
                `;
                loginContent.style.opacity = '1';
            }, 400);

            // Redireciona após a barra de progresso terminar
            setTimeout(() => {
                window.location.href = destination;
            }, 3000);
        }, 800);
    });

    // --- EVENTO: ACESSO VIA GOV.BR ---
    if (!btnGovBr) return;

    btnGovBr.addEventListener('click', () => {
        const role = document.querySelector('input[name="role"]:checked').value;

        btnGovBr.innerText = "Conectando ao Gov.br...";
        btnGovBr.disabled = true;

        setTimeout(() => {
            if (role === 'servidor') {
                window.location.href = 'dashboard_static.html';
            } else {
                window.location.href = 'portal_static.html';
            }
        }, 3000);
    });
});