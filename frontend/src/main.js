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
    };

    if (token !== null) {
        requestInfo.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body !== null) {
        requestInfo.headers['body'] = JSON.stringify(body);
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

let TOKEN = null;
let USER_ID = null;
let DEFAULT_CHANNEL = null;
let PRIVATE_CHANNELS = [];
let PUBLIC_CHANNELS = [];
// const storeToken = (token) => TOKEN = token;
// const storeToken = (userId, token) => localStorage.setItem(userId, token);
// const removeToken = (useId) => localStorage.removeItem(useId);

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
                TOKEN = data['token'];
                USER_ID = data['userId']
                document.getElementById('main-page').style.display = 'grid';
                document.getElementById('start-page').style.display = 'none';
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
            TOKEN = data['token'];
            USER_ID = data['userId']
            document.getElementById('main-page').style.display = 'grid';
            document.getElementById('start-page').style.display = 'none';
        })
        .catch((errorMsg) => {
            displayErrorMsg(errorMsg);
        });
})

const createChannelLabel = (option, channelInfo) => {
    console.log(channelInfo);
    const channelName = channelInfo['id'];
    const channelId = channelInfo['name'];

    const channelsContainer = document.getElementById(`${option}-channelLst`);
    // if (option === 'private') {
    //     channelsContainer = document.getElementById('private-channelLst');
    // } else {
    //     channelsContainer = document.getElementById('public-channelLst');
    // }

    let newChannel = document.getElementById('channel-item').cloneNode(true);
    newChannel.id = channelId;
    newChannel.innerText = channelName;
    newChannel.style.display = 'block';
    channelsContainer.appendChild(newChannel);
    console.log(newChannel);
}
const displayChannels = (option, list) => {
    // let channelsContainer = null;
    // if (option === 'private') {
    //     channelsContainer = document.getElementById('private-channelLst');
    // } else {
    //     channelsContainer = document.getElementById('public-channelLst');
    // }

    for (const channel in list) {
        createChannelLabel(option, channel);
        // let newChannel = document.getElementById('channel-item').cloneNode(true);
        // newChannel.id = channel['id'];
        // newChannel.innerText = channel['name'];
        // newChannel.style.display = 'block';
        // channelsContainer.appendChild(newChannel);
        // console.log(newChannel);
    }
}
const getChannels = (token) => {
    apiFetch('GET', 'channel', token, null)
        .then((data) => {
            const channels = data['channels'];
            let publicChannels = [];
            let privateChannels = [];

            for (const channel in channels) {
                if (channel['private'] === false) {
                    publicChannels.push(channel);
                } else if (channel['private'] === true && channel['members'].includes(USER_ID)) {
                    privateChannels.push(channel);
                }
            }

            if (publicChannels !== null) {
                displayChannels('public', publicChannels);
                PUBLIC_CHANNELS.push(publicChannels);
            }
            if (privateChannels !== null) {
                displayChannels('private', privateChannels);
                PRIVATE_CHANNELS.push(privateChannels);
            }

        })
        .catch((errorMsg) => {
            console.log(errorMsg);
        });
}

document.getElementById('public-channels').addEventListener('click', () => {
    getChannels(TOKEN);
    display('public-channelLst', 'flex');
})

document.getElementById('private-channels').addEventListener('click', () => {
    getChannels(TOKEN);
    display('private-channelLst', 'flex');
})

document.getElementById('add-private-channel').addEventListener('mousedown', () => {
    display('create-channel-popup', 'block');
})

document.getElementById('add-public-channel').addEventListener('mousedown', () => {
    display('create-channel-popup', 'block');
})

//
// // Add event listeners to every channel
// const channels = [...(document.getElementById('public-channelLst').children), ...(document.getElementById('private-channelLst').children)];
//
// for (const channel in channels) {
//     channel.addEventListener('click', () => {
//         console.log(channel);
//     })
// }

// const createChannel = () => {
//     const name = document.getElementById('create-channel-name').value;
//     let option = document.getElementById('create-channel-private').value;
//     const description = document.getElementById('create-channel-description').value;
//
//     const body = {
//         'name': name,
//         'option': (option === true) ? true:false, // change later
//         'description': description,
//     }
//
//     apiFetch('POST', 'channel', TOKEN, body)
//         .then ((data) => {
//             option = (option == true) ? 'private':'public';
//             const channelInfo = {
//                 'name': name,
//                 'id': data['channelId'],
//             }
//             createChannelLabel(option, channelInfo);
//         })
//         .catch((errorMsg) => {
//             displayErrorMsg(errorMsg);
//         })
// }

