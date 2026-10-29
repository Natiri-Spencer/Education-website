(() => {
    const page = document.getElementById('grade9-page');
    if (!page) return;
    const overview = document.getElementById('g9-overview');
    const notebooks = document.getElementById('g9-notebooks');
    function showView(view) {
        document.getElementById('photo-lesson').hidden = true;
        overview.hidden = view !== 'overview';
        notebooks.hidden = view !== 'notebooks';
        page.querySelectorAll('.grade-sidebar [data-g9-view]').forEach(button => {
            const active = button.dataset.g9View === view;
            button.classList.toggle('active', active);
            if (active) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
        });
    }
    page.querySelectorAll('[data-g9-view]').forEach(button => {
        button.addEventListener('click', () => {
            showView(button.dataset.g9View);
            if (button.dataset.g9View === 'overview') {
                document.getElementById('g9-science').hidden = false;
                document.getElementById('g9-math').hidden = true;
            }
            document.getElementById(button.dataset.g9View === 'notebooks' ? 'g9-notebooks-title' : 'g9-title').focus();
        });
    });
    ['science', 'math'].forEach(subject => {
        const toggle = document.getElementById(`g9-${subject}-toggle`);
        const nav = document.getElementById(`g9-${subject}-nav`);
        toggle.addEventListener('click', () => {
            nav.hidden = !nav.hidden;
            toggle.setAttribute('aria-expanded', String(!nav.hidden));
        });
        page.querySelector(`[data-g9-subject="${subject}"]`).addEventListener('click', () => {
            showView('overview');
            ['science', 'math'].forEach(name => {
                document.getElementById(`g9-${name}`).hidden = name !== subject;
            });
            document.getElementById(`g9-${subject}-title`).focus();
        });
    });
})();
