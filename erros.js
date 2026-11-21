// Erro "esperado" da API: carrega o status HTTP e a mensagem que será mostrada ao usuário
class AppError extends Error {
    constructor(status, mensagem) {
        super(mensagem);
        this.status = status;
    }
}

// Converte o :id da URL em número inteiro (ou lança erro 400)
function lerId(valor) {
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(400, `ID inválido: "${valor}".`);
    }
    return id;
}

module.exports = { AppError, lerId };
