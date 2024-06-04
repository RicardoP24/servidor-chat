const messageInput = document.getElementById('message-input');
const loginUsernameInput = document.getElementById('login-username-input');
const loginPasswordInput = document.getElementById('login-password-input');
const registerUsernameInput = document.getElementById('register-username-input');
const registerPasswordInput = document.getElementById('register-password-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');
const auth = document.getElementById('auth');
const chatContainer = document.getElementById('chat-container');
sender = ''
zookeeper_IP= '192.168.0.135'
 
async function getBestServerIp() {
  
  //Alterar endereço de IP no dia do teste

  const response = await fetch(`http://${zookeeper_IP}:8085/api/best-server`);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  const resp = await response.json();

  console.log(resp)

  return resp.bestIp;
 
}


document.addEventListener('DOMContentLoaded', function () {

 
  // Call the fetchMessages function and handle the response
  fetchMessages()
    .then(messages => {
      if (messages) {
        // Process the messages as needed~
        for (let i of messages) {
          const messageElement = document.createElement('div');
          messageElement.innerHTML = `<strong>${i.sender}:</strong> ${i.message}`;
          chatMessages.appendChild(messageElement);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      } else {
        console.log('Failed to fetch messages');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });

  // Call the fetchMessages function and handle the response

  sendButton.addEventListener('click', function () {
    const message = messageInput.value;
    if (message.trim() !== '') {
      appendMessage(message);
      messageInput.value = '';
    }
  });

  async function appendMessage(message) {

    try {
      var ip=await getBestServerIp();
      console.log("Best IP: ",ip)

      const response = await fetch(`http://${ip}:3000/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sender, message })
      });

      const data = await response.json();
      if (data.success) {
        console.log('Message sent successfully');
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } else {
        console.error('Error sending message:', data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }


  async function fetchMessages() {


    try {
      var ip=await getBestServerIp();
      console.log("Best IP: ",ip)

 
      const response = await fetch(`http://${ip}:3000/api/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const messages = await response.json();
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return null;
    }

  }


});


async function register() {

  const username = registerUsernameInput.value;
  const password = registerPasswordInput.value;

  console.log(username, password)

  //query para o zookeeper

  //------------------------------//

  var ip= await getBestServerIp();
  console.log("Best IP: ",ip)

  const response = await fetch(`http://${ip}:3000/api/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();

  if (data.success) {
    auth.style.display = 'none';
    chatContainer.style.display = 'block';
    console.log(data)
    sender = username;
  } else {
    alert(data.error)
  }
}



async function login() {
  const username = loginUsernameInput.value;
  const password = loginPasswordInput.value;
  var ip=await getBestServerIp();
  console.log("Best IP: ",ip)

  const response = await fetch(`http://${ip}:3000/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();
  if (data.success) {
    auth.style.display = 'none';
    chatContainer.style.display = 'block';
    sender = username;
  } else {
    alert(data.error)
  }

}


