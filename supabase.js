//importação da biblioteca do supabase
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const chave = process.env.SUPABASE_ANON_KEY;

console.log('Verificação Supabase:', {
    urlConfigurada: Boolean(url),
    endereco: url ? new URL(url).host : 'ausente',
    chaveConfigurada: Boolean(chave),
    prefixoDaChave: chave ? chave.slice(0, 15) : 'ausente',
    chaveComEspacos: chave ? chave !== chave.trim() : false
});

// verifica se o endereço e chave foram informados corretamente 
if (!url || !chave) {
    throw new Error('Configure SUPABASE_URL e SUPABASE_ANON_KEY no arquivo .env.');
}

const supabase = createClient(url, chave, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});


module.exports = { supabase };