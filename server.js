// acesso do backend às configurações de conexão com o supabase
require('dotenv').config();

const express = require('express');
const path = require('path');
const { AppError } = require('./erros');
const { supabase } = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3000;

const agora = () => new Date().toLocaleString('pt-BR');

app.use(express.json({ limit: '5mb' })); // 5mb: as imagens das categorias vão como texto (base64)

// Log de toda requisição no terminal
app.use((req, res, next) => {
    res.on('finish', () => console.log(`[${agora()}] ${req.method} ${req.originalUrl} -> ${res.statusCode}`));
    next();
});

// ---------- ROTAS DA API ----------
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/pratos', require('./routes/pratos'));

// Métricas do index
app.get('/api/metricas', async (req, res, next) => {
    try {
        const [categorias, ativas, pratos] = await Promise.all([
            supabase.from('categorias').select('*', { count: 'exact', head: true }),
            supabase.from('categorias').select('*', { count: 'exact', head: true }).eq('ativa', true),
            supabase.from('pratos').select('*', { count: 'exact', head: true })
        ]);

        if (categorias.error) throw categorias.error;
        if (ativas.error) throw ativas.error;
        if (pratos.error) throw pratos.error;

        res.json({
            totalCategorias: categorias.count,
            categoriasAtivas: ativas.count,
            categoriasOcultas: categorias.count - ativas.count,
            totalPratos: pratos.count
        });

    } catch (erro) {
        next(erro);
    }
});

// Rota de API inexistente
app.use('/api', (req, res, next) => {
    next(new AppError(404, `Rota não encontrada: ${req.method} ${req.originalUrl}`));
});

// ---------- SITE (pasta public) ----------
app.use(express.static(path.join(__dirname, 'public')));

// ---------- TRATAMENTO DE ERROS (todo erro passa por aqui) ----------
app.use((err, req, res, next) => {
    let status = err.status || 500;
    let mensagem = err.message;

    if (err.type === 'entity.parse.failed') { status = 400; mensagem = 'JSON inválido enviado ao servidor.'; }
    if (err.type === 'entity.too.large')    { status = 413; mensagem = 'Dados grandes demais (imagem muito pesada).'; }
    if (status === 500) mensagem = 'Erro interno do servidor: ' + err.message;

    // Mostra o erro bem visível no terminal (para tirar print)
    console.error('\n==================== ERRO ====================');
    console.error(`Data/hora : ${agora()}`);
    console.error(`Requisição: ${req.method} ${req.originalUrl}`);
    console.error(`Status    : ${status}`);
    console.error(`Mensagem  : ${mensagem}`);
    if (status === 500) console.error(err.stack);
    console.error('==============================================\n');

    res.status(status).json({ erro: mensagem });
});

process.on('uncaughtException', e => console.error(`[${agora()}] ERRO NÃO TRATADO:`, e));
process.on('unhandledRejection', e => console.error(`[${agora()}] PROMESSA REJEITADA:`, e));

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
