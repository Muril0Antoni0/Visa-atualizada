document.addEventListener('DOMContentLoaded', () => {
    const cadastroForm = document.getElementById('cadastroForm');
    const cnpjInput = document.getElementById('cadastro-cnpj');
    const passwordInput = document.getElementById('cadastro-password');
    const togglePassword = document.querySelector('.togglePassword');

    const isEmailValid = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const isPasswordStrong = (password) => {
        const re = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        return re.test(password);
    };

    // --- MÁSCARA CNPJ ---
    const maskCNPJ = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');

    cnpjInput.addEventListener('input', (e) => {
        e.target.value = maskCNPJ(e.target.value);
        clearError('cnpj');
    });

    // --- MOSTRAR SENHA ---
    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

        if (isPassword) {
            togglePassword.classList.remove('fa-eye-slash');
            togglePassword.classList.add('fa-eye');
        } else {
            togglePassword.classList.remove('fa-eye');
            togglePassword.classList.add('fa-eye-slash');
        }
    });

    // --- FUNÇÕES DE ERRO ---
    function showError(id, message) {
        const input = document.getElementById(`cadastro-${id}`);
        const errorSpan = document.getElementById(`error-${id}`);
        input.style.borderColor = '#ef4444';
        errorSpan.innerText = message;
        errorSpan.style.display = 'block';
    }

    function clearError(id) {
        const input = document.getElementById(`cadastro-${id}`);
        const errorSpan = document.getElementById(`error-${id}`);
        if (input) input.style.borderColor = '';
        if (errorSpan) errorSpan.style.display = 'none';
    }

    // Limpar erros ao digitar
    ['razao', 'email', 'password'].forEach(field => {
        document.getElementById(`cadastro-${field}`).addEventListener('input', () => clearError(field));
    });

    // --- SUBMISSÃO ---
    cadastroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let valid = true;

        const cnpj = cnpjInput.value.replace(/\D/g, '');
        const razao = document.getElementById('cadastro-razao').value.trim();
        const email = document.getElementById('cadastro-email').value.trim();
        const password = passwordInput.value;

        if (cnpj == "") { showError('cnpj', 'O CNPJ é obrigatório'); valid = false; }
        else if (cnpj.length < 14) { showError('cnpj', 'O CNPJ deve ter pelo menos 14 dígitos'); valid = false; }

        if (razao === "") { showError('razao', 'A Razão Social é obrigatória'); valid = false; }
        else if (razao.length < 3) { showError('razao', 'A Razão Social deve ter pelo menos 3 caracteres'); valid = false; }

        if (email === "") { showError('email', 'O E-mail é obrigatório'); valid = false; }
        else if (!isEmailValid(email)) { showError('email', 'Insira um e-mail válido (Ex: exemplo@empresa.com)'); valid = false; }

        if (password === "") { showError('password', 'A Senha é obrigatória'); valid = false; }
        else if (!isPasswordStrong(password)) { showError('password', 'A senha deve ter no mínimo 8 caracteres, incluindo letras e números'); valid = false; }

        if (valid) {
            const loginContent = document.querySelector('.login-content');
            loginContent.style.opacity = '0';
            setTimeout(() => {
                loginContent.innerHTML = `
                    <div class="success-container" style="text-align: center; padding: 2rem; animation: fadeIn 0.5s forwards; background: rgba(15, 23, 42, 0.75); border-radius: 18px; box-shadow: 0 20px 50px -18px rgba(0, 0, 0, 0.65);">
                        <div class="success-icon" style="margin-bottom: 1.5rem;">
                            <i class="fa-solid fa-circle-check" style="font-size: 5rem; color: var(--success); filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.25));"></i>
                        </div>
                        <h3 style="color: var(--text-main); font-size: 1.5rem; margin-bottom: 1rem;">Cadastro Realizado!</h3>
                        <p style="color: var(--text-muted); margin-bottom: 2rem;">Sua conta foi criada com sucesso. Você será redirecionado para a tela de login em instantes...</p>
                        <a href="./login_static.html" class="btn-primary" style="text-decoration: none; display: block; text-align: center; background: linear-gradient(135deg, var(--primary-color), #4f46e5); box-shadow: 0 10px 24px rgba(79, 70, 229, 0.28);">
                            Ir para Login agora
                        </a>
                    </div>
                `;
                loginContent.style.opacity = '1';
            }, 300);
            setTimeout(() => {
                window.location.href = 'login_static.html';
            }, 3000);
        }
    });
});