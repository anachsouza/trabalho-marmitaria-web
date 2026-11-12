// ---------- Aviso de erro (fica fixo na tela para dar print) ----------
(function injetarEstilo() {
    const css = document.createElement('style');
    css.textContent = `
    #banner-erro { position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 99999;
        width: min(640px, 92vw); background: #fef2f2; color: #7f1d1d; border: 2px solid #dc2626;
        border-radius: 12px; padding: 16px 20px; box-shadow: 0 10px 30px rgba(0,0,0,.25);
        font-family: system-ui, sans-serif; font-size: 15px; line-height: 1.4; }
    #banner-erro strong.titulo { display: block; font-size: 17px; margin-bottom: 4px; }
    #banner-erro .rota { font-family: monospace; font-size: 13px; opacity: .85; }
    #banner-erro .dica { margin-top: 8px; font-size: 12px; opacity: .7; }
    #banner-erro button { position: absolute; top: 8px; right: 12px; border: 0; background: none;
        font-size: 22px; cursor: pointer; color: inherit; }`;
    document.head.appendChild(css);
})();

function mostrarErro(err) {
    console.error('ERRO:', err);
    document.getElementById('banner-erro')?.remove();

    const box = document.createElement('div');
    box.id = 'banner-erro';

    const fechar = document.createElement('button');
    fechar.textContent = '×';
    fechar.onclick = () => box.remove();

    const titulo = document.createElement('strong');
    titulo.className = 'titulo';
    titulo.textContent = err.status ? `Erro ${err.status}` : 'Erro';

    const msg = document.createElement('div');
    msg.textContent = err.message || String(err);

    const rota = document.createElement('div');
    rota.className = 'rota';
    rota.textContent = (err.metodo ? `${err.metodo} ${err.url}` : (err.origem || '')) + `  •  ${new Date().toLocaleString('pt-BR')}`;

    const dica = document.createElement('div');
    dica.className = 'dica';
    dica.textContent = 'Tire um print desta tela (e do terminal do servidor).';

    box.append(fechar, titulo, msg, rota, dica);
    document.body.appendChild(box);
}

// Qualquer erro de JavaScript não tratado também aparece na tela
window.addEventListener('error', e => mostrarErro({ message: e.message, origem: `${e.filename}:${e.lineno}` }));
window.addEventListener('unhandledrejection', e => mostrarErro(e.reason instanceof Error ? e.reason : { message: String(e.reason) }));

// ---------- Cliente da API ----------
const API = {
    async requisitar(metodo, url, corpo) {
        let resposta;
        try {
            resposta = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: corpo !== undefined ? JSON.stringify(corpo) : undefined
            });
        } catch {
            const erro = new Error('Não foi possível conectar ao servidor. Verifique se ele está rodando (npm start) e se você abriu o site por http://localhost:3000.');
            Object.assign(erro, { status: 0, metodo, url });
            throw erro;
        }

        let dados = null;
        try { dados = await resposta.json(); } catch { /* resposta sem corpo JSON */ }

        if (!resposta.ok) {
            const erro = new Error(dados?.erro || `O servidor respondeu com erro ${resposta.status}.`);
            Object.assign(erro, { status: resposta.status, metodo, url });
            throw erro;
        }
        return dados;
    },
    get:    url        => API.requisitar('GET', url),
    post:   (url, c)   => API.requisitar('POST', url, c),
    put:    (url, c)   => API.requisitar('PUT', url, c),
    patch:  url        => API.requisitar('PATCH', url),
    delete: url        => API.requisitar('DELETE', url)
};

// ---------- Utilitários ----------
const Util = {
    // imagens padrão são relativas à raiz do site; prefixo = './' (index) ou '../' (pages)
    src(imagem, prefixo) {
        if (!imagem) return prefixo + 'assets/img/logo.png';
        return imagem.startsWith('data:') ? imagem : prefixo + imagem;
    },
    esc(texto) {
        const d = document.createElement('div');
        d.textContent = texto ?? '';
        return d.innerHTML;
    },
    moeda(v) { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); },

    // lê a imagem, reduz para no máx. 400px e devolve texto base64
    lerImagem(arquivo) {
        return new Promise((resolve, reject) => {
            const leitor = new FileReader();
            leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo de imagem.'));
            leitor.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error('O arquivo escolhido não é uma imagem válida.'));
                img.onload = () => {
                    const escala = Math.min(1, 400 / Math.max(img.width, img.height));
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width * escala;
                    canvas.height = img.height * escala;
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.src = leitor.result;
            };
            leitor.readAsDataURL(arquivo);
        });
    }
};
