// Test für die Registrierungsform


const assert = require('assert');
global.document = {
    getElementById: function(id) {
        return {
            value: 'test',
        };
    }
};

global.window = {};

function validateForm() {
    var email = document.getElementById('email').value;
    var confirmEmail = document.getElementById('email2').value;
    var password = document.getElementById('password').value;
    var confirmPassword = document.getElementById('password2').value;

    if (email !== confirmEmail) {
        return false;
    }

    if (password !== confirmPassword) {
        return false;
    }

    return true;
}

test('Form validation test', () => {
    document.getElementById = function(id) {
        if (id === 'email') {
            return { value: 'test@example.com' };
        } else if (id === 'email2') {
            return { value: 'test@example.com' };
        } else {
            return {};
        }
    };

    assert.strictEqual(validateForm(), true, 'E-Mail-Validierung fehlgeschlagen');

    document.getElementById = function(id) {
        if (id === 'password') {
            return { value: 'password123' };
        } else if (id === 'password2') {
            return { value: 'password123' };
        } else {
            return {};
        }
    };

    assert.strictEqual(validateForm(), true, 'Passwort-Validierung fehlgeschlagen');
});
