/* Controla o tema, o formulário de contato e o carrinho nas páginas correspondentes. */

/* Funções auxiliares para armazenamento e formatação de valores */
const guardar = (chave, valor) => {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* Ignora falhas de acesso ao armazenamento local. */ }
};
const ler = (chave, padrao) => {
    try {
        const v = localStorage.getItem(chave);
        return v === null ? padrao : JSON.parse(v);
    } catch (e) { return padrao; }
};
const formatarMoeda = (n) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/* Define e alterna o tema da página */
function iniciarTema() {
    const raiz = document.documentElement;
    const botao = document.querySelector('#btn-tema');
    const prefereEscuro = window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;

    let tema = ler('tema', null) || (prefereEscuro ? 'dark' : 'light');
    raiz.setAttribute('data-theme', tema);

    if (!botao) return;

    const atualizarBotao = () => {
        botao.textContent = tema === 'dark' ? '☀️ Claro' : '🌙 Escuro';
        botao.setAttribute('aria-pressed', String(tema === 'dark'));
    };
    atualizarBotao();

    botao.addEventListener('click', () => {
        tema = tema === 'dark' ? 'light' : 'dark';
        raiz.setAttribute('data-theme', tema);
        guardar('tema', tema);
        atualizarBotao();
    });
}

/* Valida o formulário de contato e atualiza o contador da mensagem */
function iniciarContato() {
    const form = document.querySelector('#form-contato');
    if (!form) return;

    const nome = form.querySelector('#nome');
    const email = form.querySelector('#email');
    const mensagem = form.querySelector('#mensagem');
    const status = form.querySelector('#status-msg');
    const contador = form.querySelector('#contador-caracteres');

    const LIMITE = 500;
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const campos = [nome, email, mensagem];

    mensagem.setAttribute('maxlength', LIMITE);

    const atualizarContador = () => {
        contador.textContent = `${mensagem.value.length}/${LIMITE} caracteres`;
    };
    mensagem.addEventListener('input', atualizarContador);
    atualizarContador();

    const marcar = (campo, valido) => campo.classList.toggle('campo-erro', !valido);
    const mostrar = (texto, tipo) => {
        status.textContent = texto;
        status.className = tipo === 'erro' ? 'msg-erro' : 'msg-sucesso';
    };

    // Remove o destaque de erro quando o campo é editado
    campos.forEach((c) => c.addEventListener('input', () => c.classList.remove('campo-erro')));

    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Impede o envio padrão do formulário.

        const vNome = nome.value.trim();
        const vEmail = email.value.trim();
        const vMsg = mensagem.value.trim();

        marcar(nome, !!vNome);
        marcar(email, !!vEmail);
        marcar(mensagem, !!vMsg);

        if (!vNome || !vEmail || !vMsg) {
            mostrar('Erro: preencha todos os campos obrigatórios.', 'erro');
            return;
        }
        if (!regexEmail.test(vEmail)) {
            marcar(email, false);
            mostrar('Erro: digite um e-mail válido (ex.: nome@dominio.com).', 'erro');
            return;
        }

        mostrar(`Obrigado, ${vNome}! Sua mensagem foi enviada com sucesso.`, 'sucesso');
        form.reset();
        atualizarContador();
    });
}

/* Atualiza o carrinho e filtra os produtos pelo texto da busca */
function iniciarCarrinho() {
    let carrinho = ler('carrinho', []); // Cada item contém nome, preço e quantidade.

    const badge = document.querySelector('#contador-carrinho');
    const qtdEl = document.querySelector('#carrinho-qtd');
    const totalEl = document.querySelector('#carrinho-total');
    const limpar = document.querySelector('#limpar-carrinho');

    const renderizar = () => {
        const qtd = carrinho.reduce((s, i) => s + i.qtd, 0);
        const total = carrinho.reduce((s, i) => s + i.preco * i.qtd, 0);
        if (badge) {
            badge.textContent = `🛒 ${qtd}`;
            badge.title = `Total: ${formatarMoeda(total)}`;
        }
        if (qtdEl) qtdEl.textContent = qtd;
        if (totalEl) totalEl.textContent = formatarMoeda(total);
    };

    document.querySelectorAll('[data-add-carrinho]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const nome = btn.dataset.nome;
            const preco = parseFloat(btn.dataset.preco);
            if (!nome || Number.isNaN(preco)) return;

            const existente = carrinho.find((i) => i.nome === nome);
            if (existente) existente.qtd += 1;
            else carrinho.push({ nome, preco, qtd: 1 });

            guardar('carrinho', carrinho);
            renderizar();

            // Exibe temporariamente o estado de confirmação no botão
            const original = btn.textContent;
            btn.textContent = 'Adicionado ✓';
            btn.disabled = true;
            setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 900);
        });
    });

    if (limpar) {
        limpar.addEventListener('click', () => {
            carrinho = [];
            guardar('carrinho', carrinho);
            renderizar();
        });
    }

    renderizar();

    // Filtra os cartões conforme o nome ou a categoria
    const busca = document.querySelector('#busca-produto');
    if (busca) {
        const cards = document.querySelectorAll('.product-card[data-nome]');
        const semResultado = document.querySelector('#sem-resultados');

        busca.addEventListener('input', () => {
            const termo = busca.value.trim().toLowerCase();
            let visiveis = 0;
            cards.forEach((card) => {
                const texto = `${card.dataset.nome} ${card.dataset.categoria || ''}`.toLowerCase();
                const mostrar = texto.includes(termo);
                card.hidden = !mostrar;
                if (mostrar) visiveis += 1;
            });
            if (semResultado) semResultado.hidden = visiveis !== 0;
        });
    }
}

/* Inicia os recursos após o carregamento do documento */
document.addEventListener('DOMContentLoaded', () => {
    iniciarTema();
    iniciarContato();
    iniciarCarrinho();
});
