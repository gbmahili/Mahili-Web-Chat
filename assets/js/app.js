$(document).ready(() => {    
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBEnMjAS0Bu5lUZx4aTdtIqQeQN90Upto0",
        authDomain: "mahili-quick-start.firebaseapp.com",
        databaseURL: "https://mahili-quick-start.firebaseio.com",
        projectId: "mahili-quick-start",
        storageBucket: "mahili-quick-start.appspot.com",
        messagingSenderId: "502164788776"
    };
    firebase.initializeApp(config);    
    // Create a database    
    var database = firebase.database();
    var singleMessageArray = [];
    // Call the database to render to the HTML
    database.ref().on("value", function (snap) {
        // Update the singleMessageArray using firebase data
        singleMessageArray = snap.val().allMessages;
        // Clear the discussion field.
        $(".discussion").empty();
        // Send a web notification on value change:
        var currentLoggedInUser = $("#current-user-names").attr("current-user-names");
        var lastMessageSender = singleMessageArray[singleMessageArray.length - 1][0];
        var lastMessageSent = singleMessageArray[singleMessageArray.length - 1][3];
        // Check if the user is logged-in: The $("#current-user-names").attr("current-user-names") grabs a name of the logged in user, which is created when a user logs in and renders it to the dom
        // Then, check if that user is not the one who sent the last message: Grab the name of the last message from the singleArrayMessage array
        if (currentLoggedInUser != undefined && currentLoggedInUser != lastMessageSender) {
            //So, if the user logged in is defined (means, it is not undefined) and the that user did not send the last message, we check if their browser supports notifications:
            if ("Notification" in window) {
                // If notifications are allowed, we request the user for permission:
                let ask = Notification.requestPermission();
                // Then, we can then check if we got permission or not:
                ask.then(function (permession) {
                    // IF permission was granted:                    
                    if (permession === "granted") {
                        //If permission was granted, we create the notification using the last message sender's name as the title
                        let msg = new Notification(lastMessageSender, {
                            // Then the body of the notification becomes the message they sent, the one we grabbed from the array
                            body: lastMessageSent,
                            // We also add an icon, if our database had images, we could have put the sender's image here
                            icon: "notification_icon.png"
                        });
                        // We can do something when a user clicks on the notification message here
                        // msg.addEventListener("click", function (event) {
                        //     console.log("Do something when the notification message is Clicked");
                        // });
                    } else {
                        // If permission was not granted, we can inform the user in the DOM, but will console log it for now.
                        console.log("Permession not granted, you can inform the user.");
                    }
                });
            }            
        }
               
    });

    // Grab form divs
    const loginForm = $(".login-form");
    const signUpForm = $(".sign-up-form");
    const chatArea = $(".chat-area");

    // Click to show Sign Up Form
    $(".create-account").click(() => {
        signUpForm.css("display", "block");
        loginForm.css("display", "none");
        $(".show-login").css("display", "block");
        $(".logout-button").css("display", "none");
        
    });
    // Click to show the login form
    $(".show-login").click(() => {
        signUpForm.css("display", "none");
        loginForm.css("display", "block");
        $(".show-login").css("display", "none");
    });

    // When a user signs up
    $("#sign-up").click(e => {
        // Don't reload the page
        e.preventDefault();
        // Grab element values
        const firstName = $("#first-name").val().trim();
        const lastName = $("#last-name").val().trim();
        const signUpEmail = $("#sign-up-email").val().trim();
        const signUpPassword = $("#sign-up-password").val().trim();        

        // Sign the user up:   
        //Create date they sign up:
        var dateAccountCreated = moment().format('l');
        //TODO: Make sure the email is validated
        const auth = firebase.auth();
        const promise = auth.createUserWithEmailAndPassword(signUpEmail, signUpPassword);
        promise
            .then(function (firebaseUser) {

                if (firebaseUser) {
                    // Add user to the RealTime Database
                    //Add to the database
                    database.ref().push({
                        firstName : firstName,
                        lastName : lastName,
                        email: signUpEmail,
                        dateAccountCreated : dateAccountCreated
                    });
                    console.log('User added to database');

                //Check if user is over 18 and show them the needed info
                } else {
                    console.log("Not sure what this error is for!");
                }
                //Only after a user is able to sign up, clear the input fields.
                $(".form-control").val("");
                // Show logout button
                $(".logout-button").css("display", "block");
                loginForm.css("display", "none");
                signUpForm.css("display", "none");
                chatArea.css("display", "block");
                $(".show-login").css("display", "none");
                $("#first-name").focus();
            })
            .catch(function (e) {
                $(".errorMessage").css("display", "block");
                $(".errorMessage").html("<div class='alert alert-danger'>" + e.message + "</div>");
                setTimeout(() => {
                    $(".errorMessage").css("display", "none");
                }, 5000);
            });
    });//-End of sign up

    // When a user logs in
    $("#login").click(e => {
        var allMessages = [];
        // Don't reload the page
        e.preventDefault();
        // Grab element values
        const loginEmail = $("#login-email").val().trim();
        const loginPassword = $("#login-password").val().trim();        

        // Login Process:        
        const auth = firebase.auth();
        const promise = auth.signInWithEmailAndPassword(loginEmail, loginPassword);
        promise
            .then(function (firebaseUser) {                
                //If the user exist
                if (firebaseUser) {
                    //1. First, get the user's email address
                    var currentUser = firebase.auth().currentUser;
                    var currentUserEmail;
                    //Check if we have a user
                    if (currentUser != null) {                        
                        //Get the user email and name from the database
                        database.ref().on("child_added", function (childSnapshot) {
                            var chatData = childSnapshot.val();
                            console.log(chatData);
                            //Get the user's email from the authentication system....
                            var currentUserEmail = currentUser.email;
                            
                            // Check if the user currently logged in exists in the database and only retrieve their email address and names
                            if (currentUserEmail === chatData.email) {
                                //Show messages:
                                //Get the user email from the database
                                var currentUserNames = chatData.firstName + " " + chatData.lastName;
                                var currentUserEmail = chatData.email;
                                
                                // Get current user's email and name, then display the name
                                $("#current-user-email").attr("current-user-email", currentUserEmail);
                                $("#current-user-names").attr("current-user-names", currentUserNames).text(currentUserNames);

                                // Next, retrieve all the messages from the database and show them to the user:
                                database.ref().on("value", function (snap) {
                                    //Update the allMessages using firebase data
                                    allMessages = snap.val().allMessages;
                                    // Append messages
                                    allMessages.forEach(element => {
                                        // First, we check who is logged in and check the name of the message sender
                                        var currentUserClass;
                                        // If the current user name matches the email of the person logged in
                                        if (currentUserNames == element[0]) {
                                            // We create a class called 'self'
                                            currentUserClass = "self";
                                        } else {
                                            // Otherwise, we create a class called 'other'
                                            currentUserClass = "other";
                                        }
                                        // We then use the class. In the css file, messages with 'self' show on right
                                        // While those with 'others' show up on the left
                                        singleMessage = `<li class="${currentUserClass}">
                                                            <div class="avatar"></div>
                                                            <div class="messages">
                                                                <b>${element[0]}</b> <time datetime="${element[1]} ${element[2]}">${element[1]} • ${element[2]}</time><br>
                                                                ${element[3]}
                                                            </div>
                                                        </li>`;
                                        // Then Append it to the DOM
                                        $(".discussion").append(singleMessage);
                                    });
                                    
                                });
                                // Hide some elements
                                $(".logout-button").css("display", "block");
                                loginForm.css("display", "none");
                                chatArea.css("display", "block");
                                // $("textarea").focus(); 
                                
                                // Show scroll down:
                                var vpWidth = $(window).width();
                                if (vpWidth <= 700) {
                                    $(".fa-angle-down").css("display", "inline-block");
                                    $(".fa-angle-up").css("display", "inline-block");
                                }
                                
                                //console.log(vpWidth);
                            }else{
                                //console.log("Can't see");
                            }
                        });
                    }
                } else {
                    console.log("The user is not logged in");
                }
            })
            .catch(function (e) {
                //Show message if we couldn't authenticate
                $(".errorMessage").css("display", "block");
                $(".errorMessage").html("<div class='alert alert-danger'>" + e.message + "</div>");
                setTimeout(() => {
                    $(".errorMessage").css("display", "none");
                }, 5000);
            });
        $(".form-control").val("");
    });//End of login

    // Watch for keyup in the login-password
    $('#login-password').keyup(function (e) {
        // If it is 'Enter'
        if (e.keyCode == 13) {
            // Click the login button
            $("#login").click();
        }
    });

    // Logout:
    $(".logout-button").click(e => {
        console.log("Log Out Button Clicked");
        firebase.auth().signOut();
        console.log("User has been loged out!");
        location.reload();
        console.log(allMessages);
        $("#current-user-names").text("No one is logged in!");
        
    });

    // Sending Message:

    // When a user presses enter while in the text area          
    $('#chat-message').keyup(function (e) {
        
        e.preventDefault();
        if (e.keyCode == 13) {
            $(".discussion").empty();
            //Get message typed
            var chatMessage = $("#chat-message").val().trim();
            //Get current user's name:
            var chatSender = $("#current-user-names").attr("current-user-names");
            // Get date sent
            var chatDate = moment().format('L');
            // Get time sent
            var chatTimeStamp = moment().format('LT');
            console.log(chatMessage, chatSender, chatDate, chatTimeStamp);

            // Save data into an array:
            database = firebase.database();
            // Push to the single Array
            //var singleMessageArray = [];
            singleMessageArray.push([chatSender, chatDate, chatTimeStamp, chatMessage]);
            // Save the chat message, date, sender and time to the database.
            database.ref("/allMessages");
            database.ref().update({"allMessages": singleMessageArray });
            // Empty the field where user enters chat message
            $("#chat-message").val("");

            // Scroll to the bottom of the last sent message:
            $("html, body").animate({
                scrollTop: $(".all-messages").offset().top + $(".all-messages")[0].scrollHeight
            }, 1000, function () {
                var messagesDiv = $('.all-messages');
                var height = messagesDiv[0].scrollHeight;
                messagesDiv.scrollTop(height);
            });
            return false; 
        }
    });

    // //Add a realtime listener: Keep checking if a user is logged in
    firebase.auth().onAuthStateChanged(firebaseUser => {        
        if (firebaseUser) {
            //Inform that the user is logged in:
            var currentUser = firebase.auth().currentUser;
            // Show scroll down:
            var vpWidth = $(window).width();
            if (vpWidth <= 700) {
                $(".fa-angle-down").css("display", "inline-block");
                $(".fa-angle-up").css("display", "inline-block");
            };
            //Check if we have a user
            if (currentUser != null) {
                // Watch for any change in the database then empty the discussion field...
                database.ref().on("child_added", function (childSnapshot) {                    
                    // Empty the discussion field
                    $(".discussion").empty();                    
                });
            };
        } else {
            $("#current-user-names").text("No one is logged in!");
        };
    });//-End of real time database    

    // Show Date in chat area using the momentjs library every second
    setInterval(function () {
        var ddate_time = moment().format('LLLL');   
        $("h5").text(ddate_time);
    }, 1000);
    // Check if the page has been refreshed, if it did, logout the user.
    window.onbeforeunload = function () {
        $(".logout-button").click();
    }

    $(".fa-toggle-on").click(() => {
        $(".fa-toggle-on").css("display","none");
        $(".fa-toggle-off").css("display", "inline-block");
        $(".company-info").css("display", "block");
    });
    $(".fa-toggle-off").click(() => {
        $(".fa-toggle-on").css("display", "inline-block");
        $(".fa-toggle-off").css("display", "none");
        $(".company-info").css("display", "none");
    });

    $(".fa-angle-down").click(() => {
        $("html, body").animate({
            scrollTop: $(".all-messages").offset().top + $(".all-messages")[0].scrollHeight
        }, 1000, function () {
            var messagesDiv = $('.all-messages');
            var height = messagesDiv[0].scrollHeight;
            messagesDiv.scrollTop(height);
        });
        return false;        
    });

    // Hide the company info on load on smaller devices:
    var vpWidth = $(window).width();    
    if (vpWidth <= 700) {
        $(".fa-angle-down").css("display", "inline-block");
        $(".fa-toggle-off").click();
    };
});//-End of document.ready