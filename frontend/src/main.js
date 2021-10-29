// A helper you may want to use when uploading new images to the server.


let TOKEN = null;
let USER_ID = null;
let LAST_VISITED_CHANNEL = null;
// const storeToken = (token) => TOKEN = token;
// const storeToken = (userId, token) => localStorage.setItem(userId, token);
let userMessageIdCounter = new Map();
let userLastVisitedChannel = new Map();


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
    display('errorMsg-popup', 'flex');
}


/* ┌───────────────────────────────────────────────────────────────────────────────────────────┐ */
/* │                                      Milestone 1                                          │ */
/* └───────────────────────────────────────────────────────────────────────────────────────────┘ */

document.getElementById('switch-register').addEventListener('click', () => {
    display('login', 'none');
    display('register', 'flex');
})

document.getElementById('switch-login').addEventListener('click', () => {
    display('login', 'flex');
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
            listAllChannels();
            display('main-page', 'grid');
            display('start-page', 'none');
            createChannelMessageBox(1234);
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
                listAllChannels();
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

document.getElementById('joined-public-channel-label').addEventListener('click', () => {
    displayChannels('joined-public');
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

const listAllChannels = () => {
    apiFetch('GET', 'channel', TOKEN, null)
        .then((response) => {
            const channels = response['channels'];
            for (let i = 0; i < channels.length; i++) {
                const members = channels[i]['members'];
                if (channels[i]['private'] === true && members.includes(USER_ID)) {
                    createChannelLabel('private', channels[i]['name'], channels[i]['id']);
                } else if (channels[i]['private'] === false) {
                    if (members.includes(USER_ID)) {
                        createChannelLabel('joined-public', channels[i]['name'], channels[i]['id']);
                    } else {
                        createChannelLabel('public', channels[i]['name'], channels[i]['id']);
                    }
                }
            }
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));
}


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                      Creating a New Channel                    │ */
/* └────────────────────────────────────────────────────────────────┘ */

document.getElementById('add-private-channel').addEventListener('click', () => {
    document.getElementById('create-channel-type').value = 'private';
    display('create-channel-popup', 'flex');
})

document.getElementById('add-public-channel').addEventListener('click', () => {
    document.getElementById('create-channel-type').value = 'public';
    display('create-channel-popup', 'flex');
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
            if (channelType === 'public') {
                createChannelLabel(`joined-${channelType}`, name, channelId);
            } else {
                createChannelLabel(channelType, name, channelId);
            }
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
    newChannel.id = channelId.toString();
    newChannel.innerText = channelName;
    channelLst.appendChild(newChannel);
    display(channelId, 'block');
    // display(`${type}-channelLst`, 'flex');
};

document.getElementById('create-channel-close').addEventListener('click', () => {
    display('create-channel-popup', 'none');
})


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │               Viewing and Editing Channel Details              │ */
/* └────────────────────────────────────────────────────────────────┘ */

document.getElementById('private-channelLst').addEventListener('click', (event) => {
    LAST_VISITED_CHANNEL = event.target.id;
    const name = event.target.innerText;
    displayMemberSrc(name);
})

document.getElementById('joined-public-channelLst').addEventListener('click', (event) => {
    LAST_VISITED_CHANNEL = event.target.id;
    const name = event.target.innerText;
    displayMemberSrc(name);
})

document.getElementById('public-channelLst').addEventListener('click', (event) => {
    LAST_VISITED_CHANNEL = event.target.id;
    const name = event.target.innerText;
    displayNonMemberSrc(name);
})

// Change channel name
document.getElementById('channel-name-label').addEventListener('blur', () => {
    const channelName = document.getElementById('channel-name-label').value;
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
                    display('channel-detail-popup', 'flex');
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
            document.getElementById('channel-title-popup').innerText = `Members ${members.length}`;
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));

    display('members-container', 'flex');
    display('about-container', 'none');
    display('channel-detail-popup', 'flex');
})

document.getElementById('channel-detail-popup-close').addEventListener('click', () => {
    display('channel-detail-popup', 'none');
})

document.getElementById('leave-channel').addEventListener('click', () => {
    apiFetch('POST', `channel/${parseInt(LAST_VISITED_CHANNEL)}/leave`, TOKEN, null)
        .then(() => {
            const privateChannelLst = document.getElementById('private-channelLst');
            const joinedChannelLst = document.getElementById('joined-channel-channelLst');
            const publicChannelLst = document.getElementById('public-channelLst');
            const targetChannel = document.getElementById(LAST_VISITED_CHANNEL);
            if (privateChannelLst.contains(targetChannel)) {
                privateChannelLst.removeChild(targetChannel);
                LAST_VISITED_CHANNEL = null;
            } else {
                publicChannelLst.appendChild(targetChannel);
                joinedChannelLst.removeChild(targetChannel);
                displayNonMemberSrc(targetChannel.value);
            }
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));
})

document.getElementById('join-channel').addEventListener('click', () => {
    apiFetch('POST', `channel/${parseInt(LAST_VISITED_CHANNEL)}/join`, TOKEN, null)
        .then(() => {
            const joinedChannelLst = document.getElementById('joined-public-channelLst');
            const publicChannelLst = document.getElementById('public-channelLst');
            const targetChannel = document.getElementById(LAST_VISITED_CHANNEL);

            joinedChannelLst.appendChild(targetChannel);
            publicChannelLst.removeChild(targetChannel);
            displayMemberSrc(targetChannel.value);
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
    // console.log(newMember.childNodes);
    const memberPhoto = newMember.childNodes[0];
    const memberName = newMember.childNodes[1];

    newMember.id = userId;
    memberPhoto.src = profilePic;
    memberName.innerText = name;
    display(userId, 'flex');
    memberLst.appendChild(newMember);
}

const displayNonMemberSrc = (channelName) => {
    document.getElementById('channel-name-label').readOnly = true;
    document.getElementById('channel-name-label').value = channelName;
    display('channel-about', 'none');
    display('channel-members', 'none');
    display('leave-channel', 'none');
    display('join-channel', 'inline-flex');
}

const displayMemberSrc = (channelName) => {
    document.getElementById('channel-name-label').readOnly = false;
    document.getElementById('channel-name-label').value = channelName;
    display('channel-about', 'inline-flex');
    display('channel-members', 'inline-flex');
    display('leave-channel', 'inline-flex');
    display('join-channel', 'none');
}

/* ┌───────────────────────────────────────────────────────────────────────────────────────────┐ */
/* │                                     Milestone 3                                           │ */
/* └───────────────────────────────────────────────────────────────────────────────────────────┘ */


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                    Viewing Channel Messages                    │ */
/* └────────────────────────────────────────────────────────────────┘ */

const displayChannelMessages = (channelId) => {
    let start = 0;
    let messageCount = 26;
    while (messageCount > 0) {
        apiFetch('GET', `message/${LAST_VISITED_CHANNEL}`, TOKEN, start)
            .then((response) => {
                loadMessages(response['messages']);
                messageCount = response['messages'].length;
                start += 25;
            }).catch((errorMsg) => {
                displayErrorMsg(errorMsg);
            });
    }
};

const loadMessages = (messages) => {
    for (let i = 0; i < messages.length; i++) {
        createChannelMessageBox(messages[i]);
    }
}

const createChannelMessageBox = (messageInfo) => {
    const messageId = messageInfo['id'];
    const message = messageInfo['message'];
    const image = messageInfo['image'];
    const sender = messageInfo['sender'];
    const sentAt = messageInfo['sentAt'];
    const edited = messageInfo['edited'];
    const editedAt = messageInfo['editedAt'];
    const pinned = messageInfo['pinned'];
    const reacts = messageInfo['reacts'];

    let newMessageBox = document.getElementById('channel-message-box').cloneNode(true);
    newMessageBox.id = messageId.toString();
    const reactionEmojis = newMessageBox.children[0];
    reactionEmojis.id = `reactions-${messageId.toString()}`;

    const messageContainer = newMessageBox.children[1];
    const messageMainBox = messageContainer.children[0];
    const messageBox = messageMainBox.children[1];

    // create user profile picture
    const userProfile = messageMainBox.children[0];
    userProfile.id = `${userProfile.id}-${messageId}`;
    // userProfile.children[0].src = image; Need to change this, have to get the user's info

    // setting sender's name
    const senderName = messageBox.children[0].children[0];
    senderName.id = `${senderName.id}-${messageId}`;
    // senderName.innerText = senderName; --> need to edit need to get sender info

    getUserInfo(sender).then((userInfo) => {
        userProfile.children[0].src = userInfo['image'];
        senderName.innerText = userInfo['name'];
    }).catch((errorMsg) => displayErrorMsg(errorMsg));

    // setting user's message
    const senderMessage = messageBox.children[1].children[0];
    senderMessage.id = `${senderMessage.id}-${messageId}`;
    senderMessage.innerText = message;

    // create message image
    const messageImgBox = messageBox.children[2];
    messageImgBox.children[0] = `${messageImg.id}-${messageId}`;
    if (image !== null) {
        messageImgBox.style.display = 'inline-flex';
    } else {
        messageImgBox.style.display = 'inline-flex';
    }

    // create reacted emojis
    const reactedEmojis = messageBox.children[3];
    reactedEmojis.id = `${reactedEmojis.id}-${messageId}`;

    const messageBoxFooter = messageContainer.children[1];

    // edited label
    const editedLabel = messageBoxFooter.children[0];
    editedLabel.id = `${editedLabel.id}-${messageId}`;

    // created date label
    const createdAtLabel = messageBoxFooter.children[1];
    createdAtLabel.id = `${createdAtLabel.id}-${messageId}`;

    if (!edited) {
        editedLabel.style.visibility = 'hidden';
        createdAtLabel.innerText = new Date(sentAt).toDateString();
    } else {
        editedLabel.style.visibility = 'visible';
        createdAtLabel.innerText = new Date(editedAt).toDateString();
    }

    // edit message
    const editMessageIcon = messageBoxFooter.children[2];
    editMessageIcon.id = `${editMessageIcon.id}-${messageId}`;

    if (sender ===  USER_ID) {
        editMessageIcon.style.display = 'flex';
    } else {
        editMessageIcon.style.display = 'none';
    }

    // pinned/un-pined
    const pinnedIcon = messageBoxFooter.children[3];
    pinnedIcon.id = `${pinnedIcon.id}-${messageId}`;

    if (pinned) {
        pinnedIcon.src = 'images/pin-message.svg';
    } else {
        pinnedIcon.src = 'images/unpin-message.svg';
    }

    document.getElementById('channel-messages').appendChild(newMessageBox);

    for (let i = 0; i < reacts.length; i++) {
        createReactedEmoji(reacts[i]['react'], messageId);
    }

};

/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                          Message Pagination                    │ */
/* └────────────────────────────────────────────────────────────────┘ */

window.addEventListener('scroll', () => {
    if (window.screenY + window.innerHeight >= document.documentElement.scrollHeight) {
        displayChannelMessages(LAST_VISITED_CHANNEL);
    }
})

/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                          Sending Messages                      │ */
/* └────────────────────────────────────────────────────────────────┘ */

document.getElementById('sent-channel-message').addEventListener('click', () => {
    const message = document.getElementById('channel-text-box').innerText;
    const image = document.getElementById('channel-text-box-image').src;

    const body = {
        'message': message,
        'image': (image === null) ? '' : image,
    };

    apiFetch('POST', `message/${LAST_VISITED_CHANNEL}`, TOKEN, body)
        .then(() => {
            let messageId = USER_ID.toString();
            let count = 0;
            if (userMessageIdCounter.has(USER_ID)) {
                count = userMessageIdCounter.get(USER_ID) + 1;
                userMessageIdCounter.set(USER_ID, count);
            } else {
                userMessageIdCounter.set(USER_ID, 1);
                count = 1;
            }

            messageId = parseInt(messageId + count.toString());

            let messageInfo = {
                "id": messageId,
                "message": message,
                "image": image,
                "sender": USER_ID,
                "sentAt": (new Date()).toISOString(),
                "edited": false,
                "editedAt": "",
                "pinned": false,
                "reacts": [],
            };

            createChannelMessageBox(messageInfo);
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));

})

/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                          Deleting Messages                     │ */
/* └────────────────────────────────────────────────────────────────┘ */

document.getElementById('delete-message').addEventListener('click', () => {
    const messageId = document.getElementById('save-message-changes').name;

    apiFetch('DELETE', `message/${LAST_VISITED_CHANNEL}/${messageId}`, TOKEN, null)
        .then(() => {
            const messageBox = document.getElementById(`channel-message-box-${messageId}`);
            document.getElementById('channel-messages').removeChild(messageBox);
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));
})


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                           Editing Messages                     │ */
/* └────────────────────────────────────────────────────────────────┘ */

document.querySelectorAll('.message-info-container').forEach(messageFooter => {
    messageFooter.children[2].addEventListener('click', () => {
        const messageId = (messageFooter.children[2].id.split('-')).pop();
        const message = document.getElementById('edit-message-box');
        const img = document.getElementById('uploaded-image');

        message.innerText = document.getElementById(`sender-message-${messageId}`).innerText;
        img.src = document.getElementById(`message-image-${messageId}`).src;

        document.getElementById('save-message-changes').name = messageId;
        display('edit-message-close', 'block');
    })
})

document.getElementById('save-message-changes').addEventListener('click', () => {
    const messageId = this.name;
    this.name = '';

    let message = document.getElementById('edit-message-box').innerText;
    let img = document.getElementById('uploaded-image').src;

    let oldMsg = document.getElementById(`sender-message-${messageId}`).innerText;
    let oldImg = document.getElementById(`message-image-${messageId}`).src;

    if (message !== oldMsg || img !== oldImg) {
        const body = {
            'message': message,
            'image': img,
        };
        apiFetch('PUT', `message/${LAST_VISITED_CHANNEL}/${messageId}`, TOKEN, body)
            .then(() => {
                const editedAt = new Date().toDateString();
                oldMsg = message;
                oldImg = img;
                document.getElementById(`edited-${messageId}`).style.visibility = 'visible';
                document.getElementById(`createdAt-${messageId}`).innerText = editedAt;
            })
            .catch((errorMsg) => displayErrorMsg(errorMsg));
    } else {
        message = '';
        img = '';
    }
})

document.getElementById('edit-image').addEventListener('click', () => {
    const src = "";
    document.getElementById('uploaded-image').src = src;
})


document.getElementById('edit-message-close').addEventListener('click', () => {
    display('edit-message-close', 'none');
})

/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                        Reacting to Messages                    │ */
/* └────────────────────────────────────────────────────────────────┘ */


// the emojis will show when the mouse is hovering over it, then stay visible
// when click on the message's main box to allow users to react to a message.
document.querySelectorAll('.message-container').forEach(messageBox => {
    messageBox.addEventListener('mouseover', () => {
        document.getElementById('reactions').style.visibility = 'visible';
    })
})

document.querySelectorAll('.message-container').forEach(messageBox => {
    messageBox.addEventListener('click', () => {
        document.getElementById('reactions').style.visibility = 'visible';
    })
})

// react message
document.querySelectorAll('.emoji-reactions-container').forEach(emojis => {
    emojis.addEventListener('click', (event) => {
        let targetEmoji = event.target;
        // let emojiId = (targetEmoji.id).split('-');
        // let messageId = emojiId.pop();
        // let emojiName = emojiId.join('-');

        let messageId = (emojis.id.split('-')).pop();
        let emojiName = (targetEmoji.src.split('/'))[1].split('.')[0];

        apiFetch('POST', `message/react/${LAST_VISITED_CHANNEL}/${parseInt(messageId)}`, TOKEN, {'react': emojiName})
            .then(() => {
                createReactedEmoji(emojiName, messageId);
                document.getElementById(`${emojiName}-${messageId}`).className = 'reacted-emoji';
            })
            .catch((errorMsg) => displayErrorMsg(errorMsg));

        document.getElementById('reactions').style.visibility = 'hidden';
    });
})

// un-react message
document.querySelectorAll('.reacted-emoji').forEach(reactedEmoji => {
    reactedEmoji.addEventListener('click', () => {
        const emojiId = reactedEmoji.id;
        let emojiName = emojiId.split('-');
        let messageId = emojiName.pop();
        emojiName = emojiName.join('-');
        const reactions = document.getElementById(`message-reactions-${messageId}`);

        apiFetch('POST', `message/unreact/${LAST_VISITED_CHANNEL}/${parseInt(messageId)}`, TOKEN, {'react': emojiName})
            .then(() => {
                let count = parseInt(reactedEmoji.children[1].innerText);
                if (count <= 1) {
                    reactions.removeChild(reactions);
                } else {
                    reactedEmoji.children[1].innerText = (count - 1).toString();
                    reactedEmoji.className = 'emoji-container';
                }
            })
            .catch((errorMsg) => displayErrorMsg(errorMsg));
    })
})

const createReactedEmoji = (emojiName, messageId) => {
    const reactedEmojis = document.getElementById(`message-reactions-${messageId}`);
    const emojiId = `${emojiName}-${messageId}`;
    let newEmoji = document.getElementById(emojiId);
    if (newEmoji === null) {
        newEmoji = document.createElement('div');
        newEmoji.id = emojiId;
        // newEmoji.className = 'emoji-container';

        let img = document.createElement('img');
        img.src = `images/${emojiName}.svg`;
        img.className = 'emoji-style';
        newEmoji.appendChild(img);

        let reactCount = document.createElement('span');
        reactCount.innerText = '1';
        newEmoji.appendChild(reactCount);

        reactedEmojis.appendChild(newEmoji);
    } else {
        let count = newEmoji.children[1].innerText;
        newEmoji.children[1].innerText = (parseInt(count) + 1).toString();
    }
}


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                          Pinning Messages                      │ */
/* └────────────────────────────────────────────────────────────────┘ */

document.querySelectorAll('.message-info-container').forEach(messageFooter => {
    const target = messageFooter.children[3];
    target.addEventListener('click', () => {
        const messageId = target.id.split('-').pop();

        if (target.src === 'images/unpin-message.svg') {
            apiFetch('POST', `message/pin/${LAST_VISITED_CHANNEL}/${messageId}`, TOKEN, null)
                .then(() => {
                    document.getElementById(`pinned-${messageId}`).src = 'images/pin-message.svg';
                })
                .catch((errorMsg) => displayErrorMsg(errorMsg));
        } else {
            apiFetch('POST', `message/unpin/${LAST_VISITED_CHANNEL}/${messageId}`, TOKEN, null)
                .then(() => {
                    document.getElementById(`pinned-${messageId}`).src = 'images/unpin-message.svg';
                })
                .catch((errorMsg) => displayErrorMsg(errorMsg));
        }
    })
})

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
    display('user-profile-popup', 'flex');
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




