document.addEventListener('DOMContentLoaded', () => {

    /*EFEITO DE FOCO NOS INPUTS E SELECTS*/
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            const wrapper = input.closest('.input-wrapper, .select-wrapper');
            if (wrapper) {
                wrapper.style.opacity = '1';
            }
        });
    });

    /*FORMATADOR GLOBAL DE TAMANHO*/
    window.formatBytes = function (bytes, decimals = 2) {
        if (bytes === 0) {
            return '0 Bytes';
        }
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes','KB','MB','GB','TB'];
        const i = Math.floor(
            Math.log(bytes) / Math.log(k)
        );
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    /*MENU HAMBÚRGUER MOBILE*/
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    if (menuToggle && mainNav) {
        const menuIcon = menuToggle.querySelector('i');
        menuToggle.addEventListener('click', () => {
            const isActive = mainNav.classList.toggle('active');
            if (menuIcon) {
                if (isActive) {
                    menuIcon.classList.remove('fa-bars');
                    menuIcon.classList.add('fa-xmark');
                } else {
                    menuIcon.classList.remove('fa-xmark');
                    menuIcon.classList.add('fa-bars');
                }
            }
        });
    }

    /*FECHAR MENU AO CLICAR EM LINK*/

    const navLinks = document.querySelectorAll('.main-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (!menuToggle || !mainNav) {
                return;
            }
            mainNav.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    });

    /*FECHAR MENU AO CLICAR FORA*/
    document.addEventListener('click', (event) => {
        if (!menuToggle || !mainNav) {
            return;
        }
        const clickedInsideMenu = mainNav.contains(event.target);
        const clickedToggle = menuToggle.contains(event.target);
        if (mainNav.classList.contains('active') &&!clickedInsideMenu &&!clickedToggle) {
            mainNav.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        }
    });


    /*FECHAR MENU AO REDIMENSIONAR*/
    window.addEventListener('resize', () => {
        if (window.innerWidth > 650 && mainNav && menuToggle) {
            mainNav.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        }
    });
});