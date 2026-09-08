const API_BASE = 'https://api.apirequest.dev/v1/api'
const API_KEY = 'ar_7d3cd7448a5ccc638983ba8b414676fa' // to avoid limiting issues, use your own key - this is a demo key

let authToken = null;
let currentUser = null;



async function fetchPosts() {
    try {
        const response = await fetch(`${API_BASE}/social_media/posts?combined=true`, {
            method: 'GET',
            headers: {
                api_key: API_KEY
            }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        displayPosts(result.data.posts);


        document.getElementById('status').textContent =
            `${result.data.posts.length} posts loaded`;

    } catch (error) {
        console.error('Failed to fetch posts:', error);
        document.getElementById('status').textContent = 'Failed to load posts.';
    }
}

fetchPosts()

async function registerUser() {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('register-error');
    const btn = document.querySelector('#register-form .btn-primary');

    errorEl.classList.add('hidden');

    if (!username || !email || !password) {
        errorEl.textContent = 'All fields are required.';
        errorEl.classList.remove('hidden');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Creating account…';

    try {
        const res = await fetch(`${API_BASE}/social_media/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api_key': API_KEY },
            body: JSON.stringify({
                username,
                email,
                password,
                profile_picture: `https://i.pravatar.cc/150?u=${username}`
            })
        });

        const result = await res.json();

        if (!res.ok) {
            errorEl.textContent = result.message || 'Registration failed.';
            errorEl.classList.remove('hidden');
            return;
        }

        // Auto-login after successful registration
        await loginWithCredentials(email, password);

    } catch (err) {
        errorEl.textContent = 'Something went wrong. Try again.';
        errorEl.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}

async function loginWithCredentials(email, password) {
    const res = await fetch(`${API_BASE}/social_media/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api_key': API_KEY },
        body: JSON.stringify({ email, password })
    });

    if (!res.ok) return false;

    const result = await res.json();

    authToken = result.data.token;
    currentUser = result.data.user;

    updateAuthUI();
    return true
}

function logout() {
    authToken = null;
    currentUser = null;
    updateAuthUI();
}

async function createPost() {
    const title = document.getElementById('post-title').value.trim();
    const description = document.getElementById('post-description').value.trim();
    const imageUrl = document.getElementById('post-image').value.trim();
    const btn = document.querySelector('#create-form .btn-primary');

    if (!title || !description) {
        alert('Title and description are required.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Posting…';

    try {
        const response = await fetch(`${API_BASE}/social_media/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api_key': API_KEY,
                'authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                title,
                description,
                images: imageUrl ? [imageUrl] : []
            })
        });

        if (!response.ok) {
            console.error('Failed to create post:', await response.json());
            return;
        }

        document.getElementById('post-title').value = '';
        document.getElementById('post-description').value = '';
        document.getElementById('post-image').value = '';

        await fetchPosts();

    } catch (error) {
        console.error('Error:', error);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Post';
    }
}

async function likePost(postId){ 
    if (!authToken) {
        alert('Log in first to like posts.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/social_media/posts/like/${postId}`, {
            method: 'POST',
            headers: {
                'api_key': API_KEY,
                'authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            console.error('Failed to like post:', await response.json());
            return;
        }

        await fetchPosts();

    } catch (error) {
        console.error('Error:', error);
    }
}


// --- UI ---------

async function login() {
    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    const errorEl = document.getElementById('login-error');
    const btn = document.querySelector('#login-form .btn-primary');

    errorEl.classList.add('hidden');

    if (!email.value.trim() || !password.value) {
        errorEl.textContent = 'Email and password are required.';
        errorEl.classList.remove('hidden');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Logging in…';

    try {
        const ok = await loginWithCredentials(email.value.trim(), password.value);
        if (!ok) {
            errorEl.textContent = 'Invalid email or password.';
            errorEl.classList.remove('hidden');
        } else {
            email.value = ''
            password.value = ''
        }

    } catch (err) {
        errorEl.textContent = 'Something went wrong. Try again.';
        errorEl.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Log In';
    }
}


function displayPosts(posts) {
    const container = document.getElementById('posts-container');
    container.innerHTML = '';

    posts.forEach(post => {
        const el = document.createElement('div');
        el.className = 'post';

        const imageHtml = post.images?.length
            ? `<img src="${post.images[0]}" alt="" />`
            : '';

        const avatarSrc = post.author?.profile_picture
            || `https://i.pravatar.cc/150?u=${post.author?.username}`;

        el.innerHTML = `
            ${imageHtml}
            <h3>${post.title}</h3>
            <p>${post.description}</p>
            <div class="post-meta">
                <div class="post-author">
                    <img src="${avatarSrc}" alt="" />
                    ${post.author?.username || 'Anonymous'}
                </div>
                <button class="like-btn" onclick="likePost('${post.id}')">
                    ❤️ ${post.likes?.length || 0}
                </button>
            </div>
        `;

        container.appendChild(el);
    });
}




function updateAuthUI() {
    const loggedIn = !!authToken;
    document.getElementById('auth-section').classList.toggle('hidden', loggedIn);
    document.getElementById('create-form').classList.toggle('hidden', !loggedIn);
    document.getElementById('user-info').classList.toggle('hidden', !loggedIn);

    if (loggedIn && currentUser) {
        document.getElementById('username-display').textContent = currentUser.username;
        document.getElementById('user-avatar').src = currentUser.profile_picture
    }
}
































// ── Auth UI ───────────────────────────────────────────
function switchTab(tab) {
    ['login', 'register'].forEach(name => {
        document.getElementById(`${name}-form`).classList.toggle('active', name === tab);
    });
    document.querySelectorAll('.auth-tab').forEach((btn, i) => {
        btn.classList.toggle('active', (tab === 'login') === (i === 0));
    });
}

function updateAuthUI() {
    const loggedIn = !!authToken;
    document.getElementById('auth-section').classList.toggle('hidden', loggedIn);
    document.getElementById('create-form').classList.toggle('hidden', !loggedIn);
    document.getElementById('user-info').classList.toggle('hidden', !loggedIn);

    if (loggedIn && currentUser) {
        document.getElementById('username-display').textContent = currentUser.username;
        document.getElementById('user-avatar').src =
            currentUser.profile_picture || `https://i.pravatar.cc/150?u=${currentUser.username}`;
    }
}