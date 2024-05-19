const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const http = require('http');
const os = require('os');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
// Connect to MongoDB
main_IP='192.168.0.136';

mongoose.connect(`mongodb://${main_IP}:27017/test`);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Define Message schema
const messageSchema = new mongoose.Schema({
    sender: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});
const User = mongoose.model('User', userSchema);

const Message = mongoose.model('Message', messageSchema);

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));


// API endpoint to save messages
app.post('/api/messages', async (req, res) => {
    const { sender, message } = req.body;
    try {
        const newMessage = new Message({ sender, message });
        await newMessage.save();
        res.status(201).json({ success: true, message: 'Message saved successfully' });
    } catch (err) {
        console.error('Error saving message:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// API endpoint to get all messages
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find();
        res.status(200).json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});


// API endpoint for user registration
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, password: hashedPassword });

        await newUser.save();
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});



// API endpoint for user login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Find the user by email
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Compare the provided password with the hashed password stored in the database
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, error: 'Incorrect password' });
        }
        res.status(200).json({ success: true, message: 'Login successful' });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Function to get CPU usage
//returns a json with the field idle that represents the part of the unused cpu and the field usage which is the portion of cpu being utilized
function getCpuUsage() {
    const cpus = os.cpus();
    let user = 0;
    let nice = 0;
    let sys = 0;
    let idle = 0;
    let irq = 0;
    let total = 0;

    for (let cpu of cpus) {
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        idle += cpu.times.idle;
        irq += cpu.times.irq;
    }

    total = user + nice + sys + idle + irq;
    return {
        idle: idle / total,
        usage: (total - idle) / total
    };
}

// Function to get the IP address
function getIpAddress() {
    const interfaces = os.networkInterfaces();
    for (let name of Object.keys(interfaces)) {
        for (let iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

// Function to send CPU usage and IP address every 10 seconds
function sendSystemInfo() {
    setInterval(() => {
        const cpuUsage = getCpuUsage();
        const ipAddress = getIpAddress();
        const systemInfo = {
            cpuUsage: cpuUsage.usage.toPrecision(5),
            ipAddress: ipAddress
        };

        // Replace with the actual endpoint you want to send the data to

        const postData = JSON.stringify(systemInfo);

        const options = {
            hostname: main_IP,
            port: 8085,
            path: '/api/system-info',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('System info sent:', JSON.parse(data));
            });
        });

        req.on('error', (err) => {
            console.error('Error sending system info:', err);
        });

        req.end(postData);

    }, 10000);
}

 

// Start the server and execute the function to send system info

app.listen(PORT, () => {
    console.log(`Server is running on http://${main_IP}:${PORT}`);
    sendSystemInfo();

});