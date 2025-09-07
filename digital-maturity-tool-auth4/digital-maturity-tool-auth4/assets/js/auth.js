
(() => {
  const USERS_KEY = 'users';
  const CURR_KEY = 'currentUser';

  function getUsers(){
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  }
  function setUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
  function setCurrent(email){ localStorage.setItem(CURR_KEY, email); }
  function getCurrent(){ return localStorage.getItem(CURR_KEY); }

  // Guard protected pages
  if (!['index.html','signup.html',''].some(p => location.pathname.endsWith(p))) {
    if (!getCurrent()) { location.href = 'index.html'; }
  }

  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn){
    loginBtn.addEventListener('click', () => {
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const pass = document.getElementById('loginPass').value;
      const users = getUsers();
      if (!users[email] || users[email] !== pass){
        alert('Invalid email or password');
        return;
      }
      setCurrent(email);
      alert('Logged in successfully.');
      location.href = 'home.html';
    });
  }

  const createBtn = document.getElementById('createBtn');
  if (createBtn){
    createBtn.addEventListener('click', () => {
      const email = document.getElementById('newEmail').value.trim().toLowerCase();
      const p1 = document.getElementById('newPass').value;
      const p2 = document.getElementById('newPass2').value;
      if (!email || p1.length < 8 || p1 !== p2){
        alert('Please use a valid email and matching passwords (min 8 chars).');
        return;
      }
      const users = getUsers();
      if (users[email]) { alert('Account already exists.'); return; }
      users[email] = p1; setUsers(users); setCurrent(email);
      alert('Account created. Welcome!');
      location.href = 'home.html';
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn){
    logoutBtn.addEventListener('click', () => { localStorage.removeItem(CURR_KEY); location.href='index.html'; });
  }
})();
