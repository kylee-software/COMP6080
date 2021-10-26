// A helper you may want to use when uploading new images to the server.


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
                    response.json().then(response => {
                        resolve(response);
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
        .then((response) => {
            TOKEN = response['token'];
            USER_ID = response['userId']
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
            .then((response) => {
                TOKEN = response['token'];
                USER_ID = response['userId']
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
        .then ((response) => {
            const channelId = response.channelId;
            LAST_VISITED_CHANNEL = channelId;
            createChannelLabel(channelType, name, channelId);
            display('create-channel-popup', 'none');

            document.getElementById('create-channel-name').value = null;
            document.getElementById('create-channel-description').value = null;
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
    const currentChannel = event.target.id;
    enterChannel(USER_ID, currentChannel);
})

document.getElementById('public-channelLst').addEventListener('click', (event) => {
    const currentChannel = event.target.id;
    enterChannel(USER_ID, currentChannel);
})

// Change channel name
document.getElementById('channel-name-label').addEventListener('blur', () => {
    const channelName = document.getElementById('channel-name-label').innerText;
    updateChanelDetails(channelName, null);
})

// View the basic info of the channel
document.getElementById('channel-about').addEventListener('click', () => {
    getChannelDetails(LAST_VISITED_CHANNEL)
        .then((channelInfo) => {
            getUserInfo(channelInfo['creator'])
                .then ((creatorInfo) => {
                    const time = new Date(channelInfo['createdAt']).toDateString();
                    document.getElementById('channel-title-popup').innerText = channelInfo['name'];
                    // should add a profile pick as well and a link to their bio
                    document.getElementById('channel-creator').innerText = creatorInfo['name'];
                    document.getElementById('channel-create-date').innerText = time;
                    document.getElementById('channel-description').innerText = channelInfo['description'];

                    display('members-container', 'none');
                    display('about-container', 'flex');
                    display('channel-detail-popup', 'block');
                })
                .catch((errorMsg) => displayErrorMsg(errorMsg));
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));
})

document.getElementById('channel-description').addEventListener('blur', () => {
    const newDescription = document.getElementById('channel-description').innerText;
    updateChanelDetails(null, newDescription);
})

// View all the members of the channel
document.getElementById('channel-members').addEventListener('click', () => {
    document.getElementById('channel-title-popup').innerText = 'Members';
    document.getElementById('channel-invite').style.display = 'block';

    getChannelDetails(LAST_VISITED_CHANNEL)
        .then((channelInfo) => {
            const members = channelInfo['members'];

            for (const member in members) {
                getUserInfo(member)
                    .then((userInfo) => {
                        const name = userInfo['name'];
                        const photo = userInfo['image'];
                        createMemberBox(member.toString(), photo, name);
                    })
                    .catch((errorMsg) => displayErrorMsg(errorMsg));
            }
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));

    display('members-container', 'flex');
    display('about-container', 'none');
    display('channel-detail-popup', 'block');
})

document.getElementById('channel-detail-popup-close').addEventListener('click', () => {
    display('channel-detail-popup', 'none');
})

const enterChannel = (userId, targetChannel) => {
    LAST_VISITED_CHANNEL = targetChannel;
    getChannelDetails(LAST_VISITED_CHANNEL)
        .then((channelInfo) => {
            const members = channelInfo['members'];
            if (!members.includes(userId)) {
                document.getElementById('channel-name-label').readOnly = true;
                display('channel-about', 'none');
                display('channel-members', 'none');
                display('leave-channel', 'none');
                display('join-channel', 'inline-flex');
            } else {
                document.getElementById('channel-name-label').readOnly = false;
                display('channel-about', 'inline-flex');
                display('channel-members', 'inline-flex');
                display('leave-channel', 'inline-flex');
                display('join-channel', 'none');
                document.getElementById('members-count').innerText = `Members ${channelInfo['members'].length}`;
            }
            document.getElementById('channel-name-label').innerText = channelInfo['name'];
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));
}

document.getElementById('leave-channel').addEventListener('click', () => {
    apiFetch('POST', `channel/${parseInt(LAST_VISITED_CHANNEL)}/leave`, TOKEN, null)
        .then((response) => {
            enterChannel(USER_ID, LAST_VISITED_CHANNEL);
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));
})

document.getElementById('join-channel').addEventListener('click', () => {
    apiFetch('POST', `channel/${parseInt(LAST_VISITED_CHANNEL)}/join`, TOKEN, null)
        .then((response) => {
            enterChannel(USER_ID, LAST_VISITED_CHANNEL);
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));
})

const getChannelDetails = (channelId) => apiFetch('GET', `channel/${parseInt(channelId)}`, TOKEN, null);

const updateChanelDetails = (name, description) => {
    const body = {
        'name': name,
        'description': description,
    };

    apiFetch('PUT', `channel/${parseInt(LAST_VISITED_CHANNEL)}`, TOKEN, body)
        .catch((errorMsg) => displayErrorMsg(errorMsg));
}

const createMemberBox = (userId, profilePic, name) => {
    const memberLst = document.getElementById('members-container');
    const newMember = document.getElementById('member-info-box').cloneNode(true);
    const memberPhoto = newMember.childNodes[0];
    const memberName = newMember.childNodes[1];

    newMember.id = userId;
    memberPhoto.src = profilePic;
    memberName.innerText = name;
    display(userId, 'flex');
    memberLst.appendChild(newMember);
}

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

// display user profile
document.getElementById('members-container').addEventListener('click', (event) => {
    const targetMember = event.target.id;
    displayUserProfile(targetMember);
})

document.getElementById('user-profile-popup-close').addEventListener('click', () => {
    display('user-profile-popup', 'none');
})

const displayUserProfile = (userId) => {
    getUserInfo(userId)
        .then((userInfo) => {
            const photo = userInfo['image'];
            const name = userInfo['name'];
            const bio = userInfo['bio'];
            const email = userInfo['email'];

            document.getElementById('user-profile-photo').src = photo;
            document.getElementById('user-name').innerText = name;
            document.getElementById('user-bio').innerText = bio;
            document.getElementById('user-email').innerText = email;
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));

    document.getElementById('user-name').contentEditable = 'false';
    document.getElementById('user-bio').contentEditable = 'false';
    document.getElementById('user-email').readOnly = true;
    display('upload-photo', 'none');
    display('upload-photo-label', 'none');
    display('edit-user-name', 'none');
    display('edit-user-bio', 'none');
    display('edit-user-email', 'none');
    display('change-password-box', 'none');
    display('user-profile-popup', 'block');
}

const getUserInfo = (userId) => apiFetch('GET', `user/${parseInt(userId)}`, TOKEN, null);

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
// const node = document.getElementById('create-channel-popup').cloneNode(true);
// console.log(node);
// console.log(document.getElementById('create-channel-popup'));

// update channel name when the text box is blured




