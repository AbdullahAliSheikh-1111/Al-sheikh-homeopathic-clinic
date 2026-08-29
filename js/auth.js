(function () {
    "use strict";

    var supabaseUrl = 'https://rvpolwwltlarxuuuwvws.supabase.co';
    var supabasePublishableKey = 'sb_publishable_vzPHDdimsa-G-7gndwVM8A_GxACuj2i';

    if (!window.supabase || !window.supabase.createClient) {
        console.error('Supabase JS SDK failed to load.');
        return;
    }

    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabasePublishableKey);
    var supabaseClient = window.supabaseClient;
    var authNav = document.getElementById('authNav');

    function getRedirectUrl(page) {
        return window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1) + page;
    }

    function showMessage(element, message, isError) {
        element.className = 'alert ' + (isError ? 'alert-danger' : 'alert-success');
        element.textContent = message;
        element.classList.remove('d-none');
    }

    function friendlyError(error) {
        var message = (error && error.message) || 'Something went wrong. Please try again.';
        if (message.toLowerCase().indexOf('invalid login credentials') !== -1) {
            return 'The email or password is incorrect.';
        }
        if (message.toLowerCase().indexOf('email not confirmed') !== -1) {
            return 'Please confirm your email address before logging in.';
        }
        if (message.toLowerCase().indexOf('already registered') !== -1) {
            return 'An account with this email already exists.';
        }
        return message;
    }

    function updateNavbar(user) {
        if (!authNav) {
            return;
        }
        authNav.innerHTML = '';
        if (user) {
            var name = (user.user_metadata && user.user_metadata.full_name) || user.email;
            authNav.innerHTML = '<a href="patient-dashboard.html" class="nav-item nav-link">' + name + '</a>' +
                '<button type="button" class="nav-item nav-link border-0 bg-transparent" id="logoutButton">Logout</button>';
            document.getElementById('logoutButton').addEventListener('click', function () {
                supabaseClient.auth.signOut().then(function () {
                    window.location.href = 'index.html';
                });
            });
        } else {
            authNav.innerHTML = '<a href="login.html" class="nav-item nav-link">Login</a>' +
                '<a href="signup.html" class="nav-item nav-link">Sign Up</a>';
        }
    }

    function setupSignup() {
        var form = document.getElementById('signupForm');
        if (!form) {
            return;
        }
        var message = document.getElementById('authMessage');
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var fullName = document.getElementById('fullName').value.trim();
            var email = document.getElementById('email').value.trim();
            var password = document.getElementById('password').value;
            var confirmPassword = document.getElementById('confirmPassword').value;
            if (password !== confirmPassword) {
                showMessage(message, 'Passwords do not match.', true);
                return;
            }
            var button = form.querySelector('button[type="submit"]');
            button.disabled = true;
            supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: { data: { full_name: fullName } }
            }).then(function (result) {
                if (result.error) {
                    throw result.error;
                }
                showMessage(message, 'Account created successfully! Please check your email to confirm your account before logging in.', false);
                form.reset();
            }).catch(function (error) {
                showMessage(message, friendlyError(error), true);
            }).finally(function () {
                button.disabled = false;
            });
        });
    }

    function setupLogin() {
        var form = document.getElementById('loginForm');
        if (!form) {
            return;
        }
        var message = document.getElementById('authMessage');
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var button = form.querySelector('button[type="submit"]');
            button.disabled = true;
            supabaseClient.auth.signInWithPassword({
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value
            }).then(function (result) {
                if (result.error) {
                    throw result.error;
                }
                window.location.href = 'index.html';
            }).catch(function (error) {
                showMessage(message, friendlyError(error), true);
            }).finally(function () {
                button.disabled = false;
            });
        });
    }

    function setupForgotPassword() {
        var form = document.getElementById('forgotPasswordForm');
        if (!form) {
            return;
        }
        var message = document.getElementById('authMessage');
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var button = form.querySelector('button[type="submit"]');
            button.disabled = true;
            supabaseClient.auth.resetPasswordForEmail(document.getElementById('email').value.trim(), {
                redirectTo: getRedirectUrl('update-password.html')
            }).then(function (result) {
                if (result.error) {
                    throw result.error;
                }
                showMessage(message, 'Password reset instructions have been sent. Please check your email.', false);
                form.reset();
            }).catch(function (error) {
                showMessage(message, friendlyError(error), true);
            }).finally(function () {
                button.disabled = false;
            });
        });
    }

    function setupUpdatePassword() {
        var form = document.getElementById('updatePasswordForm');
        if (!form) {
            return;
        }
        var message = document.getElementById('authMessage');
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var password = document.getElementById('password').value;
            var confirmPassword = document.getElementById('confirmPassword').value;
            if (password !== confirmPassword) {
                showMessage(message, 'Passwords do not match.', true);
                return;
            }
            var button = form.querySelector('button[type="submit"]');
            button.disabled = true;
            supabaseClient.auth.updateUser({ password: password }).then(function (result) {
                if (result.error) {
                    throw result.error;
                }
                showMessage(message, 'Your password has been updated successfully. You can now log in.', false);
                form.reset();
            }).catch(function (error) {
                showMessage(message, friendlyError(error), true);
            }).finally(function () {
                button.disabled = false;
            });
        });
    }

    function protectDashboard() {
        if (!document.getElementById('dashboardPage')) {
            return;
        }
        supabaseClient.auth.getSession().then(function (result) {
            if (!result.data.session) {
                window.location.href = 'login.html';
                return;
            }
            var user = result.data.session.user;
            var name = (user.user_metadata && user.user_metadata.full_name) || user.email;
            document.getElementById('patientName').textContent = name;
            document.getElementById('patientEmail').textContent = user.email;
        });
    }

    function setupDashboardLogout() {
        var button = document.getElementById('dashboardLogout');
        if (!button) {
            return;
        }
        button.addEventListener('click', function () {
            supabaseClient.auth.signOut().then(function () {
                window.location.href = 'index.html';
            });
        });
    }

    supabaseClient.auth.getSession().then(function (result) {
        updateNavbar(result.data.session && result.data.session.user);
    });
    supabaseClient.auth.onAuthStateChange(function (_event, session) {
        updateNavbar(session && session.user);
    });

    setupSignup();
    setupLogin();
    setupForgotPassword();
    setupUpdatePassword();
    protectDashboard();
    setupDashboardLogout();
}());
