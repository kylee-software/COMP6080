import {BACKEND_PORT} from './config.js';
// A helper you may want to use when uploading new images to the server.
import {fileToDataUrl} from './helpers.js';

// const displayEventListener = (elementId, option, func) => {
//     document.getElementById(elementId).addEventListener(option, () => func);
// };

const display = (elementId, option) => document.getElementById(elementId).style.display = option;

// Switching back and forth between login and register page
// displayEventListener('switch-register', 'click', display('login', 'none'));
document.getElementById('switch-register').addEventListener('click', () => {
    display('login', 'none');
    display('register', 'block');
})

document.getElementById('switch-login').addEventListener('click', () => {
    display('login', 'block');
    display('register', 'none');
})

const displayErrorMsg = (message) => {
    document.getElementById('error-message').innerText = message;
    display('errorMsg-popup', 'block');
}
document.getElementById('x-close').addEventListener('click', () => display('errorMsg-popup', 'none'));
document.getElementById('errorMsg-close').addEventListener('click', () => display('errorMsg-popup', 'none'));


const apiFetch = (method, path, token, body) => {
    const requestInfo = {
        method: method,
        headers: {'Content-Type': 'application/json'},
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
            .catch((error) => console.log(error));
    });
}

const storeToken = (userId, token) => localStorage.setItem(userId, token);
const removeToken = (useId) => localStorage.removeItem(useId);

document.getElementById('register-submit').addEventListener('click', () => {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-pass').value;
    const confirmPass = document.getElementById('confirm-pass').value;
    const name = document.getElementById('register-name').value;

    // Check if the two passwords are the same or not
    if (password !== confirmPass) {
        displayErrorMsg('Passwords do not match!');
    } else {
        const body = {
            'email': email,
            'password': password,
            'name': name,
        };

        apiFetch('POST', 'auth/register', null, body)
            .then((data) => {
                storeToken(data['userId'], data['token'])
            })
            .catch((errorMsg) => displayErrorMsg(errorMsg));
    }
})

document.getElementById('login-submit').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const body = {
        'email': email,
        'password': password,
    };

    apiFetch('POST', 'auth/login', null, body)
        .then((data) => {
            storeToken(data['userId'], data['token']);
        })
        .catch((errorMsg) => {
            displayErrorMsg(errorMsg);
        });
})
