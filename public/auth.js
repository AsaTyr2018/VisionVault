async function updateAuth() {
  let session = {};
  try {
    const res = await fetch('/api/session');
    session = await res.json();
  } catch {
    session = { loggedIn: false };
  }
  if (!session.loggedIn || session.role !== 'admin') {
    document.querySelectorAll('a[href="admin.html"]').forEach(a => a.style.display = 'none');
  }
  if (session.username === 'admin') {
    let warn = document.getElementById('adminWarning');
    if (!warn) {
      warn = document.createElement('div');
      warn.id = 'adminWarning';
      warn.className = 'admin-warning';
      warn.textContent = "Security notice: delete the default 'admin' account after creating your own.";
      document.body.prepend(warn);
    }
  } else {
    const warn = document.getElementById('adminWarning');
    if (warn) warn.remove();
  }
  document.querySelectorAll('a[href="login.html"]').forEach(link => {
    if (session.loggedIn) {
      link.textContent = 'Logout';
      link.href = '#';
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('/api/logout', { method: 'POST' });
        location.href = 'index.html';
      });
    }
  });
  document.querySelectorAll('.pass-link').forEach(a => {
    a.style.display = session.loggedIn ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', updateAuth);
