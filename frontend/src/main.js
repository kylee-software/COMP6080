import {BACKEND_PORT} from './config.js';
// A helper you may want to use when uploading new images to the server.
import {fileToDataUrl} from './helpers.js';


let TOKEN = null;
let USER_ID = null;
let LAST_VISITED_CHANNEL = null;
// const storeToken = (token) => TOKEN = token;
// const storeToken = (userId, token) => localStorage.setItem(userId, token);

/* ┌───────────────────────────────────────────────────────────────────────────────────────────┐ */
/* │                                    Helper Functions                                       │ */
/* └───────────────────────────────────────────────────────────────────────────────────────────┘ */

const apiFetch = (method, path, token, body) => {
    const requestInfo = {
        method: method,
        headers: {'Content-Type': 'application/json'},
    };

    if (token !== null) requestInfo.headers['Authorization'] = `Bearer ${token}`;

    if (body !== null) requestInfo.body = JSON.stringify(body);

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

const display = (elementId, type) => document.getElementById(elementId).style.display = type;

const displayErrorMsg = (message) => {
    document.getElementById('error-message').innerText = message;
    display('errorMsg-popup', 'block');
}

/* ┌───────────────────────────────────────────────────────────────────────────────────────────┐ */
/* │                                      Milestone 1                                          │ */
/* └───────────────────────────────────────────────────────────────────────────────────────────┘ */

document.getElementById('switch-register').addEventListener('click', () => {
    display('login', 'none');
    display('register', 'block');
})

document.getElementById('switch-login').addEventListener('click', () => {
    display('login', 'block');
    display('register', 'none');
})

/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                           Login                                │ */
/* └────────────────────────────────────────────────────────────────┘ */

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
            display('main-page', 'grid');
            display('start-page', 'none');
        })
        .catch((errorMsg) => {
            displayErrorMsg(errorMsg);
        });
})

/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                            Register                            │ */
/* └────────────────────────────────────────────────────────────────┘ */

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

/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                            Error Popup                         │ */
/* └────────────────────────────────────────────────────────────────┘ */

document.getElementById('errorMsg-popup-close').addEventListener('click', () => {
    display('errorMsg-popup', 'none');
});

/* ┌───────────────────────────────────────────────────────────────────────────────────────────┐ */
/* │                                      Milestone 2                                          │ */
/* └───────────────────────────────────────────────────────────────────────────────────────────┘ */

/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                     Viewing a List of Channels                 │ */
/* └────────────────────────────────────────────────────────────────┘ */

document.getElementById('private-channel-label').addEventListener('click', () => {
    displayChannels('private');
})

document.getElementById('public-channel-label').addEventListener('click', () => {
    displayChannels('public');
})

const displayChannels = (type) => {
    const channelList = document.getElementById(`${type}-channelLst`);
    if (channelList.style.display === 'flex') {
        display(`${type}-channelLst`, 'none');
    } else {
        display(`${type}-channelLst`, 'flex');
    }
};

/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                      Creating a New Channel                    │ */
/* └────────────────────────────────────────────────────────────────┘ */

document.getElementById('add-private-channel').addEventListener('click', () => {
    document.getElementById('create-channel-type').value = 'private';
    display('create-channel-popup', 'block');
})

document.getElementById('add-public-channel').addEventListener('click', () => {
    document.getElementById('create-channel-type').value = 'public';
    display('create-channel-popup', 'block');
})

document.getElementById('create-channel').addEventListener('click', () => {
    const name = document.getElementById('create-channel-name').value;
    const channelType = document.getElementById('create-channel-type').value;
    const description = document.getElementById('create-channel-description').value;

    const body = {
        'name': name,
        'private': (channelType === 'private'),
        'description': description,
    }

    apiFetch('POST', 'channel', TOKEN, body)
        .then ((data) => {
            const channelId = data.channelId;
            createChannelLabel(channelType, name, channelId);
            display('create-channel-popup', 'none');
        })
        .catch((errorMsg) => {
            displayErrorMsg(errorMsg);
        });
})

const createChannelLabel = (type, channelName, channelId) => {
    const channelLst = document.getElementById(`${type}-channelLst`);
    let newChannel = document.getElementById('channel-item').cloneNode(true);
    newChannel.id = channelId;
    newChannel.innerText = channelName;
    channelLst.appendChild(newChannel);
    display(channelId, 'block');
    display(`${type}-channelLst`, 'flex');
};


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │               Viewing and Editing Channel Details              │ */
/* └────────────────────────────────────────────────────────────────┘ */

document.getElementById('private-channelLst').addEventListener('click', (event) => {
    const currentChannel = event.target;
    enterChannel(currentChannel);
})

document.getElementById('public-channelLst').addEventListener('click', (event) => {
    const currentChannel = event.target;
    enterChannel(currentChannel);
})

// Changi channel name
document.getElementById('channel-name-edit').addEventListener('blur', () => {
    const channelName = document.getElementById('channel-name-edit').innerText;
    updateChanelDetails(channelName, null);
})

// View the basic info of the channel
document.getElementById('channel-about').addEventListener('click', () => {
    display('members-container', 'none');
    display('about-container', 'flex');
    display('channel-detail-popup', 'block');
})

// View all the members of the channel
document.getElementById('channel-members').addEventListener('click', () => {
    display('members-container', 'flex');
    display('about-container', 'none');
    display('channel-detail-popup', 'block');
})

const enterChannel = (targetChannel) => {
    LAST_VISITED_CHANNEL = targetChannel.id;
    const channelInfo = getChannelDetails(LAST_VISITED_CHANNEL);
    document.getElementById('channel-name-edit').innerText = channelInfo['name'];
    document.getElementById('channel-members').innerText = `Members ${channelInfo['members'].length}`;
}

const getChannelDetails = (channelId) => {
    const data = null;
    apiFetch('GET', `channel/${parseInt(LAST_VISITED_CHANNEL)}`, TOKEN, null)
        .then((data) => {
            return data;
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));

    return data;
}
const updateChanelDetails = (name, description) => {
    const body = {
        'name': name,
        'description': description,
    };

    apiFetch('PUT', `channel/${parseInt(LAST_VISITED_CHANNEL)}`, TOKEN, body)
        .catch((errorMsg) => displayErrorMsg(errorMsg));
}

document.getElementById('channel-detail-popup-close').addEventListener('click', () => {
    display('channel-detail-popup', 'none');
})

/* ┌───────────────────────────────────────────────────────────────────────────────────────────┐ */
/* │                                     Milestone 3                                           │ */
/* └───────────────────────────────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                    Viewing Channel Messages                    │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                          Message Pagination                    │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                          Sending Messages                      │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                          Deleting Messages                     │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                           Editing Messages                     │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                        Reacting to Messages                    │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                          Pinning Messages                      │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌───────────────────────────────────────────────────────────────────────────────────────────┐ */
/* │                                       Milestone 4                                         │ */
/* └───────────────────────────────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                    Inviting Users to a Channel                 │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                            User Profiles                       │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │              Viewing and Editing User's Own Profile            │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌───────────────────────────────────────────────────────────────────────────────────────────┐ */
/* │                                     Milestone 5                                           │ */
/* └───────────────────────────────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                    Sending Photos in Channels                  │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                   Viewing Photos in Channels                   │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌───────────────────────────────────────────────────────────────────────────────────────────┐ */
/* │                                      Milestone 6                                          │ */
/* └───────────────────────────────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                        Infinite Scroll                         │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                       Push Notification                        │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌───────────────────────────────────────────────────────────────────────────────────────────┐ */
/* │                                       Milestone 7                                         │ */
/* └───────────────────────────────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                         Offline Access                         │ */
/* └────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                      Fragment Based URL Routing                │ */
/* └────────────────────────────────────────────────────────────────┘ */

//
// // Add event listeners to every channel
// document.getElementById('private-channelLst').addEventListener('click', (e) => {
//     console.log(e.target);
// })
//

// a function to refresh channel screen --> do this before the user logging out
// 1. map the userId to
const node = document.getElementById('create-channel-popup').cloneNode(true);
console.log(node);
console.log(document.getElementById('create-channel-popup'));

// update channel name when the text box is blured




