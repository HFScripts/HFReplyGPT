// ==UserScript==
// @name         Hackforums Post Extractor and Responder
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Extract posts and generate a response
// @author       Mr. Robot
// @match        https://hackforums.net/showthread.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const OPENAI_API_KEY = 'APIKEYHERE';  // replace with your OpenAI API key
    const USERNAME = 'Mr. Robot';  // replace with your username
    const ADD_DISCLAIMER = true;  // change to false if you don't want to add a disclaimer
    const MAX_TOKENS = 2000;  // maximum number of tokens that the OpenAI API accepts

    function extractPostsFromContainer() {
        const postsContainer = document.getElementById('posts_container');
        const posts = [];

        const postDivs = postsContainer.querySelectorAll('div.post.classic.clear');

        postDivs.forEach((postDiv) => {
            const post = {};

            const usernameElement = postDiv.querySelector('span.largetext a');
            if (usernameElement) {
                post.username = usernameElement.textContent.trim();
            }

            const postContentElement = postDiv.querySelector('div.post_body.scaleimages');
            if (postContentElement) {
                post.content = postContentElement.textContent.trim();
            }

            posts.push(post);
        });

        return posts;
    }

    function addDisclaimerToResponse(responseText) {
        const disclaimer = 'This is AI generated and is currently in testing';
        return disclaimer + responseText;
    }

    function calculateTokens(string) {
        // Returns a conservative estimate of the number of tokens in a string.
        return string.length;
    }

    function generateAndSendResponse(extractedPosts) {
        let combinedString = `INSTRUCTIONS:\nAs an AI, you are acting as ${USERNAME} in drafting replies on this thread. You are to provide advice or suggestions for ${USERNAME}'s responses, not to reply as if you were in the users situation. Remember not to impersonate other users except ${USERNAME} (Your username). If you have already replied in the thread, consider your replies as context. If you have not yet replied, provide an educated reply based on the conversation topic and the specific users involved.\n\nNOTE: The first message will be from the author of the thread. We should prioritize replying to them unless other conversation points need addressing. Use discretion to prioritize. If you have information to answer a question, answer it. Now, here are the posts:\n\n`;

        combinedString += '```'
        extractedPosts.forEach((post, index) => {
            const tempString = `Username: ${post.username}\n` + `Message: ${post.content}\n` + '------------------------------\n';
            if (calculateTokens(combinedString + tempString + '```') < MAX_TOKENS) {
                combinedString += tempString;
            } else {
                // Stop adding more posts if the token count would exceed the limit.
                return;
            }
        });
        combinedString += '```'

        console.log(combinedString);

        const endpoint = 'https://api.openai.com/v1/completions';
        const headers = {
            'Authorization': 'Bearer ' + OPENAI_API_KEY,
            'Content-Type': 'application/json',
        };

        const requestBody = JSON.stringify({
            model: 'text-davinci-002',
            prompt: combinedString,
            max_tokens: MAX_TOKENS,
        });

        fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: requestBody,
        })
        .then((response) => response.json())
        .then((data) => {
            console.log('Response from the API:', data);
            let responseText = data.choices[0].text;
            console.log('Response Text:', responseText);

            const messageTextarea = document.getElementById('message');
            if (messageTextarea) {
                if (ADD_DISCLAIMER) {
                    responseText = addDisclaimerToResponse(responseText);
                }
                messageTextarea.value = responseText;
            }
        })
        .catch((error) => {
            console.error('Error sending data to API:', error);
        });
    }

    const button = document.createElement('button');
    button.innerHTML = 'Generate Response';
    button.style.position = 'fixed';
    button.style.bottom = '10px';
    button.style.right = '10px';

    button.addEventListener('click', function() {
        const extractedPosts = extractPostsFromContainer();
        generateAndSendResponse(extractedPosts);
    });

    document.body.appendChild(button);
})();
