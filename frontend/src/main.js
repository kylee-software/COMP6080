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

// set cursor at the end of a text
const setEndCursor = (element) => {
   element.addEventListener('click', () => {
       element.focus();

        // Move the cursor to the end
        if (element.value.length !== 0) {
            const len = element.value.length;
            element.setSelectionRange(len, len);
        } else if (element.innerText.length !== 0) {
            const len = element.innerText.length;
            element.setSelectionRange(len, len);
        } else {
            element.setSelectionRange(0, 0);
        }
    })
}

const getMessageId = (channelId) => {
    let count = userMessageIdCounter.get(channelId);
    if (count !== undefined) {
        count += 1;
    } else {
        count = 0;
    }
    userMessageIdCounter.set(channelId, count);

    return apiFetch('GET', `message/${channelId}?start=${count}`, TOKEN, null)
        .then((messages) => {
            return messages['messages'][0]['id'];
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));
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
        })
        .catch((errorMsg) => {
            displayErrorMsg(errorMsg);
        });
})


/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                             Logout                             │ */
/* └────────────────────────────────────────────────────────────────┘ */

document.getElementById('logout').addEventListener('click', () => {
    display('start-page', 'block');
    display('register', 'none');
    display('main-page', 'none');
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

                const userInfo = {
                    "email": email,
                    "password": password,
                    "name": name,
                    "bio": 'empty',
                    "image": 'images/default-image.png',
                };

                editUserProfile(userInfo).catch((errorMsg) => displayErrorMsg(errorMsg));
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
    document.getElementById('create-channel-type').innerText = 'private';
    display('create-channel-popup', 'flex');
})

document.getElementById('add-public-channel').addEventListener('click', () => {
    document.getElementById('create-channel-type').innerText = 'public';
    display('create-channel-popup', 'flex');
})

document.getElementById('create-channel').addEventListener('click', () => {
    const name = document.getElementById('create-channel-name').value;
    const channelType = document.getElementById('create-channel-type').innerText;
    const description = document.getElementById('create-channel-description').innerText;

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
            document.getElementById('create-channel-description').innerText = null;
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

    document.getElementById(LAST_VISITED_CHANNEL.toString()).innerText = channelName;
})

// View the basic info of the channel
document.getElementById('channel-about').addEventListener('click', () => {
    getChannelDetails(LAST_VISITED_CHANNEL)
        .then((channelInfo) => {
            getUserInfo(channelInfo['creator'])
                .then ((creatorInfo) => {
                    const time = new Date(channelInfo['createdAt']).toDateString();
                    document.getElementById('channel-title-popup').innerText = 'About';
                    document.getElementById('channel-creator').innerText = creatorInfo['name'];
                    document.getElementById('channel-create-date').innerText = time;
                    document.getElementById('channel-description').innerText = channelInfo['description'];

                    display('members-container', 'none');
                    display('about-container', 'flex');
                    display('channel-detail-popup', 'flex');
                    display('channel-invite', 'none');
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
    display('channel-invite', 'block');

    getChannelDetails(LAST_VISITED_CHANNEL)
        .then((channelInfo) => {
            const members = channelInfo['members'];

            for (let i = 0; i < members.length; i++) {
                const member = members[i];
                getUserInfo(member)
                    .then((userInfo) => {
                        const name = userInfo['name'];
                        const photo = userInfo['image'];
                        createMemberBox(member.toString(), photo, name);
                    })
                    .catch((errorMsg) => displayErrorMsg(errorMsg));
            }

            document.getElementById('channel-title-popup').innerText = `Members ${members.length}`;
            display('members-container', 'flex');
            display('about-container', 'none');
            display('channel-detail-popup', 'flex');
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));
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
    const memberPhoto = newMember.childNodes[1];
    const memberName = newMember.childNodes[3];

    newMember.id = userId;
    memberPhoto.src = profilePic;
    memberName.innerText = name;
    memberLst.appendChild(newMember);
    display(userId, 'flex');

}

const displayNonMemberSrc = (channelName) => {
    document.getElementById('channel-name-label').readOnly = true;
    document.getElementById('channel-name-label').value = channelName;
    display('channel-about', 'none');
    display('channel-members', 'none');
    display('leave-channel', 'none');
    display('join-channel', 'inline-flex');
    document.getElementById('channel-name-container').style.pointerEvents = 'none';
    const sentMsgBtn = document.getElementById('sent-channel-message');
    sentMsgBtn.style.cursor = 'not-allowed';
    sentMsgBtn.removeEventListener('click', sentMessage);
}

const displayMemberSrc = (channelName) => {
    document.getElementById('channel-name-label').readOnly = false;
    document.getElementById('channel-name-label').value = channelName;
    display('channel-about', 'inline-flex');
    display('channel-members', 'inline-flex');
    display('leave-channel', 'inline-flex');
    display('join-channel', 'none');
    document.getElementById('channel-name-container').style.pointerEvents = 'auto';
    const channelNameInput = document.getElementById('channel-name-label');
    setEndCursor(channelNameInput);
    const sentMsgBtn = document.getElementById('sent-channel-message');
    sentMsgBtn.style.cursor = 'pointer';
    sentMsgBtn.addEventListener('click', sentMessage);
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

    const newMessageBox = document.getElementById('channel-message-box').cloneNode(true);
    newMessageBox.id = messageId.toString();
    const reactionEmojis = newMessageBox.children[0];
    reactionEmojis.id = `reactions-${messageId.toString()}`;

    const messageContainer = newMessageBox.children[1];
    const messageBody = messageContainer.children[0];

    // create user profile picture
    const userProfile = messageBody.children[0];
    userProfile.id = `${userProfile.id}-${messageId.toString()}`;

    const messageBodyRight = messageBody.children[1];

    // setting sender's name
    const senderName = messageBodyRight.children[0];
    senderName.id = `${senderName.id}-${messageId.toString()}`;

    getUserInfo(sender).then((userInfo) => {
        userProfile.children[0].src = userInfo['image'];
        senderName.innerText = userInfo['name'];
    }).catch((errorMsg) => displayErrorMsg(errorMsg));

    // setting user's message
    const senderMessage = messageBodyRight.children[1].children[0];
    senderMessage.id = `${senderMessage.id}-${messageId.toString()}`;
    senderMessage.innerText = message;

    // create message image
    const messageImg = messageBodyRight.children[1].children[1];
    messageImg.id = `${messageImg.id}-${messageId.toString()}`;

    // create reacted emojis
    const reactedEmojis = messageBodyRight.children[2];
    reactedEmojis.id = `${reactedEmojis.id}-${messageId.toString()}`;

    const messageBoxFooter = newMessageBox.children[2];

    // edited label
    const editedLabel = messageBoxFooter.children[0];
    editedLabel.id = `${editedLabel.id}-${messageId.toString()}`;

    // created date label
    const createdAtLabel = messageBoxFooter.children[1];
    createdAtLabel.id = `${createdAtLabel.id}-${messageId.toString()}`;

    // edit message button
    const editMessageIcon = messageBoxFooter.children[2];
    editMessageIcon.id = `${editMessageIcon.id}-${messageId.toString()}`;

    // pinned/un-pined
    const pinnedIcon = messageBoxFooter.children[3];
    pinnedIcon.id = `${pinnedIcon.id}-${messageId}`;

    document.getElementById('channel-messages').appendChild(newMessageBox);

    // pin message icon
    if (pinned) {
        pinnedIcon.src = 'images/pin-message.svg';
    } else {
        pinnedIcon.src = 'images/unpin-message.svg';
    }

    // edit message icon
    if (sender ===  USER_ID) {
        editMessageIcon.style.display = 'flex';
    } else {
        editMessageIcon.style.display = 'none';
    }

    // display message image
    if (image !== '') {
        messageImg.style.display = 'none';
    } else {
        messageImg.style.display = 'block';
    }

    // editedAt label
    if (!edited) {
        display(editedLabel.id, 'none')
        createdAtLabel.innerText = new Date(sentAt).toDateString();
    } else {
        display(editedLabel.id, 'inline')
        createdAtLabel.innerText = new Date(editedAt).toDateString();
    }

    // display reacted emojis
    for (let i = 0; i < reacts.length; i++) {
        createReactedEmoji(reacts[i]['react'], messageId);
    }

    display(newMessageBox.id, 'flex');
    messageBody.addEventListener('click', () => displayEmojis(messageId));
    editMessageIcon.addEventListener('click', () => displayEditMsgPopup(messageId));
    reactionEmojis.addEventListener('click', (event) => {
        reactMessage(messageId, event.target);
    })
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
//

const sentMessage = () => {
    const message = document.getElementById('channel-text-box');
    const image = document.getElementById('channel-text-box-image');

    const body = {
        'message': message.value,
        'image': (image.src === 'images/upload-image.svg') ? '' : image.src,
    };

    apiFetch('POST', `message/${LAST_VISITED_CHANNEL}`, TOKEN, body)
        .then(() => {
            getMessageId(LAST_VISITED_CHANNEL).then((messageId) => {

                let messageInfo = {
                    "id": messageId,
                    "message": message.value,
                    "image": image.src,
                    "sender": USER_ID,
                    "sentAt": (new Date()).toISOString(),
                    "edited": false,
                    "editedAt": "",
                    "pinned": false,
                    "reacts": [],
                };

                createChannelMessageBox(messageInfo);
                message.value = '';
                image.src = 'images/upload-image.svg';
            })
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));
}

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

document.getElementById('save-message-changes').addEventListener('click', () => {
    const messageId = document.getElementById('save-message-changes');
    const message = document.getElementById('edit-message-box');
    const img = document.getElementById('uploaded-photo');

    const oldMsg = document.getElementById(`sender-message-${messageId.name}`);
    const oldImg = document.getElementById(`message-image-${messageId.name}`);

    if ((message.innerText !== oldMsg.innerText) || (img.src !== oldImg.src)) {
        const body = {
            'message': message.innerText,
            'image': img.src,
        };
        apiFetch('PUT', `message/${LAST_VISITED_CHANNEL}/${parseInt(messageId.name)}`, TOKEN, body)
            .then(() => {
                const editedAt = new Date().toDateString();
                oldMsg.innerText = message.innerText;
                oldImg.src = img.src;
                display(`edited-${messageId.name}`, 'inline');
                document.getElementById(`createdAt-${messageId.name}`).innerText = editedAt;

                messageId.name = '';
                message.innerText = '';
                img.src = 'images/upload-image.svg';
                display('edit-message-popup', 'none');
            })
            .catch((errorMsg) => displayErrorMsg(errorMsg));
    }
})

document.getElementById('edit-message-close').addEventListener('click', () => {
    document.getElementById('edit-message-box').innerText = '';
    display('edit-message-popup', 'none');
})

const displayEditMsgPopup = (msgId) => {
    const message = document.getElementById(`sender-message-${msgId}`);
    const image = document.getElementById(`message-image-${msgId}`);

    document.getElementById('edit-message-box').innerText = message.innerText;
    if (image.src === '') {
        display('remove-image', 'none');
    } else {
        display('remove-image', 'inline');
        document.getElementById('uploaded-photo').src = image.src;
    }

    display('edit-message-popup', 'flex');

    document.getElementById('save-message-changes').name = msgId;
}

/* ┌────────────────────────────────────────────────────────────────┐ */
/* │                        Reacting to Messages                    │ */
/* └────────────────────────────────────────────────────────────────┘ */

const displayEmojis = (msgId) => {
    const visibility = document.getElementById(`reactions-${msgId}`).style.visibility;

    if (visibility === 'visible') {
        document.getElementById(`reactions-${msgId}`).style.visibility = 'hidden';
    } else {
        document.getElementById(`reactions-${msgId}`).style.visibility = 'visible';
    }
};

// react message
const reactMessage = (messageId, image) => {

    const emojiName = (image.src.split('/')).pop().split('.')[0];

    apiFetch('POST', `message/react/${LAST_VISITED_CHANNEL}/${parseInt(messageId)}`, TOKEN, {'react': emojiName})
        .then(() => {
            createReactedEmoji(emojiName, messageId);
            // document.getElementById(`${emojiName}-${messageId}`).className = 'reacted-emoji';
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));

    document.getElementById('reactions').style.visibility = 'hidden';
};

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
        newEmoji.className = 'reacted-emoji';

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
    displayMemberProfile(targetMember);
})

document.getElementById('display-user-profile-popup-close').addEventListener('click', () => {
    display('user-profile-popup', 'none');
})

document.querySelectorAll('.user-message-profile').forEach(msgProfile => {
    msgProfile.addEventListener('click', () => {
        const userId = msgProfile.id.split('-').pop();
        displayMemberProfile(USER_ID);
    })
})

const displayMemberProfile = (userId) => {
    getUserInfo(userId)
        .then((userInfo) => {
            const photo = userInfo['image'];
            const name = userInfo['name'];
            const bio = userInfo['bio'];
            const email = userInfo['email'];

            document.getElementById('user-profile-photo').src = photo;
            document.getElementById('user-name').innerText = name;
            document.getElementById('user-bio').innerText = bio;
            document.getElementById('user-email').value = email;
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));

    document.getElementById('user-email').readOnly = true;

    display('edit-user-information', 'none');
    display('display-user-profile', 'flex');
    display('edit-user-profile', 'none');
    display('user-profile-popup', 'flex');
}

const getUserInfo = (userId) => apiFetch('GET', `user/${parseInt(userId)}`, TOKEN, null);

/* ┌────────────────────────────────────────────────────────────────┐ */
/* │              Viewing and Editing User's Own Profile            │ */
/* └────────────────────────────────────────────────────────────────┘ */

document.getElementById('user-profile').addEventListener('click', () => {
    displayUserProfile(USER_ID);
    display('user-profile-popup', 'flex');
})
document.getElementById('edit-user-information').addEventListener('click', () => {
    const image = document.getElementById('profile-image');
    const name = document.getElementById('edit-user-name');
    const bio = document.getElementById('edit-user-bio');
    let email = document.getElementById('edit-user-email');

    getUserInfo(USER_ID)
        .then((userInfo) => {
            image.src = userInfo['image'];
            name.value = userInfo['name'];
            bio.value = userInfo['bio'];
            email.value = userInfo['email'];
        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));

    display('edit-show-new-password', 'block');
    display('edit-hide-new-password', 'none');
    display('edit-show-confirm-password', 'block');
    display('edit-hide-confirm-password', 'none');
    display('edit-user-profile', 'flex');
    display('display-user-profile', 'none');
})
document.getElementById('save-user-profile-changes').addEventListener('click', () => {
    const image = document.getElementById('profile-image');
    const name = document.getElementById('edit-user-name');
    const bio = document.getElementById('edit-user-bio');
    const email = document.getElementById('edit-user-email');
    const newPassword = document.getElementById('edit-new-password');
    const confirmPassword = document.getElementById('edit-confirm-password');

    if (newPassword.value !== confirmPassword.value) {
        displayErrorMsg('Passwords do not match!');
    } else {
        const userInfo = {
            "email": email.value,
            "password": newPassword.value,
            "name": name.value,
            "bio": bio.value,
            "image": image.src,
        };

        editUserProfile(userInfo).catch((errorMsg) => displayErrorMsg(errorMsg));

        document.getElementById('user-profile-photo').src = image.src;
        document.getElementById('user-name').innerText = name.value;
        document.getElementById('user-bio').innerText = bio.value;
        document.getElementById('user-email').value = email.value;
        display('edit-user-profile', 'none');
        display('display-user-profile', 'flex');
    }

    newPassword.value = '';
    confirmPassword.value = '';
})
document.getElementById('edit-show-new-password').addEventListener('click', () => {
    displayPassword(document.getElementById('edit-new-password'), 'show');
    display('edit-show-new-password', 'none');
    display('edit-hide-new-password', 'inline');
})
document.getElementById('edit-hide-new-password').addEventListener('click', () => {
    displayPassword(document.getElementById('edit-new-password'), 'hide');
    display('edit-hide-new-password', 'none');
    display('edit-show-new-password', 'inline');
})
document.getElementById('edit-show-confirm-password').addEventListener('click', () => {
    displayPassword(document.getElementById('edit-confirm-password'), 'show');
    display('edit-show-confirm-password', 'none');
    display('edit-hide-confirm-password', 'inline');
})
document.getElementById('edit-hide-confirm-password').addEventListener('click', () => {
    displayPassword(document.getElementById('edit-confirm-password'), 'hide');
    display('edit-hide-confirm-password', 'none');
    display('edit-show-confirm-password', 'inline');
})
document.getElementById('edit-user-profile-popup-close').addEventListener('click', () => {
    display('edit-user-profile', 'none');
    display('display-user-profile', 'flex');
})
// document.getElementById('upload-photo-btn').addEventListener('click', () => {
//
//     // upload photo;
//
// })

const displayUserProfile = (userId) => {
    getUserInfo(userId)
        .then((userInfo) => {
            const photo = userInfo['image'];
            const name = userInfo['name'];
            const bio = userInfo['bio'];
            const email = userInfo['email'];
            const password = userInfo['password'];

            document.getElementById('user-profile-photo').src = photo;
            document.getElementById('user-name').innerText = name;
            document.getElementById('user-bio').innerText = bio;
            document.getElementById('user-email').value = email;

        })
        .catch((errorMsg) => displayErrorMsg(errorMsg));

    document.getElementById('user-email').readOnly = true;

    display('edit-user-information', 'flex');
    display('display-user-profile', 'flex');
    display('edit-user-profile', 'none');
    display('user-profile-popup', 'flex');
};
const displayPassword = (element, type) => {
    if (type === 'hide') {
        element.type = 'password';
    } else {
        element.type = 'text';
    }
}
const editUserProfile = (userInfo) => {
    return apiFetch('PUT', 'user', TOKEN, userInfo);
}

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


// a function to refresh channel screen --> do this before the user logging out
// 1. map the userId to
// const node = document.getElementById('create-channel-popup').cloneNode(true);
// console.log(node);
// console.log(document.getElementById('create-channel-popup'));





