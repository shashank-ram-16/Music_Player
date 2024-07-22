import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-auth.js';

// Clear input fields when the page loads
window.addEventListener('load', () => {
    document.getElementById('username').value = '';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
});

const showAlert = (message) => {
    const alertContainer = document.getElementById('alert-container');
    const alertMessage = document.getElementById('alert-message');
    alertMessage.innerText = message;
    alertContainer.classList.remove('hidden');
};

const hideAlert = () => {
    const alertContainer = document.getElementById('alert-container');
    alertContainer.classList.add('hidden');
};

document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value; // Get username input

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Set a flag in localStorage indicating successful login
        localStorage.setItem('loginSuccess', 'true');
        window.location.href = 'index.html'; // Redirect to music page after successful login
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Login failed. Please check your credentials.');
    }
});

document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value; // Get username input

    if (password.length < 6) {
        showAlert('Password should be at least 6 characters long.');
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // Set a flag in localStorage indicating successful signup
        localStorage.setItem('loginSuccess', 'true');
        window.location.href = 'index.html'; // Redirect to music page after successful signup
    } catch (error) {
        console.error('Signup error:', error);
        switch (error.code) {
            case 'auth/weak-password':
                showAlert('Password should be at least 6 characters long.');
                break;
            case 'auth/email-already-in-use':
                showAlert('The email address is already in use by another account.');
                break;
            case 'auth/invalid-email':
                showAlert('The email address is not valid.');
                break;
            default:
                showAlert('Signup failed. Please try again.');
        }
    }
});

document.getElementById('close-alert').addEventListener('click', hideAlert);

document.addEventListener('DOMContentLoaded', function () {
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');
    const eyeOpen = document.getElementById('eyeOpen');
    const eyeClosed = document.getElementById('eyeClosed');

    togglePasswordButton.addEventListener('click', function () {
        // Toggle the type attribute
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle the eye icons
        eyeOpen.classList.toggle('hidden');
        eyeClosed.classList.toggle('hidden');
    });
});
