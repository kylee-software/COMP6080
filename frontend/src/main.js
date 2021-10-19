import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// Switching back and forth between login and register page
document.getElementById('switch-register').addEventListener('click', () => {
    document.getElementById('login').hidden = true;
    document.getElementById('register').hidden = false;
})

document.getElementById('switch-login').addEventListener('click', () => {
    document.getElementById('register').hidden = true;
    document.getElementById('login').style.visibility = 'visible';
})

const apiFetch = (method, path, token, body) => {
    const requestInfo = {
        method: method,
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    };

    if (token !== null) {
        requestInfo.headers['Authorization'] = `Bearer ${token}`;
    }

    return new Promise((resolve, reject) => {
        fetch(`http://localhost:5005/${path}`, requestInfo)
        .then((response) => {
            if (response.status === 400 || response.status === 404) {
                response.json().then((errorMsg) => {
                    reject(errorMsg['error']);
                });
            } else if (response.status === 200) {
                response.json().then(data => {
                    resolve(data);
                });
            }
        })
        .catch((error) => console.log(err));
    });
}

let TOKEN = null;
const storeToken = (token) => TOKEN = token;

document.getElementById('register-submit').addEventListener('click', () => {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-pass').value;
    const confirmPass = document.getElementById('confirm-pass').value;
    const name = document.getElementById('register-name').value;

    // Check if the two passwords are the same or not
    if (password !== confirmPass) {
        alert('passwords are not identical');
    }

    const body = {
        'email': email,
        'password': password,
        'name': name,
    };

    apiFetch('POST', 'auth/register', null, body)
    .then(data => {
        storeToken(data['token']);
    })
})

document.getElementById('login-submit').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const body = {
        'email': email,
        'password': password,
    };

    apiFetch('POST', 'auth/login', null, body)
    .then(data => {
        storeToken(data['token']);
    });
})
