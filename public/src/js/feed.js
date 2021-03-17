var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var video = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var picture;
var locationBtn = document.querySelector('#location-btn');
var locationLoader = document.querySelector('#location-loader');
var fetchedLocation;

locationBtn.addEventListener('click', function (event) {
    if (!('geolocation' in navigator)) {
        return
    }
    locationBtn.style.display = 'none';
    locationLoader.style.display = 'block';
    navigator.geolocation.getCurrentPosition(function (position) {
        locationBtn.style.display = 'inline';
        locationLoader.style.display = 'none';
        fetchedLocation = {lat: position.coords.latitude, lng: 0};
        locationInput.value = 'Tehran';
        locationInput.classList.add('is-focused')
    }, function (err) {
        console.log(err);
        locationBtn.style.display = 'inline';
        locationLoader.style.display = 'none';
        alert('cant get location enter manually');
        fetchedLocation = {lat: null, lng: null};
    }, {timeout: 7000}) // give it 7 second to get current location

});

function intializeLocation() {
    if (!('geolocation' in navigator)) {
        locationBtn.style.display = 'none'
    }
}

function intializeMedia() {
    if (!('mediaDevices' in navigator)) {
        navigator.mediaDevices = {}
    }
    if (!('getUserMedia') in navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia = function (constraints) { // constraints = is it audio or video ?
            var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMediaW

            if (!getUserMedia) {
                return Promise.reject(new Error('user media is not implemented'))
            }
            return new Promise(function (resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            })
        }
    }

    navigator.mediaDevices.getUserMedia({video: true})
        .then(function (stream) {
            video.srcObject = stream;
            video.style.display = 'block'
        })
        .catch(function (err) { // when have'nt access to camera
            imagePickerArea.style.display = 'block'
        })
}


function sendData() {
    var postData = new FormData();
    var id = new Date().toISOString();
    postData.append('id', id);
    postData.append('title', titleInput.value);
    postData.append('location', locationInput.value);
    postData.append('rawLocationLat', fetchedLocation.lat);
    postData.append('rawLocationLng', fetchedLocation.lng);
    postData.append('file', picture, id + '.png'); //replace image name with id.ong
    fetch('https://us-central1-pwagram-b0804.cloudfunctions.net/storePostData', {
        method: 'POST',
        body: postData
    })
        .then(function (res) {
            console.log('Sent Data' + res);

            let url = 'https://pwagram-b0804.firebaseio.com/posts.json';

            fetch(url)
                .then(function (res) {
                    return res.json();
                })
                .then(function (data) {
                    networkDataReceived = true;
                    console.log('From web', data);
                    var dataArray = [];
                    for (var key in data) {
                        dataArray.push(data[key]);
                    }
                    updateUI(dataArray);
                });
        })
}

form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
        alert('please enter valid data');
        return;
    }
    closeCreatePostModal();
// sync manager use for background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready
            .then(function (sw) {
                var post = {
                        id: new Date().toISOString(),
                        title: titleInput.value,
                        location: locationInput.value,
                        picture: picture,
                        rawLocation: fetchedLocation
                    }
                ;
                writeData('sync-posts', post)
                    .then(function () {
                        // assign sync task
                        return sw.sync.register('sync-new-posts')
                    })
                    .then(function () {
                        var snackBarContainer = document.getElementById('confirmation-toast');
                        var data = {message: 'your post was saved for syncing !'};
                        console.log(data.message);
                        snackBarContainer.MaterialSnackbar.showSnackbar(data);
                    })
                    .catch(function (err) {
                        console.log(err);
                    })
            })
    } else {
        // for browser dont support
        sendData();
    }
});

function openCreatePostModal() {
    intializeMedia();
    intializeLocation();
    createPostArea.style.display = 'block';
    if (defferdPrompt) {
        defferdPrompt.prompt();
        defferdPrompt.userChoice.then(function (choiceResult) {
            console.log(choiceResult.outcome);

            if (choiceResult.outcome === 'dismissed') {
                console.log('user canceled installation');
            } else {
                console.log('user accept installation');
            }
            defferdPrompt = null;
        })
    }
}

captureButton.addEventListener('click', function () {
    canvasElement.style.display = 'block';
    video.style.display = 'none';
    captureButton.style.display = 'none';

    var context = canvasElement.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, video.videoHeight / (video.videoWidth / canvas.width))
    video.srcObject.getVideoTracks().forEach(function (track) {
        track.stop()
    });
    picture = dataURItoBlob(canvasElement.toDataURL()) // convert base64 to blob
});

imagePicker.addEventListener('change', function (event) {
    picture = event.target.files[0];
});

function closeCreatePostModal() {
    imagePickerArea.style.display = 'none';
    video.style.display = 'none';
    canvasElement.style.display = 'none';
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    captureButton.style.display = 'inline';
    if(video.srcObject){
        video.srcObject.getVideoTracks().forEach(function (track) {
            track.stop();
        })
    }
    setTimeout(function () {
        createPostArea.style.transform = 'translateY(100vh)';
    },1)
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function onSaveButtonClicked(event) {
    // add something when some event is fired
    if ('caches' in window) {
        caches.open('user-requested')
            .then(function (cache) {
                cache.addAll(['https://httpbin.org/get', '/src/images/sf-boat.jpg'])
            })
    }
}

function clearCards() {
    while (sharedMomentsArea.hasChildNodes()) {
        sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
    }
}

function createCard(data) {
    var cardWrapper = document.createElement('div');
    cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
    var cardTitle = document.createElement('div');
    cardTitle.className = 'mdl-card__title';
    cardTitle.style.backgroundImage = 'url(' + data.image + ')';
    cardTitle.style.backgroundSize = 'cover';
    cardTitle.style.height = '180px';
    cardWrapper.appendChild(cardTitle);
    var cardTitleTextElement = document.createElement('h2');
    cardTitleTextElement.style.color = 'white';
    cardTitleTextElement.className = 'mdl-card__title-text';
    cardTitleTextElement.textContent = data.title;
    cardTitle.appendChild(cardTitleTextElement);
    var cardSupportingText = document.createElement('div');
    cardSupportingText.className = 'mdl-card__supporting-text';
    cardSupportingText.textContent = data.location;
    cardSupportingText.style.textAlign = 'center';

    /*  var cardSaveButton = document.createElement('button');
      cardSaveButton.textContent = 'Save';
      cardSaveButton.addEventListener('click', onSaveButtonClicked);
      cardSupportingText.appendChild(cardSaveButton);*/


    cardWrapper.appendChild(cardSupportingText);
    componentHandler.upgradeElement(cardWrapper);
    sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
    clearCards();
    for (let i = 0; i < data.length; i++) {
        createCard(data[i])
    }
}

var url = 'https://pwagram-b0804.firebaseio.com/posts.json';
var networkDataReceived = false;

fetch(url)
    .then(function (res) {
        return res.json();
    })
    .then(function (data) {
        networkDataReceived = true;
        console.log('From web', data);
        var dataArray = [];
        for (var key in data) {
            dataArray.push(data[key]);
        }
        updateUI(dataArray);
    });

if ('indexedDB' in window) {
    readAllData('posts')
        .then(function (data) {
            if (!networkDataReceived) {
                console.log('xhr from cache', data);
            }
        })
}