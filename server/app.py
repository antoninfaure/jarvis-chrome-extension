from flask import Flask
from flask_socketio import SocketIO
from openai import OpenAI
from threading import Thread, Event

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
client = OpenAI(base_url="http://localhost:1234/v1", api_key="not-needed")

@app.route('/')
def index():
    return "WebSocket Server"

history = []

# Global variable to control the completion process
stop_event = Event()
waiting = False

@socketio.on('newChat')
def new_chat():
    global history
    # Instructions for the LLM
    instructions = ("You are an intelligent assistant capable of understanding and responding "
                    "to queries based on provided context. Use the context from webpages "
                    "and user questions to generate informative and accurate answers. "
                    "Your responses should be based on the given context and should aim to "
                    "be helpful, clear, and concise."
                    "Format your response in markdown.")

    # Reset the history with the new instructions
    history = [{"role": "system", "content": instructions}]

@socketio.on('message')
def handle_message(data):
    global history
    
    user_input = data['message']
    context = data['context']

    # if context is the same as the last context (before last assistant and last user message), don't add it to the history
    if len(history) > 3:
        if history[-3]['content'] != "[CONTEXT] Webpage : " + context:
            history.append({ "role": "user", "content": "[CONTEXT] Webpage : " + context  })
    else:
        history.append({ "role": "user", "content": "[CONTEXT] Webpage : " + context })
    history.append({"role": "user", "content": user_input})

    # Reset the stop event
    stop_event.clear()

    # Start the completion in a separate thread
    thread = Thread(target=run_completion)
    thread.start()


def run_completion():
    global history

    waiting = True

    completion = client.chat.completions.create(
        model="local-model",
        messages=history,
        temperature=0.7,
        stream=True
    )

    new_message = {"role": "assistant", "content": ""}
    buffer = ""
    for chunk in completion:
        if waiting:
            socketio.emit('start')
            waiting = False
            
        # Check if stop event is set
        if stop_event.is_set():
            new_message['content'] = buffer
            history.append(new_message)
            break

        if chunk.choices[0].delta.content:
            buffer += chunk.choices[0].delta.content
            socketio.emit('response', {'content': chunk.choices[0].delta.content})

    new_message['content'] = buffer
    history.append(new_message)

    socketio.emit('end')

@socketio.on('stop')
def handle_stop():
    # Set the stop event
    stop_event.set()

if __name__ == '__main__':
    socketio.run(app, port=4321)