
const express = require('express');
const { supabase } = require('../supabase');
const { AppError, lerId } = require('../erros');

const router = express.Router();

// Trata erros das rotas assíncronas
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Valida o corpo da requisição (POST e PUT)
function validar(corpo, categorias, idAtual) {
    const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : '';

    if (nome.length < 2) throw new AppError(400, 'O nome da categoria é obrigatório (mínimo de 2 caracteres).');
    if (nome.length > 50) throw new AppError(400, 'O nome da categoria deve ter no máximo 50 caracteres.');
    if (/\p{N}/u.test(nome)) throw new AppError(400, 'O nome da categoria não pode conter números.')

    const duplicada = categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase() && c.id !== idAtual);
    if (duplicada) throw new AppError(409, `Já existe uma categoria chamada "${nome}".`);

    if (corpo.ativa !== undefined && typeof corpo.ativa !== 'boolean') {
        throw new AppError(400, 'O campo "ativa" deve ser verdadeiro ou falso.');
    }

    const imagem = typeof corpo.imagem === 'string' && corpo.imagem ? corpo.imagem : null;
    return { nome, imagem, ativa: corpo.ativa ?? true };
}

// LISTAR todas (com a quantidade de pratos de cada uma)
router.get('/', asyncHandler(async (req, res) => {
    const { data: categorias, error } = await supabase.from('categorias').select('*').order('id');
    if (error) throw error;

    const { data: pratos, error: erroPratos } = await supabase.from('pratos').select('categoria_id');
    if (erroPratos) throw erroPratos;

    res.json(categorias.map(c => ({
        ...c,
        totalPratos: pratos.filter(p => p.categoria_id === c.id).length
    })));
}));

// BUSCAR uma
router.get('/:id', asyncHandler(async (req, res) => {
    const id = lerId(req.params.id);
    const { data, error } = await supabase.from('categorias').select('*').eq('id', id).maybeSingle();

    if (error) throw error;
    if (!data) throw new AppError(404, `Categoria ${id} não encontrada.`);

    res.json(data);
}));

// CRIAR
router.post('/', asyncHandler(async (req, res) => {
    const { data: categorias, error: erroCategorias } = await supabase.from('categorias').select('id, nome');
    if (erroCategorias) throw erroCategorias;

    const dados = validar(req.body, categorias, null);
    const { data, error } = await supabase.from('categorias').insert(dados).select().single();

    if (error) {
        if (error.code === '23505') throw new AppError(409, `Já existe uma categoria chamada "${dados.nome}".`);
        throw error;
    }

    res.status(201).json(data);
}));

// ATUALIZAR
router.put('/:id', asyncHandler(async (req, res) => {
    const id = lerId(req.params.id);
    const { data: categoria, error: erroBusca } = await supabase.from('categorias').select('*').eq('id', id).maybeSingle();

    if (erroBusca) throw erroBusca;
    if (!categoria) throw new AppError(404, `Categoria ${id} não encontrada.`);

    const { data: categorias, error: erroCategorias } = await supabase.from('categorias').select('id, nome');
    if (erroCategorias) throw erroCategorias;

    const dados = validar(req.body, categorias, id);
    const { data, error } = await supabase.from('categorias').update(dados).eq('id', id).select().single();

    if (error) throw error;

    res.json(data);
}));

// ATIVAR / OCULTAR (botão switch do index)
router.patch('/:id/status', asyncHandler(async (req, res) => {
    const id = lerId(req.params.id);
    const { data: categoria, error: erroBusca } = await supabase.from('categorias').select('*').eq('id', id).maybeSingle();

    if (erroBusca) throw erroBusca;
    if (!categoria) throw new AppError(404, `Categoria ${id} não encontrada.`);

    const { data, error } = await supabase.from('categorias').update({ ativa: !categoria.ativa }).eq('id', id).select().single();

    if (error) throw error;

    res.json(data);
}));

// EXCLUIR — BLOQUEADO se existir prato vinculado
router.delete('/:id', asyncHandler(async (req, res) => {
    const id = lerId(req.params.id);
    const { data: categoria, error: erroBusca } = await supabase.from('categorias').select('*').eq('id', id).maybeSingle();

    if (erroBusca) throw erroBusca;
    if (!categoria) throw new AppError(404, `Categoria ${id} não encontrada.`);

    const { count: qtd, error: erroPratos } = await supabase.from('pratos').select('id', { count: 'exact', head: true }).eq('categoria_id', id);
    if (erroPratos) throw erroPratos;

    if (qtd > 0) {
        throw new AppError(409,
            `Não é possível excluir a categoria "${categoria.nome}": ela possui ${qtd} prato(s) vinculado(s). ` +
            `Exclua os pratos primeiro.`);
    }

    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) throw error;

    res.json({ mensagem: `Categoria "${categoria.nome}" excluída com sucesso.` });
}));

module.exports = router;
