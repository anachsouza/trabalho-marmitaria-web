// Tema claro/escuro: liga o checkbox do header ao atributo data-tema (usado no CSS) e lembra a escolha
(function () {
    const checkbox = document.getElementById('checkbox-tema');
    let salvo = null;
    try { salvo = localStorage.getItem('tema'); } catch { /* sem armazenamento: segue o tema claro */ }

    const escuro = salvo === 'dark';
    document.documentElement.setAttribute('data-tema', escuro ? 'dark' : 'light');
    if (!checkbox) return;
    checkbox.checked = escuro;

    checkbox.addEventListener('change', () => {
        const tema = checkbox.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-tema', tema);
        try { localStorage.setItem('tema', tema); } catch { /* ignora */ }
    });
})();
