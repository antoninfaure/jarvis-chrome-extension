document.addEventListener('DOMContentLoaded', function() {
    const socket = io('http://localhost:4321');
    const questionInput = document.getElementById('question');
    const actionButton = document.getElementById('actionButton');
    const resetButton = document.getElementById('resetButton')
    const messagesContainer = document.getElementById('messages');

    // Markdown converter
    const converter = new showdown.Converter();
    
    questionInput.focus();
    questionInput.select();

    socket.emit('newChat')

    let buffer = ''
    let generating = false
    let waiting = false

    // Function to create messages to the chat container
    function createMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.innerHTML = message;
        messagesContainer.appendChild(messageElement);
    }

    // if enter key is pressed, send question
    questionInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            if (!generating) actionButton.click()
        }
    }
    )

    // If question is empty, disable send button
    function enableSendButton() {
        if (questionInput.value === '' && !generating) {
            actionButton.disabled = true;
        } else if (waiting) {
            actionButton.disabled = true;
        } else {
            actionButton.disabled = false;
        }
    }
    questionInput.addEventListener('input', enableSendButton);

    // Event listener for send button
    actionButton.addEventListener('click', sendQuestion)

    function switchAction() {
        if (waiting) {
            // show waiting message
            actionButton.innerHTML = 'Waiting for assistant'
            actionButton.disabled = true

        } else if (generating) {
            actionButton.innerHTML = 'Stop'
            actionButton.removeEventListener('click', sendQuestion)
            actionButton.addEventListener('click', stopGeneration)
        } else {
            actionButton.innerHTML = 'Send'
            actionButton.removeEventListener('click', stopGeneration)
            actionButton.addEventListener('click', sendQuestion)
        }
        enableSendButton()
    }
    // Event listener for reset button
    resetButton.addEventListener('click', function() {
        socket.emit('newChat')
        messagesContainer.innerHTML = ''
    })

    socket.on('start', function() {
        waiting = false
        switchAction()
    })

    // Event listener for sending a question
    function sendQuestion() {
        const question = questionInput.value;
        if (question === '') return; // If the input field is empty, do nothing
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                func: getPageContent,
            }, (results) => {
                // Send question along with page content
                socket.emit('message', { message: question, context: results[0].result });
                questionInput.value = ''; // Clear the input field
                if (messagesContainer.childElementCount > 0) {
                    messagesContainer.appendChild(document.createElement('hr'))
                }
                buffer = ''
                createMessage('<b>User</b>');
                createMessage(question);
                createMessage('<b>Assistant</b>');
                createMessage('');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                generating = true
                waiting = true
                switchAction()
            });
        });
    }

    function stopGeneration() {
        socket.emit('stop')
        generating = false
        waiting = false
        switchAction()
    }

    // Function to get the content of the current page
    function getPageContent() {
        return document.body.innerText;
    }

    // Receiving responses from the server
    socket.on('response', function(data) {
        buffer += data.content

        // Append the data.content to the last message
        const htmlContent = converter.makeHtml(buffer);
        messagesContainer.lastChild.innerHTML = htmlContent;
    });

    socket.on('end', function() {
        generating = false
        switchAction()
    })
});
