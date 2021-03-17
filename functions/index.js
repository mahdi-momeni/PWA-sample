const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
var webpush = require('web-push');
var formidable = require('formidable');
var fs = require('fs');
var UUID = require('uuid-v4');
var os = require("os");
var Busboy = require("busboy");
var path = require('path');


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
var serviceAccount = require("./pwagram-fb-key");

var gcconfig = {
    projectId: 'pwagram-b0804',
    keyFilename: 'pwagram-fb-key.json'
};
var gcs = require('@google-cloud/storage')(gcconfig);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pwagram-b0804.firebaseio.com/'
});


exports.storePostData = functions.https.onRequest(function(request, response) {
    cors(request, response, function() {
        var uuid = UUID();

        const busboy = new Busboy({ headers: request.headers });
        // These objects will store the values (file + fields) extracted from busboy
        let upload;
        const fields = {};

        // This callback will be invoked for each file uploaded
        busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
            console.log(
                `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
            );
            const filepath = path.join(os.tmpdir(), filename);
            upload = { file: filepath, type: mimetype };
            file.pipe(fs.createWriteStream(filepath));
        });

        // This will invoked on every field detected
        busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
            fields[fieldname] = val;
        });

        // This callback will be invoked after all uploaded files are saved.
        busboy.on("finish", () => {
            var bucket = gcs.bucket("pwagram-b0804.appspot.com");
            bucket.upload(
                upload.file,
                {
                    uploadType: "media",
                    metadata: {
                        metadata: {
                            contentType: upload.type,
                            firebaseStorageDownloadTokens: uuid
                        }
                    }
                },
                function(err, uploadedFile) {
                    if (!err) {
                        admin
                            .database()
                            .ref("posts")
                            .push({
                                id: fields.id,
                                title: fields.title,
                                location: fields.location,
                                image:
                                    "https://firebasestorage.googleapis.com/v0/b/" +
                                    bucket.name +
                                    "/o/" +
                                    encodeURIComponent(uploadedFile.name) +
                                    "?alt=media&token=" +
                                    uuid
                            })
                            .then(function() {
                                webpush.setVapidDetails(
                                    "mailto:business@academind.com",
                                    "BF7_aaPjZ_yw601MTqTVjt3LOA90yNOBwumiB0_kLYAvpJyuiP7o_1_bqpbZ-P1DlkmQdvDepYInLVN76Y-wZ-I",
                                    "YAr4NQGOdIT-LBiTwJBZrQvlGe1rc2-3JTSJAwQuTCI"
                                );
                                return admin
                                    .database()
                                    .ref("subscriptions")
                                    .once("value");
                            })
                            .then(function(subscriptions) {
                                subscriptions.forEach(function(sub) {
                                    var pushConfig = {
                                        endpoint: sub.val().endpoint,
                                        keys: {
                                            auth: sub.val().keys.auth,
                                            p256dh: sub.val().keys.p256dh
                                        }
                                    };

                                    webpush
                                        .sendNotification(
                                            pushConfig,
                                            JSON.stringify({
                                                title: "New Post",
                                                content: "New Post added!",
                                                openUrl: "/help"
                                            })
                                        )
                                        .catch(function(err) {
                                            console.log(err);
                                        });
                                });
                                response
                                    .status(201)
                                    .json({ message: "Data stored", id: fields.id });
                            })
                            .catch(function(err) {
                                response.status(500).json({ error: err });
                            });
                    } else {
                        console.log(err);
                    }
                }
            );
        });

        // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
        // a callback when it's finished.
        busboy.end(request.rawBody);
        // formData.parse(request, function(err, fields, files) {
        //   fs.rename(files.file.path, "/tmp/" + files.file.name);
        //   var bucket = gcs.bucket("pwagram-b0804.appspot.com");
        // });
    });
});













